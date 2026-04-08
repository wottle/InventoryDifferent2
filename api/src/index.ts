import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { typeDefs } from './typeDefs';
import { resolvers, generateThumbnailForUpload } from './resolvers';
import OpenAI from 'openai';
import {
    verifyAdminCredentials,
    getAdminUsername,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    isAuthConfigured,
} from './auth';
import { authMiddleware, requireAuth } from './middleware/auth';

const JSZip = require('jszip');
const sharp = require('sharp');
const unzipper = require('unzipper');

const defaultPrisma = new PrismaClient();

// Import progress tracking
interface ImportProgress {
    id: string;
    status: 'extracting' | 'processing' | 'complete' | 'error';
    totalDevices: number;
    processedDevices: number;
    currentDevice: string;
    results: any[];
    error?: string;
    startTime: number;
}

const importJobs = new Map<string, ImportProgress>();

// Export progress tracking
interface ExportProgress {
    id: string;
    status: 'preparing' | 'processing' | 'zipping' | 'complete' | 'error';
    totalDevices: number;
    processedDevices: number;
    totalImages: number;
    processedImages: number;
    currentDevice: string;
    error?: string;
    startTime: number;
    zipPaths: string[];  // Multiple ZIP parts
    currentPart: number;
    totalParts: number;
    deviceIds: number[];
    includeImages: boolean;
    compressImages: boolean;
}

const exportJobs = new Map<string, ExportProgress>();

// Clean up old jobs after 1 hour (skip in test environment)
const cleanupInterval = process.env.VITEST !== 'true' ? setInterval(() => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, job] of importJobs.entries()) {
        if (job.startTime < oneHourAgo) {
            importJobs.delete(id);
        }
    }
    for (const [id, job] of exportJobs.entries()) {
        if (job.startTime < oneHourAgo) {
            // Clean up export zip files if they exist
            if (job.zipPaths && job.zipPaths.length > 0) {
                for (const zipPath of job.zipPaths) {
                    if (fs.existsSync(zipPath)) {
                        try { fs.unlinkSync(zipPath); } catch (e) {}
                    }
                }
            }
            exportJobs.delete(id);
        }
    }
}, 5 * 60 * 1000) : null;

export interface Context {
    prisma: PrismaClient;
    isAuthenticated: boolean;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const deviceId = req.query.deviceId as string;
        const uploadDir = path.join('/app/uploads/devices', deviceId);

        // Create directory if it doesn't exist
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

export async function createApp(prismaOverride?: PrismaClient) {
    const prisma = prismaOverride || defaultPrisma;
    const app = express();

    // CORS configuration
    app.use(cors());

    app.use(express.json({ limit: '50mb' }));

    // Apply auth middleware to all routes (sets req.isAuthenticated)
    app.use(authMiddleware);

    // Serve static files from uploads directory
    app.use('/uploads', express.static('/app/uploads'));

    // ============== AUTH ENDPOINTS ==============

    // Login endpoint
    app.post('/auth/login', (req, res) => {
        const { username, password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        // If username is configured but not provided, reject
        const adminUsername = getAdminUsername();
        if (adminUsername && !username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (!isAuthConfigured()) {
            return res.status(500).json({ error: 'Authentication not configured. Set AUTH_PASSWORD environment variable.' });
        }

        if (!verifyAdminCredentials(username || null, password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken();
        const refreshToken = generateRefreshToken();

        return res.json({
            accessToken,
            refreshToken,
            expiresIn: 3600, // 1 hour in seconds
        });
    });

    // Refresh token endpoint
    app.post('/auth/refresh', (req, res) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        if (!verifyRefreshToken(refreshToken)) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const accessToken = generateAccessToken();
        const newRefreshToken = generateRefreshToken();

        return res.json({
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 3600,
        });
    });

    // Auth status endpoint
    app.get('/auth/status', (req, res) => {
        return res.json({
            authenticated: req.isAuthenticated ?? false,
            authRequired: isAuthConfigured(),
            usernameRequired: !!getAdminUsername(),
        });
    });

    // File upload endpoint (requires auth)
    app.post('/upload', requireAuth, upload.single('image'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const deviceId = req.query.deviceId as string;
        if (!deviceId) {
            // Delete the uploaded file if deviceId is missing
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'deviceId query parameter is required' });
        }

        // Return the path that can be used to access the image
        const imagePath = `/uploads/devices/${deviceId}/${req.file.filename}`;
        res.json({ path: imagePath });
    });

    // Import endpoint for ZIP files - now with streaming extraction
    // Store uploads to disk instead of memory for large files
    const importStorage = multer.diskStorage({
        destination: (req, file, cb) => {
            const tempDir = '/tmp/imports';
            fs.mkdirSync(tempDir, { recursive: true });
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            cb(null, `import-${uuidv4()}.zip`);
        }
    });

    const importUpload = multer({
        storage: importStorage,
        limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit for imports
    });

    // Progress endpoint for polling import status
    app.get('/import/progress/:jobId', (req, res) => {
        const job = importJobs.get(req.params.jobId);
        if (!job) {
            return res.status(404).json({ error: 'Import job not found' });
        }
        
        const response: any = {
            id: job.id,
            status: job.status,
            totalDevices: job.totalDevices,
            processedDevices: job.processedDevices,
            currentDevice: job.currentDevice,
            progress: job.totalDevices > 0 ? Math.round((job.processedDevices / job.totalDevices) * 100) : 0,
        };
        
        if (job.error) {
            response.error = job.error;
        }
        
        // Always include results when complete or if there are any results
        if (job.status === 'complete' || job.status === 'error') {
            response.results = job.results;
        }
        
        res.json(response);
    });

    app.post('/admin/wipe', async (req, res) => {
        const adminToken = process.env.ADMIN_TOKEN;
        if (!adminToken) {
            return res.status(404).json({ error: 'Not found' });
        }

        const providedToken = (req.header('x-admin-token') || req.header('X-Admin-Token') || '').trim();
        if (!providedToken || providedToken !== adminToken) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const confirm = req.body?.confirm;
        if (confirm !== 'WIPE_DEVICES') {
            return res.status(400).json({
                error: 'Confirmation required',
                required: { confirm: 'WIPE_DEVICES' },
            });
        }

        const clearUploads = req.body?.clearUploads === true;

        try {
            // Wipe device-related tables and reset identities
            await prisma.$executeRawUnsafe(`
TRUNCATE TABLE
  "Image",
  "Note",
  "MaintenanceTask",
  "_DeviceToTag",
  "Device"
RESTART IDENTITY CASCADE;
`);

            if (clearUploads) {
                const devicesDir = path.join('/app/uploads/devices');
                if (fs.existsSync(devicesDir)) {
                    const entries = fs.readdirSync(devicesDir);
                    for (const entry of entries) {
                        fs.rmSync(path.join(devicesDir, entry), { recursive: true, force: true });
                    }
                }
            }

            return res.json({ ok: true, wiped: 'devices', clearedUploads: clearUploads });
        } catch (e: any) {
            return res.status(500).json({ error: e?.message || 'Wipe failed' });
        }
    });

    // Helper function to process a single device
    async function processDevice(
        deviceData: any,
        extractDir: string,
        idMapping: Record<number, number>
    ): Promise<any> {
        const desiredDeviceId = Number(deviceData.id);
        if (!Number.isInteger(desiredDeviceId) || desiredDeviceId <= 0) {
            throw new Error(`Invalid device id: ${deviceData.id}`);
        }
        // Find or create category
        let category = await prisma.category.findFirst({
            where: { name: deviceData.category.name }
        });
        
        if (!category) {
            category = await (prisma.category as any).create({
                data: {
                    name: deviceData.category.name,
                    type: deviceData.category.type || 'OTHER',
                    sortOrder: deviceData.category.sortOrder || 0,
                }
            });
        }

        // Find or create location by name
        let locationId: number | null = null;
        if (deviceData.location) {
            let location = await prisma.location.findFirst({
                where: { name: deviceData.location }
            });
            if (!location) {
                location = await prisma.location.create({
                    data: { name: deviceData.location }
                });
            }
            locationId = location.id;
        }

        // Check if device with this ID already exists
        const existingDevice = await prisma.device.findUnique({
            where: { id: desiredDeviceId }
        });

        let newDevice;
        const deviceCreateData = {
            name: deviceData.name,
            additionalName: deviceData.additionalName,
            manufacturer: deviceData.manufacturer,
            modelNumber: deviceData.modelNumber,
            serialNumber: deviceData.serialNumber,
            releaseYear: deviceData.releaseYear,
            locationId,
            info: deviceData.info,
            isFavorite: deviceData.isFavorite || false,
            externalUrl: deviceData.externalUrl,
            status: deviceData.status || 'COLLECTION',
            functionalStatus: deviceData.functionalStatus || 'YES',
            condition: deviceData.condition ?? null,
            rarity: deviceData.rarity ?? null,
            hasOriginalBox: deviceData.hasOriginalBox || false,
            isAssetTagged: deviceData.isAssetTagged || false,
            dateAcquired: deviceData.dateAcquired ? new Date(deviceData.dateAcquired) : null,
            whereAcquired: deviceData.whereAcquired,
            priceAcquired: deviceData.priceAcquired,
            estimatedValue: deviceData.estimatedValue,
            listPrice: deviceData.listPrice,
            soldPrice: deviceData.soldPrice,
            soldDate: deviceData.soldDate ? new Date(deviceData.soldDate) : null,
            cpu: deviceData.cpu,
            ram: deviceData.ram,
            graphics: deviceData.graphics,
            storage: deviceData.storage,
            operatingSystem: deviceData.operatingSystem,
            isWifiEnabled: deviceData.isWifiEnabled,
            isPramBatteryRemoved: deviceData.isPramBatteryRemoved,
            lastPowerOnDate: deviceData.lastPowerOnDate ? new Date(deviceData.lastPowerOnDate) : null,
            categoryId: category!.id,
        };

        if (existingDevice) {
            // If a prior import already created this device (or it already exists), keep the ID and refresh data.
            // Also clear related rows so re-import doesn't duplicate children.
            await prisma.image.deleteMany({ where: { deviceId: desiredDeviceId } });
            await prisma.note.deleteMany({ where: { deviceId: desiredDeviceId } });
            await prisma.maintenanceTask.deleteMany({ where: { deviceId: desiredDeviceId } });
            await (prisma as any).deviceAccessory.deleteMany({ where: { deviceId: desiredDeviceId } });
            await (prisma as any).deviceLink.deleteMany({ where: { deviceId: desiredDeviceId } });
            await (prisma as any).customFieldValue.deleteMany({ where: { deviceId: desiredDeviceId } });
            await prisma.device.update({
                where: { id: desiredDeviceId },
                data: {
                    ...deviceCreateData,
                    tags: { set: [] },
                },
            });

            newDevice = await prisma.device.findUnique({ where: { id: desiredDeviceId } });
            idMapping[desiredDeviceId] = desiredDeviceId;
        } else {
            // Prefer preserving ID via normal Prisma create (lets Postgres enforce constraints cleanly)
            try {
                newDevice = await prisma.device.create({
                    data: {
                        id: desiredDeviceId,
                        ...deviceCreateData,
                    },
                });
                await prisma.$executeRaw`SELECT setval('"Device_id_seq"', (SELECT GREATEST(MAX(id), 1) FROM "Device"))`;
                idMapping[desiredDeviceId] = desiredDeviceId;
            } catch (insertError) {
                // Fallback: create with auto-generated ID if there's a conflict or the DB rejects explicit id.
                newDevice = await prisma.device.create({
                    data: deviceCreateData,
                });
                idMapping[desiredDeviceId] = newDevice.id;
            }
        }

        if (!newDevice) {
            throw new Error('Failed to create device');
        }

        const actualDeviceId = idMapping[desiredDeviceId];

        // Import images from extracted directory
        if (deviceData.images && deviceData.images.length > 0) {
            const deviceUploadDir = path.join('/app/uploads/devices', String(actualDeviceId));
            fs.mkdirSync(deviceUploadDir, { recursive: true });
            const thumbsDir = path.join(deviceUploadDir, 'thumbs');
            fs.mkdirSync(thumbsDir, { recursive: true });

            const hasExportedThumbnail = deviceData.images.some((img: any) => img.isThumbnail === true);

            for (let i = 0; i < deviceData.images.length; i++) {
                const imageData = deviceData.images[i];
                const exportedFilename = imageData.exportedFilename;
                
                if (exportedFilename) {
                    const extractedImagePath = path.join(extractDir, exportedFilename);
                    if (fs.existsSync(extractedImagePath)) {
                        const originalFilename = path.basename(exportedFilename);
                        const newFilename = `${uuidv4()}${path.extname(originalFilename)}`;
                        const imagePath = path.join(deviceUploadDir, newFilename);
                        
                        // Copy file instead of reading into memory
                        fs.copyFileSync(extractedImagePath, imagePath);

                        // Generate thumbnail
                        let thumbnailPath = null;
                        try {
                            const thumbFilename = `${path.basename(newFilename, path.extname(newFilename))}.webp`;
                            const thumbPath = path.join(thumbsDir, thumbFilename);
                            await sharp(imagePath)
                                .rotate()
                                .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
                                .webp({ quality: 70 })
                                .toFile(thumbPath);
                            thumbnailPath = `/uploads/devices/${actualDeviceId}/thumbs/${thumbFilename}`;
                        } catch (thumbErr) {
                            console.error('Error generating thumbnail:', thumbErr);
                        }

                        const shouldBeThumbnail = hasExportedThumbnail 
                            ? (imageData.isThumbnail === true)
                            : (i === 0);

                        await (prisma.image as any).create({
                            data: {
                                deviceId: actualDeviceId,
                                path: `/uploads/devices/${actualDeviceId}/${newFilename}`,
                                thumbnailPath,
                                caption: imageData.caption,
                                dateTaken: imageData.dateTaken ? new Date(imageData.dateTaken) : new Date(),
                                isThumbnail: shouldBeThumbnail,
                                isShopImage: imageData.isShopImage || false,
                                thumbnailMode: imageData.thumbnailMode || 'BOTH',
                                isListingImage: imageData.isListingImage || false,
                            }
                        });
                    }
                }
            }
        }

        // Import notes
        if (deviceData.notes && deviceData.notes.length > 0) {
            for (const noteData of deviceData.notes) {
                await prisma.note.create({
                    data: {
                        deviceId: actualDeviceId,
                        content: noteData.content,
                        date: noteData.date ? new Date(noteData.date) : new Date(),
                    }
                });
            }
        }

        // Import maintenance tasks
        if (deviceData.maintenanceTasks && deviceData.maintenanceTasks.length > 0) {
            for (const taskData of deviceData.maintenanceTasks) {
                await prisma.maintenanceTask.create({
                    data: {
                        deviceId: actualDeviceId,
                        label: taskData.label,
                        dateCompleted: taskData.dateCompleted ? new Date(taskData.dateCompleted) : new Date(),
                        notes: taskData.notes,
                        cost: taskData.cost ?? null,
                    }
                });
            }
        }

        // Import accessories
        if (deviceData.accessories && deviceData.accessories.length > 0) {
            for (const accessoryData of deviceData.accessories) {
                await (prisma as any).deviceAccessory.upsert({
                    where: { deviceId_name: { deviceId: actualDeviceId, name: accessoryData.name } },
                    update: {},
                    create: { deviceId: actualDeviceId, name: accessoryData.name },
                });
            }
        }

        // Import links
        if (deviceData.links && deviceData.links.length > 0) {
            for (const linkData of deviceData.links) {
                await (prisma as any).deviceLink.create({
                    data: { deviceId: actualDeviceId, label: linkData.label, url: linkData.url },
                });
            }
        }

        // Import custom fields
        if (deviceData.customFields && deviceData.customFields.length > 0) {
            for (const cfData of deviceData.customFields) {
                const customField = await (prisma as any).customField.upsert({
                    where: { name: cfData.fieldName },
                    update: {},
                    create: { name: cfData.fieldName },
                });
                await (prisma as any).customFieldValue.upsert({
                    where: { customFieldId_deviceId: { customFieldId: customField.id, deviceId: actualDeviceId } },
                    update: { value: cfData.value },
                    create: { customFieldId: customField.id, deviceId: actualDeviceId, value: cfData.value },
                });
            }
        }

        // Import tags
        if (deviceData.tags && deviceData.tags.length > 0) {
            for (const tagData of deviceData.tags) {
                const tag = await prisma.tag.upsert({
                    where: { name: tagData.name },
                    update: {},
                    create: { name: tagData.name },
                });
                await prisma.device.update({
                    where: { id: actualDeviceId },
                    data: {
                        tags: { connect: { id: tag.id } }
                    }
                });
            }
        }

        return {
            originalId: desiredDeviceId,
            newId: actualDeviceId,
            name: deviceData.name,
            status: 'success',
            idPreserved: desiredDeviceId === actualDeviceId,
        };
    }

    // Helper to clean up temp files
    function cleanupTempFiles(zipPath: string, extractDir: string) {
        try {
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
            if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }
    }

    app.post('/import', requireAuth, importUpload.single('file'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const jobId = uuidv4();
        const zipPath = req.file.path;
        const extractDir = path.join('/tmp/imports', `extract-${jobId}`);

        // Initialize progress tracking
        const job: ImportProgress = {
            id: jobId,
            status: 'extracting',
            totalDevices: 0,
            processedDevices: 0,
            currentDevice: '',
            results: [],
            startTime: Date.now(),
        };
        importJobs.set(jobId, job);

        // Return job ID immediately so client can poll for progress
        res.json({ jobId, message: 'Import started' });

        // Process in background
        (async () => {
            try {
                // Extract ZIP using streaming
                fs.mkdirSync(extractDir, { recursive: true });
                
                await new Promise<void>((resolve, reject) => {
                    fs.createReadStream(zipPath)
                        .pipe(unzipper.Extract({ path: extractDir }))
                        .on('close', resolve)
                        .on('error', reject);
                });

                // Read devices.json
                const devicesJsonPath = path.join(extractDir, 'devices.json');
                if (!fs.existsSync(devicesJsonPath)) {
                    throw new Error('Invalid import file: devices.json not found');
                }

                const devicesJsonContent = fs.readFileSync(devicesJsonPath, 'utf-8');
                const exportData = JSON.parse(devicesJsonContent);

                if (!exportData.devices || !Array.isArray(exportData.devices)) {
                    throw new Error('Invalid import file: no devices array found');
                }

                job.status = 'processing';
                job.totalDevices = exportData.devices.length;

                const idMapping: Record<number, number> = {};
                const CHUNK_SIZE = 5; // Process 5 devices at a time

                // Process devices in chunks
                for (let i = 0; i < exportData.devices.length; i += CHUNK_SIZE) {
                    const chunk = exportData.devices.slice(i, i + CHUNK_SIZE);
                    
                    // Process chunk sequentially (to avoid DB conflicts)
                    for (const deviceData of chunk) {
                        job.currentDevice = deviceData.name || `Device ${deviceData.id}`;
                        
                        try {
                            const result = await processDevice(deviceData, extractDir, idMapping);
                            job.results.push(result);
                        } catch (deviceError: any) {
                            job.results.push({
                                originalId: deviceData.id,
                                name: deviceData.name,
                                status: 'error',
                                error: deviceError.message,
                            });
                        }
                        
                        job.processedDevices++;
                    }

                    // Small delay between chunks to prevent overwhelming the system
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                job.status = 'complete';
                job.currentDevice = '';

                // Clean up temp files
                cleanupTempFiles(zipPath, extractDir);

            } catch (error: any) {
                console.error('Import error:', error);
                job.status = 'error';
                job.error = error.message || 'Import failed';
                
                // Clean up temp files on error
                cleanupTempFiles(zipPath, extractDir);
            }
        })();
    });

    // ============== EXPORT ENDPOINTS ==============
    
    const MAX_PART_SIZE = 500 * 1024 * 1024; // 500MB per part
    
    // Start export job (requires auth)
    app.post('/export/start', requireAuth, express.json(), async (req, res) => {
        const { deviceIds, includeImages = true, compressImages = false } = req.body;
        
        if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
            return res.status(400).json({ error: 'deviceIds array is required' });
        }

        const jobId = uuidv4();
        
        const job: ExportProgress = {
            id: jobId,
            status: 'preparing',
            totalDevices: deviceIds.length,
            processedDevices: 0,
            totalImages: 0,
            processedImages: 0,
            currentDevice: '',
            startTime: Date.now(),
            zipPaths: [],
            currentPart: 1,
            totalParts: 1,
            deviceIds,
            includeImages,
            compressImages,
        };
        exportJobs.set(jobId, job);

        // Respond immediately so the client can start polling
        res.json({ jobId, message: 'Export started' });

        // Process in background
        (async () => {
            try {
                const exportDir = path.join('/tmp/exports', jobId);
                fs.mkdirSync(exportDir, { recursive: true });
                
                if (includeImages) {
                    fs.mkdirSync(path.join(exportDir, 'images'), { recursive: true });
                }

                job.status = 'processing';

                // Count total images for progress tracking (non-blocking)
                if (includeImages) {
                    const imageCounts = await prisma.device.findMany({
                        where: { id: { in: deviceIds } },
                        select: { images: { select: { id: true } } },
                    });
                    job.totalImages = imageCounts.reduce((acc, d) => acc + d.images.length, 0);
                }

                // Fetch all device data with relations
                const allDevices = await prisma.device.findMany({
                    where: { id: { in: deviceIds } },
                    include: {
                        category: true,
                        images: true,
                        notes: true,
                        maintenanceTasks: true,
                        tags: true,
                        location: true,
                        accessories: true,
                        links: true,
                        customFieldValues: { include: { customField: true } },
                    }
                });

                const exportData: any = {
                    exportDate: new Date().toISOString(),
                    exportVersion: "2.0",
                    deviceCount: allDevices.length,
                    includesImages: includeImages,
                    compressedImages: compressImages,
                    devices: [],
                };

                let currentPartSize = 0;
                let currentPartDevices: any[] = [];
                const partExportDirs: string[] = [];
                let partNumber = 1;

                // Helper to finalize a part
                const finalizePart = async (isLast: boolean) => {
                    if (currentPartDevices.length === 0) return;

                    const partDir = path.join('/tmp/exports', `${jobId}-part${partNumber}`);
                    fs.mkdirSync(partDir, { recursive: true });

                    // Copy images for this part's devices
                    if (includeImages) {
                        const imagesDir = path.join(partDir, 'images');
                        fs.mkdirSync(imagesDir, { recursive: true });
                        
                        for (const deviceExport of currentPartDevices) {
                            if (deviceExport.images && deviceExport.images.length > 0) {
                                const srcDir = path.join(exportDir, 'images', String(deviceExport.id));
                                const destDir = path.join(imagesDir, String(deviceExport.id));
                                if (fs.existsSync(srcDir)) {
                                    await fs.promises.cp(srcDir, destDir, { recursive: true });
                                }
                            }
                        }
                    }

                    // Write part's devices.json
                    const partData = {
                        ...exportData,
                        partNumber,
                        totalParts: 0, // Will be updated
                        deviceCount: currentPartDevices.length,
                        devices: currentPartDevices,
                    };
                    await fs.promises.writeFile(
                        path.join(partDir, 'devices.json'),
                        JSON.stringify(partData, null, 2)
                    );

                    partExportDirs.push(partDir);
                    currentPartDevices = [];
                    currentPartSize = 0;
                    partNumber++;
                    job.currentPart = partNumber;
                };

                // Process each device
                for (const device of allDevices) {
                    job.currentDevice = device.name || `Device ${device.id}`;

                    const deviceExport: any = {
                        id: device.id,
                        name: device.name,
                        additionalName: device.additionalName,
                        manufacturer: device.manufacturer,
                        modelNumber: device.modelNumber,
                        serialNumber: device.serialNumber,
                        releaseYear: device.releaseYear,
                        location: (device as any).location?.name ?? null,
                        info: device.info,
                        isFavorite: device.isFavorite,
                        externalUrl: device.externalUrl,
                        status: device.status,
                        functionalStatus: device.functionalStatus,
                        condition: device.condition,
                        rarity: device.rarity,
                        hasOriginalBox: device.hasOriginalBox,
                        isAssetTagged: device.isAssetTagged,
                        dateAcquired: device.dateAcquired,
                        whereAcquired: device.whereAcquired,
                        priceAcquired: device.priceAcquired,
                        estimatedValue: device.estimatedValue,
                        listPrice: device.listPrice,
                        soldPrice: device.soldPrice,
                        soldDate: device.soldDate,
                        cpu: device.cpu,
                        ram: device.ram,
                        graphics: device.graphics,
                        storage: device.storage,
                        operatingSystem: device.operatingSystem,
                        isWifiEnabled: device.isWifiEnabled,
                        isPramBatteryRemoved: device.isPramBatteryRemoved,
                        lastPowerOnDate: device.lastPowerOnDate,
                        category: {
                            id: device.category.id,
                            name: device.category.name,
                            type: device.category.type,
                            sortOrder: (device.category as any).sortOrder,
                        },
                        images: [],
                        notes: device.notes.map(n => ({
                            id: n.id,
                            content: n.content,
                            date: n.date,
                        })),
                        maintenanceTasks: device.maintenanceTasks.map(t => ({
                            id: t.id,
                            label: t.label,
                            dateCompleted: t.dateCompleted,
                            notes: t.notes,
                            cost: t.cost,
                        })),
                        tags: device.tags.map(t => ({
                            id: t.id,
                            name: t.name,
                        })),
                        accessories: (device as any).accessories.map((a: any) => ({
                            name: a.name,
                        })),
                        links: (device as any).links.map((l: any) => ({
                            label: l.label,
                            url: l.url,
                        })),
                        customFields: (device as any).customFieldValues.map((cfv: any) => ({
                            fieldName: cfv.customField.name,
                            value: cfv.value,
                        })),
                    };

                    let deviceImageSize = 0;

                    // Process images
                    if (includeImages && device.images.length > 0) {
                        const deviceImagesDir = path.join(exportDir, 'images', String(device.id));
                        fs.mkdirSync(deviceImagesDir, { recursive: true });

                        for (const image of device.images) {
                            const sourcePath = path.join('/app/uploads', image.path.replace('/uploads/', ''));
                            const filename = path.basename(image.path);
                            let destPath = path.join(deviceImagesDir, filename);
                            let exportFilename = filename;

                            if (fs.existsSync(sourcePath)) {
                                const stats = await fs.promises.stat(sourcePath);
                                
                                // Optionally compress images
                                if (compressImages && /\.(jpg|jpeg|png)$/i.test(filename)) {
                                    try {
                                        const compressedFilename = `${path.basename(filename, path.extname(filename))}.jpg`;
                                        const compressedPath = path.join(deviceImagesDir, compressedFilename);
                                        await sharp(sourcePath)
                                            .rotate()
                                            .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
                                            .jpeg({ quality: 80 })
                                            .toFile(compressedPath);
                                        destPath = compressedPath;
                                        exportFilename = compressedFilename;
                                        const compressedStats = await fs.promises.stat(compressedPath);
                                        deviceImageSize += compressedStats.size;
                                    } catch (compressErr) {
                                        // Fall back to copy
                                        await fs.promises.copyFile(sourcePath, destPath);
                                        deviceImageSize += stats.size;
                                    }
                                } else {
                                    await fs.promises.copyFile(sourcePath, destPath);
                                    deviceImageSize += stats.size;
                                }
                            }

                            deviceExport.images.push({
                                id: image.id,
                                path: image.path,
                                thumbnailPath: (image as any).thumbnailPath,
                                caption: image.caption,
                                dateTaken: image.dateTaken,
                                isThumbnail: image.isThumbnail,
                                isShopImage: image.isShopImage,
                                thumbnailMode: (image as any).thumbnailMode,
                                isListingImage: (image as any).isListingImage,
                                exportedFilename: `images/${device.id}/${exportFilename}`,
                            });

                            job.processedImages++;
                        }
                    } else {
                        deviceExport.images = device.images.map(img => ({
                            id: img.id,
                            path: img.path,
                            thumbnailPath: (img as any).thumbnailPath,
                            caption: img.caption,
                            dateTaken: img.dateTaken,
                            isThumbnail: img.isThumbnail,
                            isShopImage: img.isShopImage,
                            thumbnailMode: (img as any).thumbnailMode,
                            isListingImage: (img as any).isListingImage,
                            exportedFilename: null,
                        }));
                    }

                    // Check if we need to start a new part
                    if (currentPartSize + deviceImageSize > MAX_PART_SIZE && currentPartDevices.length > 0) {
                        await finalizePart(false);
                    }

                    currentPartDevices.push(deviceExport);
                    currentPartSize += deviceImageSize;
                    job.processedDevices++;
                }

                // Finalize last part
                await finalizePart(true);

                job.status = 'zipping';
                job.currentDevice = '';
                job.totalParts = partExportDirs.length;

                // Create ZIP files for each part
                const archiver = require('archiver');
                
                for (let i = 0; i < partExportDirs.length; i++) {
                    job.currentPart = i + 1;
                    const partDir = partExportDirs[i];
                    
                    // Update totalParts in the JSON
                    const jsonPath = path.join(partDir, 'devices.json');
                    const partData = JSON.parse(await fs.promises.readFile(jsonPath, 'utf-8'));
                    partData.totalParts = partExportDirs.length;
                    await fs.promises.writeFile(jsonPath, JSON.stringify(partData, null, 2));
                    
                    const zipPath = path.join('/tmp/exports', `${jobId}-part${i + 1}.zip`);
                    const output = fs.createWriteStream(zipPath);
                    const archive = archiver('zip', { zlib: { level: 5 } });

                    await new Promise<void>((resolve, reject) => {
                        output.on('close', resolve);
                        archive.on('error', reject);
                        
                        archive.pipe(output);
                        archive.directory(partDir, false);
                        archive.finalize();
                    });

                    job.zipPaths.push(zipPath);
                    
                    // Clean up part directory
                    await fs.promises.rm(partDir, { recursive: true, force: true });
                }

                job.status = 'complete';
                job.currentDevice = '';

                // Clean up main export directory
                await fs.promises.rm(exportDir, { recursive: true, force: true });

            } catch (error: any) {
                console.error('Export error:', error);
                job.status = 'error';
                job.error = error.message || 'Export failed';
            }
        })();
    });

    // Get export progress
    app.get('/export/progress/:jobId', (req, res) => {
        const job = exportJobs.get(req.params.jobId);
        if (!job) {
            return res.status(404).json({ error: 'Export job not found' });
        }

        const deviceProgress = job.totalDevices > 0 
            ? Math.round((job.processedDevices / job.totalDevices) * 100) 
            : 0;
        const imageProgress = job.totalImages > 0 
            ? Math.round((job.processedImages / job.totalImages) * 100) 
            : 100;

        res.json({
            id: job.id,
            status: job.status,
            totalDevices: job.totalDevices,
            processedDevices: job.processedDevices,
            totalImages: job.totalImages,
            processedImages: job.processedImages,
            currentDevice: job.currentDevice,
            currentPart: job.currentPart,
            totalParts: job.totalParts,
            deviceProgress,
            imageProgress,
            overallProgress: job.includeImages 
                ? Math.round((deviceProgress * 0.3) + (imageProgress * 0.7))
                : deviceProgress,
            error: job.error,
            downloadReady: job.status === 'complete',
            parts: job.status === 'complete' ? job.zipPaths.length : undefined,
        });
    });

    // Download completed export (specific part)
    app.get('/export/download/:jobId/:partNumber?', (req, res) => {
        const job = exportJobs.get(req.params.jobId);
        if (!job) {
            return res.status(404).json({ error: 'Export job not found' });
        }

        if (job.status !== 'complete' || job.zipPaths.length === 0) {
            return res.status(400).json({ error: 'Export not ready for download' });
        }

        const partNumber = parseInt(req.params.partNumber || '1', 10);
        const partIndex = partNumber - 1;

        if (partIndex < 0 || partIndex >= job.zipPaths.length) {
            return res.status(400).json({ error: `Invalid part number. Available parts: 1-${job.zipPaths.length}` });
        }

        const zipPath = job.zipPaths[partIndex];
        if (!fs.existsSync(zipPath)) {
            return res.status(404).json({ error: 'Export file not found' });
        }

        const timestamp = new Date(job.startTime).toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const partSuffix = job.zipPaths.length > 1 ? `-part${partNumber}of${job.zipPaths.length}` : '';
        res.download(zipPath, `inventory-export-${timestamp}${partSuffix}.zip`);
    });

    // ============== AI IMAGE GENERATION ==============

    const DEFAULT_IMAGE_PROMPT =
        'Create a professional product photograph of this vintage computer device on a dark background (#282828) with a 1:1 ratio for square image use. Use studio lighting with soft, even illumination to eliminate harsh shadows. Position the product at a slight 30-degree angle to show dimension. High detail, sharp focus throughout, showing clear material texture. Photorealistic rendering for high-end e-commerce use.';

    // Config endpoint — read at request time so the web can detect feature availability without a build-time bake
    app.get('/generate-image/config', async (_req, res) => {
        const setting = await (defaultPrisma as any).systemSetting.findUnique({ where: { key: 'imagePrompt' } });
        return res.json({ enabled: !!process.env.OPENAI_API_KEY, defaultPrompt: setting?.value ?? null });
    });

    app.post('/generate-image', requireAuth, async (req, res) => {
        if (!process.env.OPENAI_API_KEY) {
            return res.status(503).json({ error: 'OPENAI_API_KEY is not configured on the server.' });
        }

        const { deviceId, sourceImageId, prompt, assignAsThumbnail, assignAsShopImage, assignAsListingImage } = req.body as {
            deviceId: number;
            sourceImageId?: number;
            prompt?: string;
            assignAsThumbnail?: boolean;
            assignAsShopImage?: boolean;
            assignAsListingImage?: boolean;
        };

        if (!deviceId) {
            return res.status(400).json({ error: 'deviceId is required' });
        }

        const finalPrompt = prompt || DEFAULT_IMAGE_PROMPT;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        try {
            let imageBase64: string;

            if (sourceImageId) {
                // Image edit mode: use existing device photo as reference via gpt-image-1
                const sourceImage = await prisma.image.findUnique({ where: { id: sourceImageId } });
                if (!sourceImage) {
                    return res.status(404).json({ error: 'Source image not found' });
                }
                const relative = sourceImage.path.replace('/uploads/', '');
                const sourceFilePath = path.join('/app/uploads', relative);
                if (!fs.existsSync(sourceFilePath)) {
                    return res.status(404).json({ error: 'Source image file not found on disk' });
                }

                // Convert to PNG preserving original dimensions — no resize so the model sees the full image
                const pngBuffer = await sharp(sourceFilePath).rotate().png().toBuffer();
                const imageFile = await OpenAI.toFile(pngBuffer, 'image.png', { type: 'image/png' });

                const response = await openai.images.edit({
                    model: 'gpt-image-1.5',
                    image: imageFile,
                    prompt: finalPrompt,
                    size: '1024x1024',
                } as any);
                imageBase64 = (response.data![0] as any).b64_json as string;
            } else {
                // Text-to-image fallback via DALL-E 3
                const device = await prisma.device.findUnique({ where: { id: Number(deviceId) } });
                if (!device) {
                    return res.status(404).json({ error: 'Device not found' });
                }
                const deviceDesc = [device.manufacturer, device.name, device.releaseYear].filter(Boolean).join(' ');
                const textPrompt = `${deviceDesc} — ${finalPrompt}`;
                const response = await openai.images.generate({
                    model: 'dall-e-3',
                    prompt: textPrompt,
                    size: '1024x1024',
                    response_format: 'b64_json',
                });
                imageBase64 = response.data![0].b64_json as string;
            }

            // Write generated PNG to disk
            const outputDir = path.join('/app/uploads/devices', String(deviceId));
            fs.mkdirSync(outputDir, { recursive: true });
            const filename = `${uuidv4()}.png`;
            const outputPath = path.join(outputDir, filename);
            fs.writeFileSync(outputPath, Buffer.from(imageBase64, 'base64'));

            const imagePath = `/uploads/devices/${deviceId}/${filename}`;

            // Generate thumbnail
            const thumbnailPath = await generateThumbnailForUpload(imagePath);

            // Handle image role assignments — unset existing flags as needed
            if (assignAsThumbnail) {
                await prisma.image.updateMany({ where: { deviceId: Number(deviceId), isThumbnail: true }, data: { isThumbnail: false } });
            }
            if (assignAsShopImage) {
                await prisma.image.updateMany({ where: { deviceId: Number(deviceId), isShopImage: true }, data: { isShopImage: false } });
            }
            if (assignAsListingImage) {
                await prisma.image.updateMany({ where: { deviceId: Number(deviceId), isListingImage: true }, data: { isListingImage: false } });
            }

            const newImage = await prisma.image.create({
                data: {
                    deviceId: Number(deviceId),
                    path: imagePath,
                    thumbnailPath: thumbnailPath || undefined,
                    caption: 'AI-generated product image',
                    isThumbnail: !!assignAsThumbnail,
                    isShopImage: !!assignAsShopImage,
                    isListingImage: !!assignAsListingImage,
                },
            });

            return res.json(newImage);
        } catch (err: any) {
            console.error('Image generation error:', err);
            return res.status(500).json({ error: err?.message || 'Image generation failed' });
        }
    });

    // Error handling for multer
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
            }
            return res.status(400).json({ error: err.message });
        }
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });

    // Create Apollo Server
    const server = new ApolloServer<Context>({
        typeDefs,
        resolvers,
    });

    await server.start();

    // Apply Apollo middleware
    app.use(
        '/graphql',
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({
                prisma,
                isAuthenticated: req.isAuthenticated ?? false,
            }),
        })
    );

    return { app, server };
}

async function startServer() {
    const { app } = await createApp();
    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
        console.log(`📁 File uploads at http://localhost:${PORT}/upload`);
        console.log(`🖼️  Static files at http://localhost:${PORT}/uploads`);
    });
}

// Only start server when run directly (not imported by tests)
if (process.env.VITEST !== 'true') {
    startServer();
}
