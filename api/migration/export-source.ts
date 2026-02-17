#!/usr/bin/env ts-node
/**
 * Export Source Data
 * 
 * Fetches all devices, categories, and tags from the source GraphQL API
 * and saves them to JSON files for migration.
 * 
 * Usage:
 *   SOURCE_API_URL=http://your-source-api/graphql ts-node migration/export-source.ts
 */

import fs from 'fs';
import path from 'path';
import config from './config';
import { ExportData, SourceDevice, SourceCategory, SourceTag } from './types';

// GraphQL query to fetch all devices with related data
// This matches the source API at https://api.inventorydifferent.com/graphql/
const DEVICES_QUERY = `
  query DevicesEndpointMirror {
    devices {
      deviceId: id
      accountId
      deviceName
      additionalName
      deviceThumbnailUrl
      primaryDeviceImageId
      dateAcquired
      lastPowerOn
      functionalStatus
      priceAcquired
      estimatedValue
      acquiredFrom
      category: categoryName
      categoryId
      categoryName
      manufacturer
      manufacturerModelNumber
      generalInfoUrl
      originalReleaseYear
      additionalInfo
      favorite
      assetTagged
      status
      listPrice
      location
      serialNumber
      includesOriginalBox
      retrobrightedDate
      soldDate
      soldAmount
      createdAt
      updatedAt

      computerInfo {
        processorType
        cpu 
        ram
        storage
        operatingSystem
        graphics
        hasWifi
        pramRemoved
      }

      images {
        deviceImageId: id
        imageDate: date
        imageCaption: caption
        imageThumbnailUrl: thumbnailUrl
        imageUrl
        isStoreImage
      }

      notes {
        noteId: id
        noteDate: date
        note
      }

      tags {
        name
      }

      maintenanceTasks {
        id
        deviceId
        labelText
        completionDate
        notes
      }
    }
  }
`;

interface GraphQLResponse {
  data?: any;
  errors?: any[];
}

async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Source API uses Bearer token auth
  if (config.sourceApiToken) {
    headers['Authorization'] = `Bearer ${config.sourceApiToken}`;
  }
  
  const response = await fetch(config.sourceApiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json() as GraphQLResponse;
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors, null, 2)}`);
  }
  
  return result.data as T;
}

async function exportDevices(): Promise<SourceDevice[]> {
  console.log('Fetching devices from source API...');
  const data = await fetchGraphQL<{ devices: SourceDevice[] }>(DEVICES_QUERY);
  console.log(`  Found ${data.devices.length} devices`);
  return data.devices;
}

// Extract unique categories from devices (source API doesn't have separate categories endpoint)
function extractCategories(devices: SourceDevice[]): SourceCategory[] {
  const categoryMap = new Map<number, SourceCategory>();
  
  for (const device of devices) {
    if (device.categoryId && device.categoryName) {
      if (!categoryMap.has(device.categoryId)) {
        categoryMap.set(device.categoryId, {
          id: device.categoryId,
          name: device.categoryName,
          type: 'OTHER', // Will be mapped during import based on name
        });
      }
    }
  }
  
  return Array.from(categoryMap.values());
}

// Extract unique tags from devices
function extractTags(devices: SourceDevice[]): SourceTag[] {
  const tagSet = new Set<string>();
  
  for (const device of devices) {
    if (device.tags) {
      for (const tag of device.tags) {
        tagSet.add(tag.name);
      }
    }
  }
  
  return Array.from(tagSet).map(name => ({ name }));
}

async function main() {
  console.log('='.repeat(60));
  console.log('Source Data Export');
  console.log('='.repeat(60));
  console.log(`Source API: ${config.sourceApiUrl}`);
  console.log('');
  
  try {
    // Ensure export directory exists
    const exportDir = path.resolve(config.exportDir);
    fs.mkdirSync(exportDir, { recursive: true });
    
    // Fetch devices from source API
    const devices = await exportDevices();
    
    // Extract categories and tags from devices
    const categories = extractCategories(devices);
    const tags = extractTags(devices);
    
    console.log(`  Extracted ${categories.length} categories`);
    console.log(`  Extracted ${tags.length} unique tags`);
    
    // Create export data structure
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      sourceApiUrl: config.sourceApiUrl,
      devices,
      categories,
      tags,
    };
    
    // Write combined export file
    const exportFile = path.resolve(config.devicesExportFile);
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log('');
    console.log(`Export saved to: ${exportFile}`);
    
    // Print summary
    console.log('');
    console.log('='.repeat(60));
    console.log('Export Summary');
    console.log('='.repeat(60));
    console.log(`  Devices: ${devices.length}`);
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Tags: ${tags.length}`);
    
    const totalImages = devices.reduce((sum, d) => sum + (d.images?.length || 0), 0);
    const totalNotes = devices.reduce((sum, d) => sum + (d.notes?.length || 0), 0);
    const totalTasks = devices.reduce((sum, d) => sum + (d.maintenanceTasks?.length || 0), 0);
    
    console.log(`  Total Images: ${totalImages}`);
    console.log(`  Total Notes: ${totalNotes}`);
    console.log(`  Total Maintenance Tasks: ${totalTasks}`);
    console.log('');
    console.log('Export complete!');
    
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
}

main();
