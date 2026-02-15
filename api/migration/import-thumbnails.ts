/**
 * Thumbnail Import Script
 * 
 * Downloads device thumbnails from the legacy API and sets them as the thumbnail image.
 * Legacy thumbnail URL pattern: https://api.inventorydifferent.com/devices/{deviceId}/device_thumbnail
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... ts-node migration/import-thumbnails.ts
 * 
 * Options:
 *   DRY_RUN=true - Preview without making changes
 *   DEVICE_IDS=1,2,3 - Only process specific devices
 *   DEVICE_LIMIT=10 - Limit number of devices to process
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import config, { filterDevices } from './config';
import { ExportData } from './types';

const prisma = new PrismaClient();

const LEGACY_API_BASE = 'https://api.inventorydifferent.com';

interface ThumbnailImportResult {
  deviceId: number;
  success: boolean;
  imageId?: number;
  error?: string;
}

/**
 * Downloads the device thumbnail from the legacy API
 */
async function downloadThumbnail(deviceId: number, targetDir: string): Promise<string | null> {
  const url = `${LEGACY_API_BASE}/devices/${deviceId}/device_thumbnail`;
  const filename = `thumbnail_${deviceId}.jpg`;
  const targetPath = path.join(targetDir, filename);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.sourceApiToken}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`    No thumbnail found for device ${deviceId}`);
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('image')) {
      console.log(`    No image returned for device ${deviceId} (got ${contentType})`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 100) {
      console.log(`    Thumbnail too small for device ${deviceId} (${buffer.byteLength} bytes)`);
      return null;
    }
    
    fs.writeFileSync(targetPath, Buffer.from(buffer));
    return targetPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`    Failed to download thumbnail for device ${deviceId}: ${errorMessage}`);
    return null;
  }
}

/**
 * Imports a device thumbnail and sets it as the thumbnail image
 */
async function importThumbnail(deviceId: number, targetUploadsPath: string): Promise<ThumbnailImportResult> {
  const deviceDir = path.join(targetUploadsPath, String(deviceId));
  
  // Check if device exists
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    return {
      deviceId,
      success: false,
      error: 'Device not found in database',
    };
  }
  
  // Check if device already has a thumbnail set
  const existingThumbnail = await prisma.image.findFirst({
    where: { deviceId, isThumbnail: true },
  });
  
  if (existingThumbnail) {
    console.log(`  Device ${deviceId}: Already has thumbnail (image ${existingThumbnail.id})`);
    return {
      deviceId,
      success: true,
      imageId: existingThumbnail.id,
      error: 'Already has thumbnail',
    };
  }
  
  if (config.dryRun) {
    console.log(`  [DRY RUN] Would download thumbnail for device ${deviceId}`);
    return { deviceId, success: true };
  }
  
  // Ensure device directory exists
  fs.mkdirSync(deviceDir, { recursive: true });
  
  // Download thumbnail from legacy API
  const thumbnailPath = await downloadThumbnail(deviceId, deviceDir);
  if (!thumbnailPath) {
    // No thumbnail available - set first image as thumbnail instead
    const firstImage = await prisma.image.findFirst({
      where: { deviceId },
      orderBy: { id: 'asc' },
    });
    
    if (firstImage) {
      await prisma.image.update({
        where: { id: firstImage.id },
        data: { isThumbnail: true },
      });
      console.log(`  Device ${deviceId}: Set first image as thumbnail (no legacy thumbnail)`);
      return { deviceId, success: true, imageId: firstImage.id };
    }
    
    return {
      deviceId,
      success: false,
      error: 'No thumbnail available and no images to use',
    };
  }
  
  // Web path for the thumbnail
  const filename = path.basename(thumbnailPath);
  const webPath = `/uploads/devices/${deviceId}/${filename}`;
  
  // Create image record and set as thumbnail
  // First, unset any existing thumbnails for this device
  await prisma.image.updateMany({
    where: { deviceId, isThumbnail: true },
    data: { isThumbnail: false },
  });
  
  // Create the thumbnail image record
  const imageRecord = await (prisma.image as any).create({
    data: {
      deviceId,
      path: webPath,
      dateTaken: new Date(),
      caption: 'Device thumbnail',
      isShopImage: false,
      isThumbnail: true,
    },
  });
  
  console.log(`  Device ${deviceId}: Downloaded and set thumbnail (image ${imageRecord.id})`);
  
  return {
    deviceId,
    success: true,
    imageId: imageRecord.id,
  };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Thumbnail Import');
  console.log('='.repeat(60));
  
  if (config.dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***');
  }
  console.log('');
  
  // Load export data to get device list
  const exportPath = path.resolve(config.devicesExportFile);
  if (!fs.existsSync(exportPath)) {
    console.error(`Export file not found: ${exportPath}`);
    console.error('Run export-source.ts first');
    process.exit(1);
  }
  
  const exportData: ExportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
  console.log(`Loaded export from: ${exportData.exportedAt}`);
  console.log(`Total devices: ${exportData.devices.length}`);
  console.log('');
  
  // Filter devices based on config
  const devicesToProcess = filterDevices(exportData.devices);
  console.log(`Processing ${devicesToProcess.length} devices`);
  console.log('');
  
  // Resolve target path
  const targetUploadsPath = path.resolve(config.localUploadsPath);
  
  // Import thumbnails
  const results: ThumbnailImportResult[] = [];
  
  for (const device of devicesToProcess) {
    const deviceId = typeof device.deviceId === 'string' 
      ? parseInt(device.deviceId, 10) 
      : device.deviceId;
    
    const result = await importThumbnail(deviceId, targetUploadsPath);
    results.push(result);
  }
  
  // Summary
  const successful = results.filter(r => r.success && !r.error?.includes('Already'));
  const alreadyHad = results.filter(r => r.error?.includes('Already'));
  const failed = results.filter(r => !r.success);
  
  console.log('');
  console.log('='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));
  console.log(`  Total devices: ${results.length}`);
  console.log(`  Thumbnails imported: ${successful.length}`);
  console.log(`  Already had thumbnail: ${alreadyHad.length}`);
  console.log(`  Failed/No thumbnail: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('');
    console.log('Failed imports:');
    failed.slice(0, 10).forEach(r => {
      console.log(`  Device ${r.deviceId}: ${r.error}`);
    });
    if (failed.length > 10) {
      console.log(`  ... and ${failed.length - 10} more`);
    }
  }
  
  console.log('');
  console.log('Thumbnail import complete!');
  
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('Import failed:', error);
  await prisma.$disconnect();
  process.exit(1);
});
