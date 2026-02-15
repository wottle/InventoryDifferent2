/**
 * Migration Configuration
 * 
 * Update these values before running the migration scripts.
 */

export const config = {
  // Source GraphQL API endpoint
  sourceApiUrl: process.env.SOURCE_API_URL || 'https://api.inventorydifferent.com/graphql/',
  
  // Source API authentication (plain token, not Bearer)
  sourceApiToken: process.env.SOURCE_API_TOKEN || '',
  
  // Target database URL (uses the same as the main app)
  targetDatabaseUrl: process.env.DATABASE_URL || '',
  
  // Path to source images on network drive
  // Images are stored flat with pattern: {deviceId}_{imageId}.jpg
  // Thumbnails: thumb_{deviceId}_{imageId}.jpg
  sourceImagesPath: process.env.SOURCE_IMAGES_PATH || '/Volumes/docker/inventory-different/images',
  
  // Target uploads directory
  targetUploadsPath: process.env.TARGET_UPLOADS_PATH || '/app/uploads/devices',
  
  // For local development, use this path (relative to project root, not api/)
  localUploadsPath: '../uploads/devices',
  
  // Export file paths
  exportDir: './migration/exports',
  devicesExportFile: './migration/exports/devices.json',
  categoriesExportFile: './migration/exports/categories.json',
  tagsExportFile: './migration/exports/tags.json',
  
  // Mapping files (source ID -> target ID)
  categoryMappingFile: './migration/mappings/categories.json',
  tagMappingFile: './migration/mappings/tags.json',
  
  // Batch sizes for API calls
  batchSize: 10,
  
  // Dry run mode - set to true to preview without making changes
  dryRun: process.env.DRY_RUN === 'true',
  
  // Limit number of devices to process (0 = no limit)
  // Useful for testing with a subset before running full migration
  deviceLimit: parseInt(process.env.DEVICE_LIMIT || '0', 10),
  
  // Specific device IDs to migrate (comma-separated, empty = all devices)
  // Example: DEVICE_IDS=1,5,10,15
  deviceIds: process.env.DEVICE_IDS 
    ? process.env.DEVICE_IDS.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
    : [],
};

/**
 * Filters devices based on deviceLimit and deviceIds config
 */
export function filterDevices<T extends { deviceId: number | string }>(devices: T[]): T[] {
  let filtered = devices;
  
  // Filter by specific device IDs if provided
  if (config.deviceIds.length > 0) {
    // Handle both string and number deviceId types
    filtered = filtered.filter(d => {
      const id = typeof d.deviceId === 'string' ? parseInt(d.deviceId, 10) : d.deviceId;
      return config.deviceIds.includes(id);
    });
    console.log(`Filtering to specific device IDs: ${config.deviceIds.join(', ')}`);
  }
  
  // Apply device limit if set
  if (config.deviceLimit > 0 && filtered.length > config.deviceLimit) {
    filtered = filtered.slice(0, config.deviceLimit);
    console.log(`Limiting to first ${config.deviceLimit} devices`);
  }
  
  return filtered;
}

export default config;
