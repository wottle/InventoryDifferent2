#!/usr/bin/env ts-node
/**
 * Import Related Data (Notes, Maintenance Tasks, Tags)
 * 
 * Imports notes, maintenance tasks, and tags for devices that have already
 * been imported via import-devices.ts.
 * 
 * Usage:
 *   DATABASE_URL=postgresql://... ts-node migration/import-related.ts
 * 
 * Options:
 *   DRY_RUN=true - Preview without making changes
 */

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import config, { filterDevices } from './config';
import { ExportData, SourceDevice, SourceNote, SourceMaintenanceTask, SourceTag } from './types';

const prisma = new PrismaClient();

interface RelatedImportResult {
  deviceId: number;
  notesImported: number;
  notesFailed: number;
  tasksImported: number;
  tasksFailed: number;
  tagsImported: number;
  tagsFailed: number;
  errors: string[];
}

async function importNotes(deviceId: number, notes: SourceNote[]): Promise<{ imported: number; failed: number; errors: string[] }> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const note of notes) {
    try {
      // Source fields: note (content), noteDate (date), noteId (id)
      const noteContent = note.note || '';
      if (config.dryRun) {
        console.log(`    [DRY RUN] Would create note: ${noteContent.substring(0, 50)}...`);
        imported++;
        continue;
      }
      
      await prisma.note.create({
        data: {
          deviceId,
          content: noteContent,
          date: new Date(note.noteDate),
        },
      });
      imported++;
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Note ${note.noteId}: ${errorMessage}`);
    }
  }
  
  return { imported, failed, errors };
}

async function importMaintenanceTasks(
  deviceId: number,
  tasks: SourceMaintenanceTask[]
): Promise<{ imported: number; failed: number; errors: string[] }> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const task of tasks) {
    try {
      // Source fields: labelText (label), completionDate (dateCompleted)
      if (config.dryRun) {
        console.log(`    [DRY RUN] Would create task: ${task.labelText}`);
        imported++;
        continue;
      }
      
      await prisma.maintenanceTask.create({
        data: {
          deviceId,
          label: task.labelText,
          dateCompleted: new Date(task.completionDate),
          notes: task.notes || null,
        },
      });
      imported++;
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Task ${task.id}: ${errorMessage}`);
    }
  }
  
  return { imported, failed, errors };
}

async function importTags(
  deviceId: number,
  tags: SourceTag[]
): Promise<{ imported: number; failed: number; errors: string[] }> {
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];
  
  for (const tag of tags) {
    try {
      if (config.dryRun) {
        console.log(`    [DRY RUN] Would add tag: ${tag.name}`);
        imported++;
        continue;
      }
      
      // Upsert the tag first
      const tagRecord = await prisma.tag.upsert({
        where: { name: tag.name },
        update: {},
        create: { name: tag.name },
      });
      
      // Connect tag to device
      await prisma.device.update({
        where: { id: deviceId },
        data: {
          tags: {
            connect: { id: tagRecord.id },
          },
        },
      });
      imported++;
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Tag ${tag.name}: ${errorMessage}`);
    }
  }
  
  return { imported, failed, errors };
}

async function importRelatedData(device: SourceDevice): Promise<RelatedImportResult> {
  // Convert deviceId to number (API returns string)
  const deviceId = typeof device.deviceId === 'string' ? parseInt(device.deviceId as string, 10) : device.deviceId;
  
  const result: RelatedImportResult = {
    deviceId: deviceId,
    notesImported: 0,
    notesFailed: 0,
    tasksImported: 0,
    tasksFailed: 0,
    tagsImported: 0,
    tagsFailed: 0,
    errors: [],
  };
  
  // Check if device exists in target database
  const existingDevice = await prisma.device.findUnique({
    where: { id: deviceId },
  });
  
  if (!existingDevice) {
    result.errors.push(`Device ${deviceId} not found in target database`);
    return result;
  }
  
  // Import notes
  if (device.notes && device.notes.length > 0) {
    const notesResult = await importNotes(deviceId, device.notes);
    result.notesImported = notesResult.imported;
    result.notesFailed = notesResult.failed;
    result.errors.push(...notesResult.errors);
  }
  
  // Import maintenance tasks
  if (device.maintenanceTasks && device.maintenanceTasks.length > 0) {
    const tasksResult = await importMaintenanceTasks(deviceId, device.maintenanceTasks);
    result.tasksImported = tasksResult.imported;
    result.tasksFailed = tasksResult.failed;
    result.errors.push(...tasksResult.errors);
  }
  
  // Import tags
  if (device.tags && device.tags.length > 0) {
    const tagsResult = await importTags(deviceId, device.tags);
    result.tagsImported = tagsResult.imported;
    result.tagsFailed = tagsResult.failed;
    result.errors.push(...tagsResult.errors);
  }
  
  return result;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Related Data Import (Notes, Tasks, Tags)');
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
    
    // Count totals
    const totalNotes = exportData.devices.reduce((sum, d) => sum + (d.notes?.length || 0), 0);
    const totalTasks = exportData.devices.reduce((sum, d) => sum + (d.maintenanceTasks?.length || 0), 0);
    const totalTags = exportData.devices.reduce((sum, d) => sum + (d.tags?.length || 0), 0);
    
    console.log(`Total notes to import: ${totalNotes}`);
    console.log(`Total maintenance tasks to import: ${totalTasks}`);
    console.log(`Total tag associations to import: ${totalTags}`);
    console.log('');
    
    // Filter devices based on config (deviceLimit, deviceIds)
    const devicesToProcess = filterDevices(exportData.devices);
    console.log(`Processing ${devicesToProcess.length} of ${exportData.devices.length} devices`);
    
    // Import related data for each device
    const results: RelatedImportResult[] = [];
    
    for (const device of devicesToProcess) {
      const hasRelatedData = 
        (device.notes && device.notes.length > 0) ||
        (device.maintenanceTasks && device.maintenanceTasks.length > 0) ||
        (device.tags && device.tags.length > 0);
      
      if (!hasRelatedData) continue;
      
      const deviceIdNum = typeof device.deviceId === 'string' ? parseInt(device.deviceId as string, 10) : device.deviceId;
      console.log(`Device ${deviceIdNum}: ${device.deviceName}`);
      const result = await importRelatedData(device);
      results.push(result);
      
      if (result.notesImported > 0 || result.notesFailed > 0) {
        console.log(`  Notes: ${result.notesImported} imported, ${result.notesFailed} failed`);
      }
      if (result.tasksImported > 0 || result.tasksFailed > 0) {
        console.log(`  Tasks: ${result.tasksImported} imported, ${result.tasksFailed} failed`);
      }
      if (result.tagsImported > 0 || result.tagsFailed > 0) {
        console.log(`  Tags: ${result.tagsImported} imported, ${result.tagsFailed} failed`);
      }
    }
    
    // Print summary
    const totalNotesImported = results.reduce((sum, r) => sum + r.notesImported, 0);
    const totalNotesFailed = results.reduce((sum, r) => sum + r.notesFailed, 0);
    const totalTasksImported = results.reduce((sum, r) => sum + r.tasksImported, 0);
    const totalTasksFailed = results.reduce((sum, r) => sum + r.tasksFailed, 0);
    const totalTagsImported = results.reduce((sum, r) => sum + r.tagsImported, 0);
    const totalTagsFailed = results.reduce((sum, r) => sum + r.tagsFailed, 0);
    const allErrors = results.flatMap(r => r.errors);
    
    console.log('');
    console.log('='.repeat(60));
    console.log('Import Summary');
    console.log('='.repeat(60));
    console.log(`  Notes: ${totalNotesImported} imported, ${totalNotesFailed} failed`);
    console.log(`  Maintenance Tasks: ${totalTasksImported} imported, ${totalTasksFailed} failed`);
    console.log(`  Tags: ${totalTagsImported} imported, ${totalTagsFailed} failed`);
    
    if (allErrors.length > 0) {
      console.log('');
      console.log('Errors:');
      allErrors.slice(0, 20).forEach(e => console.log(`  ${e}`));
      if (allErrors.length > 20) {
        console.log(`  ... and ${allErrors.length - 20} more`);
      }
    }
    
    console.log('');
    console.log('Related data import complete!');
    console.log('Next step: Run validate.ts to verify the migration');
    
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
