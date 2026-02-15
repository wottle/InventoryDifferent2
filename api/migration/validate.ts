#!/usr/bin/env ts-node
/**
 * Validate Migration
 * 
 * Compares the exported source data with the imported target data
 * to verify the migration was successful.
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... ts-node migration/validate.ts
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import config from './config';
import { ExportData } from './types';

const prisma = new PrismaClient();

interface ValidationResult {
  category: string;
  expected: number;
  actual: number;
  match: boolean;
  details?: string;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Migration Validation');
  console.log('='.repeat(60));
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
    console.log(`Comparing against export from: ${exportData.exportedAt}`);
    console.log('');
    
    const results: ValidationResult[] = [];
    
    // Validate device count
    const targetDeviceCount = await prisma.device.count({ where: { deleted: false } });
    results.push({
      category: 'Devices',
      expected: exportData.devices.length,
      actual: targetDeviceCount,
      match: targetDeviceCount >= exportData.devices.length,
    });
    
    // Validate category count
    const targetCategoryCount = await prisma.category.count();
    results.push({
      category: 'Categories',
      expected: exportData.categories.length,
      actual: targetCategoryCount,
      match: targetCategoryCount >= exportData.categories.length,
    });
    
    // Validate tag count
    const targetTagCount = await prisma.tag.count();
    const sourceTagCount = exportData.tags.length;
    results.push({
      category: 'Tags',
      expected: sourceTagCount,
      actual: targetTagCount,
      match: targetTagCount >= sourceTagCount,
    });
    
    // Validate image count
    const targetImageCount = await prisma.image.count();
    const sourceImageCount = exportData.devices.reduce((sum, d) => sum + (d.images?.length || 0), 0);
    results.push({
      category: 'Images',
      expected: sourceImageCount,
      actual: targetImageCount,
      match: targetImageCount >= sourceImageCount,
    });
    
    // Validate note count
    const targetNoteCount = await prisma.note.count();
    const sourceNoteCount = exportData.devices.reduce((sum, d) => sum + (d.notes?.length || 0), 0);
    results.push({
      category: 'Notes',
      expected: sourceNoteCount,
      actual: targetNoteCount,
      match: targetNoteCount >= sourceNoteCount,
    });
    
    // Validate maintenance task count
    const targetTaskCount = await prisma.maintenanceTask.count();
    const sourceTaskCount = exportData.devices.reduce((sum, d) => sum + (d.maintenanceTasks?.length || 0), 0);
    results.push({
      category: 'Maintenance Tasks',
      expected: sourceTaskCount,
      actual: targetTaskCount,
      match: targetTaskCount >= sourceTaskCount,
    });
    
    // Print results table
    console.log('Validation Results:');
    console.log('-'.repeat(50));
    console.log(`${'Category'.padEnd(20)} ${'Expected'.padStart(10)} ${'Actual'.padStart(10)} ${'Status'.padStart(8)}`);
    console.log('-'.repeat(50));
    
    for (const result of results) {
      const status = result.match ? '✓' : '✗';
      console.log(
        `${result.category.padEnd(20)} ${String(result.expected).padStart(10)} ${String(result.actual).padStart(10)} ${status.padStart(8)}`
      );
    }
    console.log('-'.repeat(50));
    
    // Spot check: Verify specific devices have their data
    console.log('');
    console.log('Spot Check - Sample Devices:');
    console.log('-'.repeat(50));
    
    const sampleDevices = exportData.devices.slice(0, 5);
    for (const sourceDevice of sampleDevices) {
      const targetDevice = await prisma.device.findUnique({
        where: { id: sourceDevice.deviceId },
        include: {
          category: true,
          images: true,
          notes: true,
          maintenanceTasks: true,
          tags: true,
        },
      });
      
      if (!targetDevice) {
        console.log(`  ✗ Device ${sourceDevice.deviceId} (${sourceDevice.deviceName}): NOT FOUND`);
        continue;
      }
      
      const issues: string[] = [];
      
      if (targetDevice.name !== sourceDevice.deviceName) {
        issues.push(`name mismatch`);
      }
      if ((sourceDevice.images?.length || 0) > targetDevice.images.length) {
        issues.push(`missing images (${targetDevice.images.length}/${sourceDevice.images?.length || 0})`);
      }
      if ((sourceDevice.notes?.length || 0) > targetDevice.notes.length) {
        issues.push(`missing notes (${targetDevice.notes.length}/${sourceDevice.notes?.length || 0})`);
      }
      if ((sourceDevice.maintenanceTasks?.length || 0) > targetDevice.maintenanceTasks.length) {
        issues.push(`missing tasks (${targetDevice.maintenanceTasks.length}/${sourceDevice.maintenanceTasks?.length || 0})`);
      }
      if ((sourceDevice.tags?.length || 0) > targetDevice.tags.length) {
        issues.push(`missing tags (${targetDevice.tags.length}/${sourceDevice.tags?.length || 0})`);
      }
      
      if (issues.length === 0) {
        console.log(`  ✓ Device ${sourceDevice.deviceId} (${sourceDevice.deviceName}): OK`);
      } else {
        console.log(`  ⚠ Device ${sourceDevice.deviceId} (${sourceDevice.deviceName}): ${issues.join(', ')}`);
      }
    }
    
    // Check for image files on disk
    console.log('');
    console.log('Image File Check:');
    console.log('-'.repeat(50));
    
    const uploadsPath = path.resolve(config.localUploadsPath);
    let imagesOnDisk = 0;
    let imagesMissing = 0;
    
    const targetImages = await prisma.image.findMany({
      take: 20,
      select: { id: true, path: true, deviceId: true },
    });
    
    for (const img of targetImages) {
      const filePath = path.join(uploadsPath, '..', img.path.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        imagesOnDisk++;
      } else {
        imagesMissing++;
        if (imagesMissing <= 5) {
          console.log(`  ✗ Missing: ${img.path}`);
        }
      }
    }
    
    console.log(`  Checked ${targetImages.length} images: ${imagesOnDisk} found, ${imagesMissing} missing`);
    
    // Overall status
    console.log('');
    console.log('='.repeat(60));
    const allPassed = results.every(r => r.match);
    if (allPassed) {
      console.log('✓ VALIDATION PASSED - Migration appears successful!');
    } else {
      console.log('⚠ VALIDATION WARNINGS - Some counts do not match');
      console.log('  Review the results above and re-run failed import steps if needed.');
    }
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
