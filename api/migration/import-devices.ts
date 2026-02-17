#!/usr/bin/env ts-node
/**
 * Import Devices with ID Preservation
 * 
 * Imports devices from the exported JSON file into the target database,
 * preserving the original device IDs for asset tag compatibility.
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... ts-node migration/import-devices.ts
 * 
 * Options:
 *   DRY_RUN=true - Preview without making changes
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import config, { filterDevices } from './config';
import { ExportData, SourceDevice, SourceCategory, CategoryMapping, MigrationResult } from './types';

const prisma = new PrismaClient();

// Parse date-only strings as local dates (not UTC)
// This prevents dates like "2023-05-29" from becoming May 28th in local time
function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // If it's a date-only string (YYYY-MM-DD), append T12:00:00 to treat as local noon
  // This avoids timezone issues where UTC midnight becomes previous day in local time
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T12:00:00');
  }
  return new Date(dateStr);
}

// Map source status values to target enum values
function mapStatus(sourceStatus?: string): 'AVAILABLE' | 'FOR_SALE' | 'PENDING_SALE' | 'SOLD' | 'DONATED' {
  const statusMap: Record<string, 'AVAILABLE' | 'FOR_SALE' | 'PENDING_SALE' | 'SOLD' | 'DONATED'> = {
    'AVAILABLE': 'AVAILABLE',
    'FOR_SALE': 'FOR_SALE',
    'PENDING_SALE': 'PENDING_SALE',
    'SOLD': 'SOLD',
    'DONATED': 'DONATED',
    // Add mappings for your source system's status values if different
  };
  return statusMap[sourceStatus || 'AVAILABLE'] || 'AVAILABLE';
}

function mapFunctionalStatus(sourceFunctionalStatus?: string): 'YES' | 'PARTIAL' | 'NO' {
  const statusMap: Record<string, 'YES' | 'PARTIAL' | 'NO'> = {
    'YES': 'YES',
    'PARTIAL': 'PARTIAL',
    'NO': 'NO',
    // Add mappings for your source system's functional status values if different
  };
  return statusMap[sourceFunctionalStatus || 'YES'] || 'YES';
}

function mapCategoryType(sourceType?: string): 'COMPUTER' | 'PERIPHERAL' | 'ACCESSORY' | 'OTHER' {
  const typeMap: Record<string, 'COMPUTER' | 'PERIPHERAL' | 'ACCESSORY' | 'OTHER'> = {
    'COMPUTER': 'COMPUTER',
    'PERIPHERAL': 'PERIPHERAL',
    'ACCESSORY': 'ACCESSORY',
    'OTHER': 'OTHER',
    // Add mappings for your source system's category types if different
  };
  return typeMap[sourceType || 'OTHER'] || 'OTHER';
}

// Map source category names to target category names (for case differences, etc.)
const CATEGORY_NAME_MAP: Record<string, string> = {
  'All-In-Ones': 'All-in-Ones',  // Source uses capital I, target uses lowercase i
};

async function ensureCategories(categories: SourceCategory[]): Promise<CategoryMapping> {
  console.log('Ensuring categories exist...');
  const mapping: CategoryMapping = {};
  
  for (const cat of categories) {
    // Map category name if needed
    const targetName = CATEGORY_NAME_MAP[cat.name] || cat.name;
    
    // Check if category exists by name
    let existing = await prisma.category.findUnique({
      where: { name: targetName },
    });
    
    if (!existing) {
      if (config.dryRun) {
        console.log(`  [DRY RUN] Would create category: ${targetName}`);
        mapping[cat.name] = { sourceId: cat.id, targetId: cat.id };
      } else {
        const created = await (prisma.category as any).create({
          data: {
            name: targetName,
            type: mapCategoryType(cat.type),
            sortOrder: cat.sortOrder || 0,
          },
        });
        console.log(`  Created category: ${targetName} (ID: ${created.id})`);
        mapping[cat.name] = { sourceId: cat.id, targetId: created.id };
      }
    } else {
      console.log(`  Category exists: ${targetName} (ID: ${existing.id})`);
      mapping[cat.name] = { sourceId: cat.id, targetId: existing.id };
    }
  }
  
  return mapping;
}

async function getMaxDeviceId(): Promise<number> {
  const result = await prisma.device.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  return result?.id || 0;
}

async function importDevice(
  device: SourceDevice,
  categoryMapping: CategoryMapping
): Promise<MigrationResult> {
  // Convert deviceId to number (API returns string)
  const deviceId = typeof device.deviceId === 'string' ? parseInt(device.deviceId, 10) : device.deviceId;
  
  // Source uses categoryName field (aliased as category in query)
  const categoryName = device.categoryName || device.category;
  if (!categoryName || !categoryMapping[categoryName]) {
    return {
      success: false,
      deviceId: 0,
      sourceId: deviceId,
      error: `Category not found: ${categoryName}`,
    };
  }
  
  const targetCategoryId = categoryMapping[categoryName].targetId;
  
  try {
    // Check if device with this ID already exists
    const existing = await prisma.device.findUnique({
      where: { id: deviceId },
    });
    
    if (existing) {
      console.log(`  Device ID ${deviceId} already exists, skipping...`);
      return {
        success: true,
        deviceId: deviceId,
        sourceId: deviceId,
        error: 'Already exists',
      };
    }
    
    if (config.dryRun) {
      console.log(`  [DRY RUN] Would import device: ${device.deviceName} (ID: ${deviceId})`);
      return {
        success: true,
        deviceId: deviceId,
        sourceId: deviceId,
      };
    }
    
    // Map source fields to target fields
    // Source: computerInfo.cpu, computerInfo.ram, etc.
    const cpu = device.computerInfo?.cpu || null;
    const ram = device.computerInfo?.ram || null;
    const graphics = device.computerInfo?.graphics || null;
    const storage = device.computerInfo?.storage || null;
    const operatingSystem = device.computerInfo?.operatingSystem || null;
    const isWifiEnabled = device.computerInfo?.hasWifi ?? null;
    const isPramBatteryRemoved = device.computerInfo?.pramRemoved ?? null;
    
    // Use raw SQL to insert with specific ID
    await prisma.$executeRaw`
      INSERT INTO "Device" (
        "id", "name", "additionalName", "manufacturer", "modelNumber", "serialNumber",
        "releaseYear", "location", "info", "isFavorite", "status", "functionalStatus",
        "lastPowerOnDate", "hasOriginalBox", "isAssetTagged", "dateAcquired", "whereAcquired",
        "priceAcquired", "estimatedValue", "listPrice", "soldPrice", "soldDate",
        "cpu", "ram", "graphics", "storage", "operatingSystem", "isWifiEnabled",
        "isPramBatteryRemoved", "deleted", "externalUrl", "categoryId"
      ) VALUES (
        ${deviceId},
        ${device.deviceName},
        ${device.additionalName || null},
        ${device.manufacturer || null},
        ${device.manufacturerModelNumber || null},
        ${device.serialNumber || null},
        ${device.originalReleaseYear || null},
        ${device.location || null},
        ${device.additionalInfo || null},
        ${device.favorite || false},
        ${mapStatus(device.status)}::"Status",
        ${mapFunctionalStatus(device.functionalStatus)}::"FunctionalStatus",
        ${parseLocalDate(device.lastPowerOn)},
        ${device.includesOriginalBox || false},
        ${device.assetTagged || false},
        ${parseLocalDate(device.dateAcquired)},
        ${device.acquiredFrom || null},
        ${device.priceAcquired || null},
        ${device.estimatedValue || null},
        ${device.listPrice || null},
        ${device.soldAmount || null},
        ${parseLocalDate(device.soldDate)},
        ${cpu},
        ${ram},
        ${graphics},
        ${storage},
        ${operatingSystem},
        ${isWifiEnabled},
        ${isPramBatteryRemoved},
        ${false},
        ${device.generalInfoUrl || null},
        ${targetCategoryId}
      )
    `;
    
    console.log(`  Imported device: ${device.deviceName} (ID: ${deviceId})`);
    
    return {
      success: true,
      deviceId: deviceId,
      sourceId: deviceId,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  Failed to import device ${deviceId}: ${errorMessage}`);
    return {
      success: false,
      deviceId: 0,
      sourceId: deviceId,
      error: errorMessage,
    };
  }
}

async function resetSequence(maxId: number) {
  if (config.dryRun) {
    console.log(`[DRY RUN] Would reset Device ID sequence to ${maxId + 1}`);
    return;
  }
  
  // Reset the PostgreSQL sequence to continue after the max ID
  await prisma.$executeRaw`SELECT setval('"Device_id_seq"', ${maxId}, true)`;
  console.log(`Reset Device ID sequence to ${maxId + 1}`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('Device Import');
  console.log('='.repeat(60));
  if (config.dryRun) {
    console.log('*** DRY RUN MODE - No changes will be made ***');
  }
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
    console.log(`  Devices: ${exportData.devices.length}`);
    console.log(`  Categories: ${exportData.categories.length}`);
    console.log('');
    
    // Ensure categories exist and get mapping
    const categoryMapping = await ensureCategories(exportData.categories);
    
    // Save category mapping
    const mappingsDir = path.dirname(path.resolve(config.categoryMappingFile));
    fs.mkdirSync(mappingsDir, { recursive: true });
    fs.writeFileSync(
      path.resolve(config.categoryMappingFile),
      JSON.stringify(categoryMapping, null, 2)
    );
    console.log('');
    
    // Filter devices based on config (deviceLimit, deviceIds)
    const devicesToImport = filterDevices(exportData.devices);
    console.log(`Importing ${devicesToImport.length} of ${exportData.devices.length} devices...`);
    
    const results: MigrationResult[] = [];
    let maxImportedId = 0;
    
    for (const device of devicesToImport) {
      const result = await importDevice(device, categoryMapping);
      results.push(result);
      if (result.success && result.deviceId > maxImportedId) {
        maxImportedId = result.deviceId;
      }
    }
    
    // Reset sequence to max ID
    const currentMaxId = await getMaxDeviceId();
    const finalMaxId = Math.max(currentMaxId, maxImportedId);
    if (finalMaxId > 0) {
      await resetSequence(finalMaxId);
    }
    
    // Print summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('');
    console.log('='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`  Total devices: ${results.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    
    if (failed > 0) {
      console.log('');
      console.log('Failed imports:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`  Device ${r.sourceId}: ${r.error}`));
    }
    
    console.log('');
    console.log('Device import complete!');
    console.log('Next step: Run import-images.ts to migrate images');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
