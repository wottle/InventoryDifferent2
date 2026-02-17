#!/usr/bin/env ts-node
/**
 * Import Images
 * 
 * Copies images from the source network drive to the target uploads directory
 * and creates Image records in the database.
 * 
 * Usage:
 *   SOURCE_IMAGES_PATH=/Volumes/NAS/images DATABASE_URL=postgresql://... ts-node migration/import-images.ts
 * 
 * Options:
 *   DRY_RUN=true - Preview without making changes
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import config, { filterDevices } from './config';
import { ExportData, SourceDevice, SourceImage } from './types';

const prisma = new PrismaClient();

// Sharp for thumbnail generation
let sharp: any;
try {
  sharp = require('sharp');
} catch {
  console.warn('Sharp not available, thumbnails will not be generated');
}

interface ImageImportResult {
  success: boolean;
  deviceId: number;
  imageId?: number;
  sourcePath: string;
  targetPath?: string;
  error?: string;
}

/**
 * Resolves the source image path from the network drive.
 * 
 * Source images are stored flat in /Volumes/docker/inventory-different/images/
 * with the naming pattern: {deviceId}_{imageId}.jpg
 * Thumbnails use: thumb_{deviceId}_{imageId}.jpg
 */
function resolveSourceImagePath(device: SourceDevice, image: SourceImage): string {
  // Build filename from deviceId and imageId: e.g., "123_456.jpg"
  // Note: deviceId and imageId may be strings from API
  const filename = `${device.deviceId}_${image.deviceImageId}.jpg`;
  return path.join(config.sourceImagesPath, filename);
}

/**
 * Resolves the source thumbnail path from the network drive.
 */
function resolveSourceThumbnailPath(device: SourceDevice, image: SourceImage): string {
  // Thumbnails use pattern: thumb_{deviceId}_{imageId}.jpg
  const filename = `thumb_${device.deviceId}_${image.deviceImageId}.jpg`;
  return path.join(config.sourceImagesPath, filename);
}

/**
 * Gets the target filename for an image
 */
function getTargetFilename(device: SourceDevice, image: SourceImage): string {
  return `${device.deviceId}_${image.deviceImageId}.jpg`;
}

/**
 * Generates a thumbnail for an image using sharp
 */
async function generateThumbnail(sourcePath: string, targetDir: string, filename: string): Promise<string | null> {
  if (!sharp) return null;
  
  try {
    const thumbDir = path.join(targetDir, 'thumbs');
    fs.mkdirSync(thumbDir, { recursive: true });
    
    const baseName = path.basename(filename, path.extname(filename));
    const thumbPath = path.join(thumbDir, `${baseName}.webp`);
    
    await sharp(sourcePath)
      .rotate()
      .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(thumbPath);
    
    return thumbPath;
  } catch (error) {
    console.warn(`  Failed to generate thumbnail: ${error}`);
    return null;
  }
}

async function importImage(
  device: SourceDevice,
  image: SourceImage,
  targetUploadsPath: string
): Promise<ImageImportResult> {
  // Convert deviceId to number (API returns string)
  const deviceId = typeof device.deviceId === 'string' ? parseInt(device.deviceId as string, 10) : device.deviceId;
  const imageId = typeof image.deviceImageId === 'string' ? parseInt(image.deviceImageId as string, 10) : image.deviceImageId;
  
  const sourcePath = resolveSourceImagePath(device, image);
  const sourceThumbPath = resolveSourceThumbnailPath(device, image);
  const filename = getTargetFilename(device, image);
  const deviceDir = path.join(targetUploadsPath, String(deviceId));
  const targetPath = path.join(deviceDir, filename);
  
  // Web-accessible path for database
  const webPath = `/uploads/devices/${deviceId}/${filename}`;
  
  try {
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        deviceId: deviceId,
        sourcePath,
        error: `Source file not found: ${sourcePath}`,
      };
    }
    
    if (config.dryRun) {
      console.log(`  [DRY RUN] Would copy: ${sourcePath} -> ${targetPath}`);
      return {
        success: true,
        deviceId: deviceId,
        sourcePath,
        targetPath,
      };
    }
    
    // Create device directory
    fs.mkdirSync(deviceDir, { recursive: true });
    
    // Copy file
    fs.copyFileSync(sourcePath, targetPath);
    
    // Copy existing thumbnail if it exists, otherwise generate one
    let thumbnailWebPath: string | null = null;
    const thumbDir = path.join(deviceDir, 'thumbs');
    fs.mkdirSync(thumbDir, { recursive: true });
    
    if (fs.existsSync(sourceThumbPath)) {
      // Copy existing thumbnail as-is (jpg format)
      const thumbBasename = path.basename(filename, '.jpg');
      const targetThumbPathJpg = path.join(thumbDir, `${thumbBasename}.jpg`);
      fs.copyFileSync(sourceThumbPath, targetThumbPathJpg);
      thumbnailWebPath = `/uploads/devices/${deviceId}/thumbs/${thumbBasename}.jpg`;
    } else {
      // Generate thumbnail if source doesn't exist
      const thumbDiskPath = await generateThumbnail(sourcePath, deviceDir, filename);
      if (thumbDiskPath) {
        const thumbFilename = path.basename(thumbDiskPath);
        thumbnailWebPath = `/uploads/devices/${deviceId}/thumbs/${thumbFilename}`;
      }
    }
    
    // Create database record
    // Map source fields: imageDate -> dateTaken, imageCaption -> caption, isStoreImage -> isShopImage
    // Note: thumbnailPath is optional - the new system can regenerate thumbnails if needed
    const imageData: any = {
      deviceId: deviceId,
      path: webPath,
      dateTaken: image.imageDate ? new Date(image.imageDate) : new Date(),
      caption: image.imageCaption || null,
      isShopImage: image.isStoreImage || false,
      isThumbnail: false, // Will set first image as thumbnail after all imports
    };
    
    // Only add thumbnailPath if we have one
    if (thumbnailWebPath) {
      imageData.thumbnailPath = thumbnailWebPath;
    }
    
    const imageRecord = await (prisma.image as any).create({
      data: imageData,
    });
    
    return {
      success: true,
      deviceId: deviceId,
      imageId: imageRecord.id,
      sourcePath,
      targetPath,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      deviceId: deviceId,
      sourcePath,
      error: errorMessage,
    };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Image Import');
  console.log('='.repeat(60));
  if (config.dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***');
  }
  console.log(`Source images path: ${config.sourceImagesPath}`);
  console.log(`Target uploads path: ${config.localUploadsPath}`);
  console.log('');
  
  try {
    // Load export data
    const exportFile = path.resolve(config.devicesExportFile);
    if (!fs.existsSync(exportFile)) {
      console.error(`Export file not found: ${exportFile}`);
      console.error('Run export-source.ts first to export data from the source system.');
      process.exit(1);
    }
    
    const exportData: ExportData = JSON.parse(fs.readFileSync(exportFile, 'utf-8'));
    console.log(`Loaded export from: ${exportData.exportedAt}`);
    
    // Count total images
    const totalImages = exportData.devices.reduce((sum, d) => sum + (d.images?.length || 0), 0);
    console.log(`Total images to import: ${totalImages}`);
    console.log('');
    
    // Resolve target path
    const targetUploadsPath = path.resolve(config.localUploadsPath);
    fs.mkdirSync(targetUploadsPath, { recursive: true });
    
    // Filter devices based on config (deviceLimit, deviceIds)
    const devicesToProcess = filterDevices(exportData.devices);
    console.log(`Processing ${devicesToProcess.length} of ${exportData.devices.length} devices`);
    
    // Import images for each device
    const results: ImageImportResult[] = [];
    let processedCount = 0;
    
    for (const device of devicesToProcess) {
      if (!device.images || device.images.length === 0) continue;
      
      console.log(`Device ${device.deviceId}: ${device.deviceName} (${device.images.length} images)`);
      
      for (const image of device.images) {
        const result = await importImage(device, image, targetUploadsPath);
        results.push(result);
        processedCount++;
        
        const filename = getTargetFilename(device, image);
        if (result.success) {
          console.log(`  ✓ ${filename}`);
        } else {
          console.log(`  ✗ ${filename}: ${result.error}`);
        }
      }
    }
    
    // Print summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('');
    console.log('='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`  Total images: ${results.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('');
      console.log('Failed imports:');
      results
        .filter(r => !r.success)
        .slice(0, 20) // Show first 20 failures
        .forEach(r => console.log(`  Device ${r.deviceId}: ${r.error}`));
      
      if (failed > 20) {
        console.log(`  ... and ${failed - 20} more`);
      }
    }
    
    console.log('');
    console.log('Image import complete!');
    console.log('Next step: Run import-related.ts to migrate notes, tasks, and tags');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
