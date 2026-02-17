/**
 * Type definitions for migration data structures
 * 
 * These types match the source API at https://api.inventorydifferent.com/graphql/
 */

// Source system types - matches the actual source API schema
export interface SourceDevice {
  // Core fields (aliased in query)
  deviceId: number;           // aliased from id
  accountId?: number;
  deviceName: string;
  additionalName?: string | null;
  deviceThumbnailUrl?: string | null;
  primaryDeviceImageId?: number | null;
  
  // Dates
  dateAcquired?: string | null;
  lastPowerOn?: string | null;
  createdAt?: string;
  updatedAt?: string;
  retrobrightedDate?: string | null;
  soldDate?: string | null;
  
  // Status
  status?: string;
  functionalStatus?: string;
  
  // Acquisition & Value
  priceAcquired?: number | null;
  estimatedValue?: number | null;
  acquiredFrom?: string | null;
  listPrice?: number | null;
  soldAmount?: number | null;
  
  // Category
  category?: string;          // aliased from categoryName
  categoryId?: number;
  categoryName?: string;
  
  // Device details
  manufacturer?: string | null;
  manufacturerModelNumber?: string | null;
  generalInfoUrl?: string | null;
  originalReleaseYear?: number | null;
  additionalInfo?: string | null;
  location?: string | null;
  serialNumber?: string | null;
  
  // Flags
  favorite?: boolean;
  assetTagged?: boolean;
  includesOriginalBox?: boolean;
  
  // Computer specs (nested object)
  computerInfo?: SourceComputerInfo | null;
  
  // Relations
  images?: SourceImage[];
  notes?: SourceNote[];
  tags?: SourceTag[];
  maintenanceTasks?: SourceMaintenanceTask[];
}

export interface SourceComputerInfo {
  processorType?: string | null;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  operatingSystem?: string | null;
  graphics?: string | null;
  hasWifi?: boolean | null;
  pramRemoved?: boolean | null;
}

export interface SourceCategory {
  id: number;
  name: string;
  type?: string;
  sortOrder?: number;
}

export interface SourceImage {
  deviceImageId: number;      // aliased from id
  imageDate?: string | null;  // aliased from date
  imageCaption?: string | null; // aliased from caption
  imageThumbnailUrl?: string | null; // aliased from thumbnailUrl
  imageUrl?: string | null;
  isStoreImage?: boolean;
}

export interface SourceNote {
  noteId: number;             // aliased from id
  noteDate: string;           // aliased from date
  note: string;               // the content
}

export interface SourceMaintenanceTask {
  id: number;
  deviceId?: number;
  labelText: string;
  completionDate: string;
  notes?: string | null;
}

export interface SourceTag {
  name: string;
}

// Export data structure
export interface ExportData {
  exportedAt: string;
  sourceApiUrl: string;
  devices: SourceDevice[];
  categories: SourceCategory[];
  tags: SourceTag[];
}

// Mapping structures
export interface IdMapping {
  [sourceId: number]: number;
}

export interface CategoryMapping {
  [sourceName: string]: {
    sourceId: number;
    targetId: number;
  };
}

// Migration result tracking
export interface MigrationResult {
  success: boolean;
  deviceId: number;
  sourceId: number;
  error?: string;
  imagesImported?: number;
  notesImported?: number;
  tasksImported?: number;
  tagsImported?: number;
}

export interface MigrationSummary {
  startedAt: string;
  completedAt: string;
  totalDevices: number;
  successfulDevices: number;
  failedDevices: number;
  totalImages: number;
  totalNotes: number;
  totalTasks: number;
  totalTags: number;
  errors: Array<{ deviceId: number; error: string }>;
}
