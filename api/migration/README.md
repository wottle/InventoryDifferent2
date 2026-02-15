# Device Migration Toolkit

This toolkit migrates devices from a source GraphQL API to the InvDifferent2 system, preserving device IDs for asset tag compatibility.

## Prerequisites

1. Node.js and npm installed
2. Access to the source GraphQL API
3. Access to the source images (network drive mounted locally)
4. Target database running and accessible

## Configuration

Edit `config.ts` or set environment variables:

```bash
# Source API
export SOURCE_API_URL="http://your-source-api/graphql"
export SOURCE_API_TOKEN=""  # If authentication is required

# Target database
export DATABASE_URL="postgresql://user:pass@localhost:5432/invdifferent"

# Image paths
export SOURCE_IMAGES_PATH="/Volumes/NetworkDrive/device-images"
export TARGET_UPLOADS_PATH="/app/uploads/devices"

# Options
export DRY_RUN="true"  # Set to "true" to preview without changes
```

## Migration Steps

### Step 1: Export Source Data

Fetch all devices, categories, and tags from the source API:

```bash
cd api
npx ts-node migration/export-source.ts
```

This creates `migration/exports/devices.json` with all source data.

**Important:** Review and adjust the GraphQL queries in `export-source.ts` to match your source API schema.

### Step 2: Import Devices

Import devices with preserved IDs:

```bash
# Dry run first
DRY_RUN=true npx ts-node migration/import-devices.ts

# Then run for real
npx ts-node migration/import-devices.ts
```

This:
- Creates any missing categories
- Inserts devices with their original IDs
- Resets the PostgreSQL sequence for future inserts

### Step 3: Import Images

Copy images from the network drive and create database records:

```bash
# Dry run first
DRY_RUN=true npx ts-node migration/import-images.ts

# Then run for real
npx ts-node migration/import-images.ts
```

**Important:** Adjust the `resolveSourceImagePath()` function in `import-images.ts` to match how your source images are organized.

### Step 4: Import Related Data

Import notes, maintenance tasks, and tags:

```bash
# Dry run first
DRY_RUN=true npx ts-node migration/import-related.ts

# Then run for real
npx ts-node migration/import-related.ts
```

### Step 5: Validate

Verify the migration was successful:

```bash
npx ts-node migration/validate.ts
```

## Customization

### Source API Schema Differences

If your source API has different field names or structure:

1. **Edit `types.ts`** - Update the `Source*` interfaces to match your API
2. **Edit `export-source.ts`** - Adjust the GraphQL queries
3. **Edit `import-devices.ts`** - Update the mapping functions (`mapStatus`, `mapFunctionalStatus`, etc.)

### Image Path Resolution

The `import-images.ts` script tries multiple path patterns to find source images. Edit the `resolveSourceImagePath()` function to match your source image organization:

```typescript
// Option 1: By device ID folder
/Volumes/NAS/images/{deviceId}/photo.jpg

// Option 2: Full path from source
/Volumes/NAS/images/uploads/devices/{deviceId}/photo.jpg

// Option 3: Flat with device ID prefix
/Volumes/NAS/images/{deviceId}_photo.jpg
```

## Troubleshooting

### "Device ID already exists"
The device was already imported. This is safe to ignore.

### "Category not found"
The source device references a category that doesn't exist. Check the category mapping.

### "Source file not found"
The image file couldn't be found at the expected path. Check:
1. Network drive is mounted
2. `SOURCE_IMAGES_PATH` is correct
3. `resolveSourceImagePath()` matches your image organization

### PostgreSQL sequence issues
If new devices get conflicting IDs after migration, manually reset the sequence:

```sql
SELECT setval('"Device_id_seq"', (SELECT MAX(id) FROM "Device"), true);
```

## File Structure

```
migration/
├── config.ts           # Configuration settings
├── types.ts            # TypeScript type definitions
├── export-source.ts    # Export from source API
├── import-devices.ts   # Import devices with ID preservation
├── import-images.ts    # Copy images and create records
├── import-related.ts   # Import notes, tasks, tags
├── validate.ts         # Validation checks
├── exports/            # Exported JSON data
│   └── devices.json
└── mappings/           # ID mapping files
    └── categories.json
```
