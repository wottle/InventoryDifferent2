import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import type { Context } from './index';

const exifr: any = require('exifr');
const sharp: any = require('sharp');

import { execFile } from 'child_process';
import { promisify } from 'util';
import { randomUUID } from 'crypto';
const execFileAsync = promisify(execFile);

// Compute time-decay popularity scores for devices based on page views from the last 14 days.
// Score per view = exp(-λ * daysAgo) where λ = ln(2)/7, giving a half-life of 7 days.
async function computePopularityScores(prisma: PrismaClient, deviceIds?: number[]): Promise<Map<number, number>> {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const lambda = Math.log(2) / 7;
    const now = Date.now();

    const views = await prisma.devicePageView.findMany({
        where: {
            viewedAt: { gte: twoWeeksAgo },
            ...(deviceIds ? { deviceId: { in: deviceIds } } : {}),
        },
        select: { deviceId: true, viewedAt: true },
    });

    const scores = new Map<number, number>();
    for (const view of views) {
        const daysAgo = (now - view.viewedAt.getTime()) / (1000 * 60 * 60 * 24);
        scores.set(view.deviceId, (scores.get(view.deviceId) ?? 0) + Math.exp(-lambda * daysAgo));
    }
    return scores;
}

// Helper to check authentication and throw error if not authenticated
function requireAuth(context: Context): void {
    if (!context.isAuthenticated) {
        throw new Error('Authentication required');
    }
}

// Sensitive fields to hide from unauthenticated users
const SENSITIVE_DEVICE_FIELDS = [
    'priceAcquired',
    'estimatedValue',
    'soldPrice',
    'whereAcquired',
    'notes',
] as const;

// Filter sensitive fields from a device for unauthenticated users
export function filterDeviceSensitiveFields(device: any, isAuthenticated: boolean): any {
    if (isAuthenticated) {
        return device;
    }

    return {
        ...device,
        priceAcquired: null,
        estimatedValue: null,
        soldPrice: null,
        whereAcquired: null,
        notes: [],
        customFieldValues: (device.customFieldValues || []).filter(
            (cfv: any) => cfv.isPublic || cfv.customField?.isPublic
        ),
    };
}


const DEVICE_INCLUDE = {
    category: true,
    location: true,
    images: true,
    notes: true,
    maintenanceTasks: true,
    tags: true,
    customFieldValues: { include: { customField: true } },
    accessories: true,
    links: true,
    storageEntries: { orderBy: { sortOrder: 'asc' as const } },
    osEntries: { orderBy: { sortOrder: 'asc' as const } },
    relationsFrom: { include: { toDevice: { include: { images: true } } } },
    relationsTo:   { include: { fromDevice: { include: { images: true } } } },
};

function mapCustomFieldValues(device: any): any {
    if (!device.customFieldValues) return device;
    return {
        ...device,
        customFieldValues: device.customFieldValues.map((cfv: any) => ({
            id: cfv.id,
            customFieldId: cfv.customFieldId,
            customFieldName: cfv.customField.name,
            value: cfv.value,
            isPublic: cfv.customField.isPublic,
            sortOrder: cfv.customField.sortOrder,
        })),
    };
}

export function decimalToNumber(value: any) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const n = parseFloat(value);
        return Number.isFinite(n) ? n : 0;
    }
    if (typeof value === 'object' && typeof value.toNumber === 'function') {
        const n = value.toNumber();
        return Number.isFinite(n) ? n : 0;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function parseExifDateString(value: string) {
    const m = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
    return Number.isNaN(dt.getTime()) ? null : dt;
}

async function getExifDateTaken(filePath: string) {
    try {
        const data: any = await exifr.parse(filePath, {
            translateValues: true,
        });

        const candidate =
            data?.DateTimeOriginal ??
            data?.CreateDate ??
            data?.ModifyDate ??
            data?.DateTimeDigitized;

        if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) return candidate;
        if (typeof candidate === 'string') return parseExifDateString(candidate);
        return null;
    } catch (_err) {
        return null;
    }
}

export async function generateThumbnailForUpload(imagePath: string) {
    try {
        if (typeof imagePath !== 'string' || !imagePath.startsWith('/uploads/')) return null;

        const relative = imagePath.replace('/uploads/', '');
        const sourceFilePath = path.join('/app/uploads', relative);
        if (!sourceFilePath.startsWith('/app/uploads') || !fs.existsSync(sourceFilePath)) return null;

        const dir = path.posix.dirname(imagePath);
        const base = path.posix.basename(imagePath, path.posix.extname(imagePath));
        const thumbDir = `${dir}/thumbs`;
        const thumbPath = `${thumbDir}/${base}.webp`;

        const thumbDiskDir = path.join('/app/uploads', thumbDir.replace('/uploads/', ''));
        fs.mkdirSync(thumbDiskDir, { recursive: true });
        const thumbDiskPath = path.join('/app/uploads', thumbPath.replace('/uploads/', ''));

        await sharp(sourceFilePath)
            .rotate()
            .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 70 })
            .toFile(thumbDiskPath);

        return thumbPath;
    } catch (_err) {
        return null;
    }
}

export async function generateVideoThumbnail(videoPath: string): Promise<{ thumbnailPath: string | null; duration: number | null }> {
    try {
        if (typeof videoPath !== 'string' || !videoPath.startsWith('/uploads/')) return { thumbnailPath: null, duration: null };

        const relative = videoPath.replace('/uploads/', '');
        const sourceFilePath = path.join('/app/uploads', relative);
        if (!sourceFilePath.startsWith('/app/uploads') || !fs.existsSync(sourceFilePath)) return { thumbnailPath: null, duration: null };

        const dir = path.posix.dirname(videoPath);
        const base = path.posix.basename(videoPath, path.posix.extname(videoPath));
        const thumbDir = `${dir}/thumbs`;
        const thumbPath = `${thumbDir}/${base}.webp`;

        const thumbDiskDir = path.join('/app/uploads', thumbDir.replace('/uploads/', ''));
        fs.mkdirSync(thumbDiskDir, { recursive: true });
        const thumbDiskPath = path.join('/app/uploads', thumbPath.replace('/uploads/', ''));
        const tempPngPath = `${thumbDiskPath}.tmp.png`;

        // Extract frame at 1 second as PNG, then convert to WebP via sharp
        try {
            await execFileAsync('ffmpeg', [
                '-ss', '00:00:01',
                '-i', sourceFilePath,
                '-vframes', '1',
                '-y', tempPngPath,
            ]);

            await sharp(tempPngPath)
                .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 70 })
                .toFile(thumbDiskPath);
        } finally {
            try { fs.unlinkSync(tempPngPath); } catch {}
        }

        // Get duration via ffprobe (bundled with ffmpeg)
        const { stdout } = await execFileAsync('ffprobe', [
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            sourceFilePath,
        ]);
        const probeData = JSON.parse(stdout);
        const duration = probeData.format?.duration
            ? Math.round(parseFloat(probeData.format.duration))
            : null;

        return { thumbnailPath: thumbPath, duration };
    } catch (_err) {
        return { thumbnailPath: null, duration: null };
    }
}

export async function applyImageTransforms(
    sourceFile: string,
    rotation: number,
    crop: { left: number; top: number; width: number; height: number } | null,
    outputPath: string
): Promise<void> {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

    // Sharp replaces rotation options on each .rotate() call, so chaining
    // .rotate() (EXIF auto-orient) then .rotate(angle) skips the auto-orient.
    // Fix: apply EXIF auto-orient in a separate pass to a buffer, then apply
    // user rotation on the already-corrected pixels.
    const { data: orientedBuf, info } =
        await sharp(sourceFile).rotate().toBuffer({ resolveWithObject: true });

    // Dimensions after user rotation (auto-orient is already applied in pass 1)
    const swap = rotation === 90 || rotation === 270;
    const imgW = swap ? info.height : info.width;
    const imgH = swap ? info.width  : info.height;

    let pipeline = sharp(orientedBuf);
    if (rotation !== 0) pipeline = pipeline.rotate(rotation);

    if (crop) {
        const left   = Math.max(0, Math.round(crop.left   * imgW));
        const top    = Math.max(0, Math.round(crop.top    * imgH));
        const width  = Math.max(1, Math.min(imgW - left,  Math.round(crop.width  * imgW)));
        const height = Math.max(1, Math.min(imgH - top,   Math.round(crop.height * imgH)));
        pipeline = pipeline.extract({ left, top, width, height });
    }

    await pipeline.toFile(outputPath);
}

export const resolvers = {
    Query: {
        devices: async (_parent: any, args: any, context: Context) => {
            const whereClause: any = {};

            // Handle deleted filter
            if (args.where?.deleted?.equals !== undefined) {
                whereClause.deleted = args.where.deleted.equals;
            }

            // Handle category filters
            if (args.where?.category) {
                whereClause.category = {};
                if (args.where.category.id?.equals !== undefined) {
                    whereClause.category.id = args.where.category.id.equals;
                }
                if (args.where.category.id?.in !== undefined) {
                    whereClause.category.id = { in: args.where.category.id.in };
                }
                if (args.where.category.type?.equals !== undefined) {
                    whereClause.category.type = args.where.category.type.equals;
                }
                if (args.where.category.type?.in !== undefined) {
                    whereClause.category.type = { in: args.where.category.type.in };
                }
            }

            // Handle status filter
            if (args.where?.status?.equals !== undefined) {
                whereClause.status = args.where.status.equals;
            }
            if (args.where?.status?.in !== undefined) {
                whereClause.status = { in: args.where.status.in };
            }

            // Handle functionalStatus filter
            if (args.where?.functionalStatus?.equals !== undefined) {
                whereClause.functionalStatus = args.where.functionalStatus.equals;
            }
            if (args.where?.functionalStatus?.in !== undefined) {
                whereClause.functionalStatus = { in: args.where.functionalStatus.in };
            }

            // Handle condition filter
            if (args.where?.condition?.equals !== undefined) {
                whereClause.condition = args.where.condition.equals;
            }
            if (args.where?.condition?.in !== undefined) {
                whereClause.condition = { in: args.where.condition.in };
            }

            // Handle rarity filter
            if (args.where?.rarity?.equals !== undefined) {
                whereClause.rarity = args.where.rarity.equals;
            }
            if (args.where?.rarity?.in !== undefined) {
                whereClause.rarity = { in: args.where.rarity.in };
            }

            // Handle location filter
            if (args.where?.location?.id?.equals !== undefined) {
                whereClause.locationId = args.where.location.id.equals;
            }
            if (args.where?.location?.id?.in !== undefined) {
                whereClause.locationId = { in: args.where.location.id.in };
            }

            // Handle serialNumber filter
            if (args.where?.serialNumber?.equals !== undefined) {
                whereClause.serialNumber = args.where.serialNumber.equals;
            }

            const devices = await context.prisma.device.findMany({
                where: whereClause,
                include: DEVICE_INCLUDE,
            });

            const popularityScores = await computePopularityScores(context.prisma);

            // Add searchText field, map custom fields, and filter sensitive fields
            return devices.map(device => {
                const mapped = mapCustomFieldValues(device);
                const filtered = filterDeviceSensitiveFields(mapped, context.isAuthenticated);
                return {
                    ...filtered,
                    popularity: popularityScores.get(device.id) ?? 0,
                    searchText: [
                        device.name,
                        device.additionalName,
                        device.manufacturer,
                        device.modelNumber,
                        device.serialNumber,
                        device.cpuType,
                        device.cpuSpeed,
                        device.ram,
                        device.graphicsChip,
                        device.screenSize,
                        device.displayType,
                        device.displayVariant,
                        device.nativeResolution,
                        ...(device as any).storageEntries?.map((s: any) => s.value) ?? [],
                        ...(device as any).osEntries?.map((o: any) => o.value) ?? [],
                        device.info,
                        device.releaseYear?.toString(),
                        (device as any).location?.name,
                        (device as any).category?.name,
                        ...(context.isAuthenticated ? [device.whereAcquired] : []),
                        ...device.tags.map(tag => tag.name),
                        ...device.customFieldValues.map((cfv: any) => cfv.value),
                        ...(context.isAuthenticated ? device.notes.map(note => note.content) : []),
                        ...device.maintenanceTasks.map(task => task.label + ' ' + task.notes)
                    ].filter(Boolean).join(' ').toLowerCase()
                };
            });
        },
        device: async (_parent: any, args: { where?: { id?: number, serialNumber?: { equals?: string }, deleted?: { equals?: boolean } } }, context: Context) => {
            const whereClause: any = {};
            if (args.where?.id !== undefined) {
                whereClause.id = args.where.id;
            }
            if (args.where?.serialNumber?.equals !== undefined) {
                whereClause.serialNumber = args.where.serialNumber.equals;
            }
            if (args.where?.deleted?.equals !== undefined) {
                whereClause.deleted = args.where.deleted.equals;
            }

            let device;
            // If searching by serialNumber, use findFirst since it's not unique
            if (args.where?.serialNumber?.equals !== undefined) {
                device = await context.prisma.device.findFirst({
                    where: whereClause,
                    include: DEVICE_INCLUDE,
                });
            } else {
                device = await context.prisma.device.findUnique({
                    where: whereClause,
                    include: DEVICE_INCLUDE,
                });
            }

            if (!device) return null;
            const popularityScores = await computePopularityScores(context.prisma, [device.id]);
            return {
                ...filterDeviceSensitiveFields(mapCustomFieldValues(device), context.isAuthenticated),
                popularity: popularityScores.get(device.id) ?? 0,
            };
        },
        categories: async (_parent: any, _args: any, context: Context) => {
            // Categories are public (needed for device list display)
            return (context.prisma as any).category.findMany({
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            });
        },
        locations: async (_parent: any, _args: any, context: Context) => {
            // Locations are public (needed for device list display and QR scanning)
            const locations = await (context.prisma as any).location.findMany({
                orderBy: { name: 'asc' },
                include: { _count: { select: { devices: true } } },
            });
            return locations.map((loc: any) => ({
                ...loc,
                deviceCount: loc._count.devices,
            }));
        },
        location: async (_parent: any, args: { id: number }, context: Context) => {
            const loc = await (context.prisma as any).location.findUnique({
                where: { id: args.id },
                include: { _count: { select: { devices: true } } },
            });
            if (!loc) return null;
            return { ...loc, deviceCount: loc._count.devices };
        },
        tags: async (_parent: any, _args: any, context: Context) => {
            return context.prisma.tag.findMany();
        },
        customFields: async (_parent: any, _args: any, context: Context) => {
            requireAuth(context);
            return context.prisma.customField.findMany({
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            });
        },
        maintenanceTaskLabels: async (_parent: any, _args: any, context: Context) => {
            const tasks = await context.prisma.maintenanceTask.findMany({
                select: { label: true },
                distinct: ['label'],
                orderBy: { label: 'asc' },
            });
            return tasks.map((t: { label: string }) => t.label);
        },
        templates: async (_parent: any, _args: any, context: Context) => {
            // Templates require auth
            requireAuth(context);
            const templates = await (context.prisma as any).template.findMany({
                include: { category: true },
            });
            return templates.sort((a: any, b: any) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase())
            );
        },
        financialOverview: async (_parent: any, _args: any, context: Context) => {
            // Financial data requires auth
            requireAuth(context);

            const baseWhere: any = { deleted: false };

            const spentAgg = await context.prisma.device.aggregate({
                where: baseWhere,
                _sum: { priceAcquired: true },
            });

            const receivedAgg = await context.prisma.device.aggregate({
                where: {
                    ...baseWhere,
                    status: 'SOLD' as any,
                },
                _sum: { soldPrice: true },
            });

            // Repair fees: RETURNED devices where a fee was charged (stored in soldPrice)
            const repairFeeAgg = await context.prisma.device.aggregate({
                where: {
                    ...baseWhere,
                    status: 'RETURNED' as any,
                    soldPrice: { not: null },
                },
                _sum: { soldPrice: true },
            });

            const ownedValueAgg = await context.prisma.device.aggregate({
                where: {
                    ...baseWhere,
                    status: { notIn: ['SOLD', 'DONATED', 'IN_REPAIR', 'REPAIRED', 'RETURNED'] as any },
                },
                _sum: { estimatedValue: true },
            });

            // Calculate profit: sum of (soldPrice - priceAcquired) for sold devices
            const soldDevices = await context.prisma.device.findMany({
                where: {
                    ...baseWhere,
                    status: 'SOLD' as any,
                    soldPrice: { not: null },
                },
                select: {
                    soldPrice: true,
                    priceAcquired: true,
                },
            });

            const totalProfit = soldDevices.reduce((sum, d) => {
                const soldPrice = decimalToNumber((d as any).soldPrice) || 0;
                const priceAcquired = decimalToNumber((d as any).priceAcquired) || 0;
                return sum + (soldPrice - priceAcquired);
            }, 0);

            const maintenanceCostAgg = await context.prisma.maintenanceTask.aggregate({
                where: { device: { deleted: false } },
                _sum: { cost: true },
            });

            const totalSpent = -decimalToNumber(spentAgg?._sum?.priceAcquired);
            const totalRepairFees = decimalToNumber(repairFeeAgg?._sum?.soldPrice);
            const totalReceived = decimalToNumber(receivedAgg?._sum?.soldPrice) + totalRepairFees;
            const netCash = totalReceived + totalSpent;
            const estimatedValueOwned = decimalToNumber(ownedValueAgg?._sum?.estimatedValue);
            const totalMaintenanceCost = decimalToNumber(maintenanceCostAgg?._sum?.cost);
            const netPosition = estimatedValueOwned + netCash - totalMaintenanceCost;

            return {
                totalSpent,
                totalReceived,
                netCash,
                estimatedValueOwned,
                netPosition,
                totalProfit,
                totalMaintenanceCost,
            };
        },
        financialTransactions: async (_parent: any, _args: any, context: Context) => {
            // Financial data requires auth
            requireAuth(context);

            const acquisitions = await context.prisma.device.findMany({
                where: {
                    deleted: false,
                    OR: [
                        { priceAcquired: { not: null } },
                        { dateAcquired: { not: null } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    additionalName: true,
                    dateAcquired: true,
                    priceAcquired: true,
                    estimatedValue: true,
                },
            });

            const sales = await context.prisma.device.findMany({
                where: {
                    deleted: false,
                    status: 'SOLD' as any,
                },
                select: {
                    id: true,
                    name: true,
                    additionalName: true,
                    soldDate: true,
                    soldPrice: true,
                    estimatedValue: true,
                },
            });

            const donations = await context.prisma.device.findMany({
                where: {
                    deleted: false,
                    status: 'DONATED' as any,
                },
                select: {
                    id: true,
                    name: true,
                    additionalName: true,
                    soldDate: true,
                    estimatedValue: true,
                },
            });

            const acquisitionRows = acquisitions.map((d) => ({
                type: 'ACQUISITION',
                deviceId: d.id,
                deviceName: d.name,
                additionalName: d.additionalName,
                date: d.dateAcquired,
                amount: -(decimalToNumber((d as any).priceAcquired) ?? 0),
                estimatedValue: decimalToNumber((d as any).estimatedValue) ?? 0,
            }));

            const saleRows = sales.map((d) => ({
                type: 'SALE',
                deviceId: d.id,
                deviceName: d.name,
                additionalName: d.additionalName,
                date: (d as any).soldDate,
                amount: decimalToNumber((d as any).soldPrice) ?? 0,
                estimatedValue: -(decimalToNumber((d as any).estimatedValue) ?? 0),
            }));

            const donationRows = donations.map((d) => ({
                type: 'DONATION',
                deviceId: d.id,
                deviceName: d.name,
                additionalName: d.additionalName,
                date: (d as any).soldDate,
                amount: 0,
                estimatedValue: -(decimalToNumber((d as any).estimatedValue) ?? 0),
            }));

            const maintenanceTasks = await context.prisma.maintenanceTask.findMany({
                where: {
                    cost: { not: null },
                    device: { deleted: false },
                },
                select: {
                    id: true,
                    label: true,
                    dateCompleted: true,
                    cost: true,
                    device: {
                        select: { id: true, name: true, additionalName: true },
                    },
                },
            });

            const maintenanceRows = maintenanceTasks.map((t) => ({
                type: 'MAINTENANCE',
                deviceId: t.device.id,
                deviceName: t.device.name,
                additionalName: t.device.additionalName,
                date: t.dateCompleted,
                amount: -(decimalToNumber((t as any).cost) ?? 0),
                estimatedValue: 0,
                label: t.label,
            }));

            const returnedWithFee = await context.prisma.device.findMany({
                where: { status: 'RETURNED' as any, soldPrice: { not: null }, deleted: false },
                select: { id: true, name: true, additionalName: true, soldDate: true, soldPrice: true },
            });
            const returnedRows = returnedWithFee.map((d: any) => ({
                type: 'REPAIR_RETURN',
                deviceId: d.id,
                deviceName: d.name,
                additionalName: d.additionalName,
                date: d.soldDate ?? null,
                amount: decimalToNumber(d.soldPrice),
                estimatedValue: 0,
                label: null,
            }));

            const rows = [...acquisitionRows, ...saleRows, ...donationRows, ...maintenanceRows, ...returnedRows];
            rows.sort((a, b) => {
                const at = a.date ? new Date(a.date).getTime() : -Infinity;
                const bt = b.date ? new Date(b.date).getTime() : -Infinity;
                if (at !== bt) return bt - at;
                if (a.deviceId !== b.deviceId) return b.deviceId - a.deviceId;
                return String(a.type).localeCompare(String(b.type));
            });

            return rows;
        },
        systemUsage: async (_parent: any, _args: any, context: Context) => {
            const [deviceCount, noteCount, taskCount, imageCount, categoryCount, templateCount, tagCount] = await Promise.all([
                context.prisma.device.count({ where: { deleted: false } }),
                context.prisma.note.count(),
                context.prisma.maintenanceTask.count(),
                context.prisma.image.count(),
                (context.prisma as any).category.count(),
                (context.prisma as any).template.count(),
                (context.prisma as any).tag.count(),
            ]);

            // Calculate storage size from images
            const images = await context.prisma.image.findMany({
                select: { path: true, thumbnailPath: true },
            });

            let totalStorageBytes = 0;
            const fs = await import('fs');
            const pathModule = await import('path');

            for (const img of images) {
                try {
                    // Image paths are stored as /uploads/devices/... so we need to map to /app/uploads/devices/...
                    const filePath = pathModule.join('/app/uploads', img.path.replace('/uploads/', ''));
                    const stats = fs.statSync(filePath);
                    totalStorageBytes += stats.size;

                    // Also count thumbnail if it exists
                    const thumbPath = (img as any).thumbnailPath;
                    if (thumbPath) {
                        const thumbFilePath = pathModule.join('/app/uploads', thumbPath.replace('/uploads/', ''));
                        if (fs.existsSync(thumbFilePath)) {
                            const thumbStats = fs.statSync(thumbFilePath);
                            totalStorageBytes += thumbStats.size;
                        }
                    }
                } catch {
                    // File may not exist, skip
                }
            }

            return {
                deviceCount,
                noteCount,
                taskCount,
                imageCount,
                categoryCount,
                templateCount,
                tagCount,
                totalStorageBytes,
            };
        },
        orphanedFiles: async (_parent: any, _args: any, context: Context) => {
            requireAuth(context);
            const fs = await import('fs');
            const pathModule = await import('path');

            // Collect all DB-referenced paths into a Set
            const [images, showcaseConfig, showcaseJourneys] = await Promise.all([
                context.prisma.image.findMany({ select: { path: true, thumbnailPath: true, originalPath: true } }),
                (context.prisma as any).showcaseConfig.findUnique({
                    where: { id: 'singleton' },
                    select: { heroImagePath: true },
                }),
                (context.prisma as any).showcaseJourney.findMany({
                    select: { coverImagePath: true },
                }),
            ]);
            const referencedPaths = new Set<string>();
            for (const img of images) {
                if (img.path) referencedPaths.add(img.path);
                if ((img as any).thumbnailPath) referencedPaths.add((img as any).thumbnailPath);
                if ((img as any).originalPath) referencedPaths.add((img as any).originalPath);
            }
            // Showcase images are stored as relative paths (no /uploads/ prefix) — normalise to match
            if (showcaseConfig?.heroImagePath) {
                referencedPaths.add(`/uploads/${showcaseConfig.heroImagePath}`);
            }
            for (const j of showcaseJourneys) {
                if (j.coverImagePath) referencedPaths.add(`/uploads/${j.coverImagePath}`);
            }

            // Recursively walk /app/uploads/devices/
            const uploadsRoot = '/app/uploads/devices';
            const results: { path: string; sizeBytes: number }[] = [];

            function walkDir(dir: string) {
                if (!fs.existsSync(dir)) return;
                for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                    const fullPath = pathModule.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        walkDir(fullPath);
                    } else if (entry.isFile()) {
                        // Convert disk path back to URL-style /uploads/... path
                        const urlPath = fullPath.replace('/app/uploads', '/uploads');
                        if (!referencedPaths.has(urlPath)) {
                            try {
                                const stats = fs.statSync(fullPath);
                                results.push({ path: urlPath, sizeBytes: stats.size });
                            } catch {
                                // Skip unreadable files
                            }
                        }
                    }
                }
            }

            walkDir(uploadsRoot);
            return results;
        },
        timelineEvents: async (_parent: any, _args: any, context: Context) => {
            return (context.prisma as any).timelineEvent.findMany({
                orderBy: [{ year: 'asc' }, { sortOrder: 'asc' }],
            });
        },
        wishlistItems: async (_parent: any, args: any, context: Context) => {
            // Non-deleted wishlist items are publicly readable (storefront "Looking For" page)
            // Private fields (targetPrice, sourceUrl, sourceNotes, notes) are only visible when authenticated
            const deletedFilter = args.where?.deleted !== undefined ? args.where.deleted : false;
            const items = await (context.prisma as any).wishlistItem.findMany({
                where: { deleted: deletedFilter },
                include: { category: true },
                orderBy: [{ priority: 'asc' }, { name: 'asc' }],
            });
            return items.map((item: any) => {
                const mapped = {
                    ...item,
                    targetPrice: item.targetPrice ? decimalToNumber(item.targetPrice) : null,
                    createdAt: item.createdAt.toISOString(),
                };
                // Hide private fields from unauthenticated users
                if (!context.isAuthenticated) {
                    mapped.targetPrice = null;
                    mapped.sourceUrl = null;
                    mapped.sourceNotes = null;
                    mapped.notes = null;
                }
                return mapped;
            });
        },
        valueHistory: async (_parent: any, args: { deviceId: number }, context: Context) => {
            requireAuth(context);
            return context.prisma.valueSnapshot.findMany({
                where: { deviceId: args.deviceId },
                orderBy: { snapshotDate: 'asc' },
            });
        },
        collectionStats: async (_parent: any, _args: any, context: Context) => {
            requireAuth(context);

            const baseWhere: any = { deleted: false };

            const statusLabels: Record<string, string> = {
                COLLECTION: 'In Collection',
                FOR_SALE: 'For Sale',
                PENDING_SALE: 'Pending Sale',
                SOLD: 'Sold',
                DONATED: 'Donated',
                IN_REPAIR: 'In Repair',
                REPAIRED: 'Repaired',
                RETURNED: 'Returned',
                LOANED: 'Loaned',
            };
            const functionalLabels: Record<string, string> = {
                YES: 'Working',
                PARTIAL: 'Partial',
                NO: 'Not Working',
                UNKNOWN: 'Unknown',
            };
            const categoryTypeLabels: Record<string, string> = {
                COMPUTER: 'Computer',
                PERIPHERAL: 'Peripheral',
                ACCESSORY: 'Accessory',
                OTHER: 'Other',
            };

            const [
                byStatusRaw,
                byFunctionalRaw,
                categoriesRaw,
                acquiredRaw,
                releaseYearRaw,
                manufacturersRaw,
                byRarityRaw,
                totalDevices,
                workingCount,
                avgValueAgg,
            ] = await Promise.all([
                context.prisma.device.groupBy({ by: ['status'], where: baseWhere, _count: { id: true } }),
                context.prisma.device.groupBy({ by: ['functionalStatus'], where: baseWhere, _count: { id: true } }),
                context.prisma.device.findMany({ where: baseWhere, select: { category: { select: { type: true } } } }),
                context.prisma.device.findMany({ where: { ...baseWhere, dateAcquired: { not: null } }, select: { dateAcquired: true } }),
                context.prisma.device.findMany({ where: baseWhere, select: { releaseYear: true } }),
                context.prisma.device.groupBy({
                    by: ['manufacturer'],
                    where: { ...baseWhere, manufacturer: { not: null } },
                    _count: { id: true },
                    orderBy: { _count: { manufacturer: 'desc' } },
                    take: 10,
                }),
                context.prisma.device.groupBy({
                    by: ['rarity'],
                    where: { ...baseWhere, rarity: { not: null } },
                    _count: { id: true },
                }),
                context.prisma.device.count({ where: baseWhere }),
                context.prisma.device.count({ where: { ...baseWhere, functionalStatus: 'YES' as any } }),
                context.prisma.device.aggregate({ where: baseWhere, _avg: { estimatedValue: true } }),
            ]);

            const byStatus = byStatusRaw.map((r: any) => ({
                label: statusLabels[r.status] ?? r.status,
                count: r._count.id,
            }));

            const byFunctionalStatus = byFunctionalRaw.map((r: any) => ({
                label: functionalLabels[r.functionalStatus] ?? r.functionalStatus,
                count: r._count.id,
            }));

            const categoryTypeCounts: Record<string, number> = {};
            for (const d of categoriesRaw as any[]) {
                const t = d.category?.type ?? 'OTHER';
                categoryTypeCounts[t] = (categoryTypeCounts[t] ?? 0) + 1;
            }
            const byCategoryType = Object.entries(categoryTypeCounts).map(([type, count]) => ({
                label: categoryTypeLabels[type] ?? type,
                count,
            }));

            const acquisitionYearCounts: Record<string, number> = {};
            for (const d of acquiredRaw as any[]) {
                if (d.dateAcquired) {
                    const year = String(new Date(d.dateAcquired).getFullYear());
                    acquisitionYearCounts[year] = (acquisitionYearCounts[year] ?? 0) + 1;
                }
            }
            const byAcquisitionYear = Object.entries(acquisitionYearCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([label, count]) => ({ label, count }));

            const decadeCounts: Record<string, number> = {};
            for (const d of releaseYearRaw as any[]) {
                if (d.releaseYear) {
                    const decade = `${Math.floor(d.releaseYear / 10) * 10}s`;
                    decadeCounts[decade] = (decadeCounts[decade] ?? 0) + 1;
                }
            }
            const byReleaseDecade = Object.entries(decadeCounts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([label, count]) => ({ label, count }));

            const topManufacturers = manufacturersRaw.map((r: any) => ({
                label: r.manufacturer ?? 'Unknown',
                count: r._count.id,
            }));

            const rarityOrder = ['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'EXTREMELY_RARE'];
            const rarityLabels: Record<string, string> = {
                COMMON: 'Common',
                UNCOMMON: 'Uncommon',
                RARE: 'Rare',
                VERY_RARE: 'Very Rare',
                EXTREMELY_RARE: 'Extremely Rare',
            };
            const byRarity = (byRarityRaw as any[])
                .sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity))
                .map((r) => ({ label: rarityLabels[r.rarity] ?? r.rarity, count: r._count.id }));

            const workingPercent = totalDevices > 0 ? (workingCount / totalDevices) * 100 : 0;
            const avgEstimatedValue = decimalToNumber((avgValueAgg as any)._avg?.estimatedValue);

            const topCategoryType = byCategoryType.sort((a, b) => b.count - a.count)[0]?.label ?? '';

            return {
                byStatus,
                byFunctionalStatus,
                byCategoryType,
                byAcquisitionYear,
                byReleaseDecade,
                topManufacturers,
                byRarity,
                totalDevices,
                workingPercent,
                avgEstimatedValue,
                topCategoryType,
            };
        },
        systemSetting: async (_parent: any, args: { key: string }, context: Context) => {
            const setting = await (context.prisma as any).systemSetting.findUnique({ where: { key: args.key } });
            return setting?.value ?? null;
        },

        // Showcase queries
        showcaseConfig: async (_parent: any, _args: any, context: Context) => {
            return (context.prisma as any).showcaseConfig.upsert({
                where: { id: 'singleton' },
                update: {},
                create: { id: 'singleton' },
            });
        },

        publicConfig: () => {
            return { shopDomain: process.env.SHOP_DOMAIN || null };
        },

        showcaseJourneys: async (_parent: any, _args: any, context: Context) => {
            // Fetch all published journeys once to compute effective volume numbers
            const allPublished = await (context.prisma as any).showcaseJourney.findMany({
                where: { published: true },
                orderBy: [{ publishedAt: { sort: 'asc', nulls: 'last' } }, { sortOrder: 'asc' }],
                select: { id: true, volumeNumber: true },
            });
            const volumeRank = new Map<string, number>(
                allPublished.map((j: any, idx: number) => [j.id, j.volumeNumber ?? (idx + 1)])
            );
            const journeys = await (context.prisma as any).showcaseJourney.findMany({
                where: { published: true },
                orderBy: [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { sortOrder: 'asc' }],
                include: { chapters: { orderBy: { sortOrder: 'asc' }, include: { devices: { orderBy: { sortOrder: 'asc' }, include: { device: { include: DEVICE_INCLUDE } } } } } },
            });
            return journeys.map((j: any) => ({
                ...j,
                createdAt: j.createdAt.toISOString(),
                updatedAt: j.updatedAt.toISOString(),
                publishedAt: j.publishedAt ? j.publishedAt.toISOString() : null,
                effectiveVolumeNumber: volumeRank.get(j.id) ?? 0,
            }));
        },

        showcaseJourney: async (_parent: any, args: { slug: string }, context: Context) => {
            // Fetch all published journeys to compute effective volume numbers
            const allPublished = await (context.prisma as any).showcaseJourney.findMany({
                where: { published: true },
                orderBy: [{ publishedAt: { sort: 'asc', nulls: 'last' } }, { sortOrder: 'asc' }],
                select: { id: true, volumeNumber: true },
            });
            const volumeRank = new Map<string, number>(
                allPublished.map((j: any, idx: number) => [j.id, j.volumeNumber ?? (idx + 1)])
            );
            const journey = await (context.prisma as any).showcaseJourney.findFirst({
                where: { slug: args.slug, published: true },
                include: { chapters: { orderBy: { sortOrder: 'asc' }, include: { devices: { orderBy: { sortOrder: 'asc' }, include: { device: { include: DEVICE_INCLUDE } } } } } },
            });
            if (!journey) return null;
            return {
                ...journey,
                createdAt: journey.createdAt.toISOString(),
                updatedAt: journey.updatedAt.toISOString(),
                publishedAt: journey.publishedAt ? journey.publishedAt.toISOString() : null,
                effectiveVolumeNumber: volumeRank.get(journey.id) ?? 0,
            };
        },

        showcaseFeaturedDevices: async (_parent: any, _args: any, context: Context) => {
            return (context.prisma as any).showcaseDevice.findMany({
                where: { isFeatured: true },
                orderBy: { sortOrder: 'asc' },
                include: { device: { include: DEVICE_INCLUDE } },
            });
        },

        showcaseQuotes: async (_parent: any, _args: any, context: Context) => {
            return (context.prisma as any).showcaseQuote.findMany({
                where: { isEnabled: true },
                orderBy: { sortOrder: 'asc' },
            });
        },

        showcaseAllQuotes: async (_parent: any, _args: any, context: Context) => {
            requireAuth(context);
            return (context.prisma as any).showcaseQuote.findMany({
                orderBy: { sortOrder: 'asc' },
            });
        },

        showcaseAllJourneys: async (_parent: any, _args: any, context: Context) => {
            requireAuth(context);
            // Compute effective volume for admin display: rank published journeys by publishedAt
            const allPublished = await (context.prisma as any).showcaseJourney.findMany({
                where: { published: true },
                orderBy: [{ publishedAt: { sort: 'asc', nulls: 'last' } }, { sortOrder: 'asc' }],
                select: { id: true, volumeNumber: true },
            });
            const volumeRank = new Map<string, number>(
                allPublished.map((j: any, idx: number) => [j.id, j.volumeNumber ?? (idx + 1)])
            );
            const journeys = await (context.prisma as any).showcaseJourney.findMany({
                orderBy: { sortOrder: 'asc' },
                include: { chapters: { orderBy: { sortOrder: 'asc' }, include: { devices: { orderBy: { sortOrder: 'asc' }, include: { device: { include: DEVICE_INCLUDE } } } } } },
            });
            return journeys.map((j: any) => ({
                ...j,
                createdAt: j.createdAt.toISOString(),
                updatedAt: j.updatedAt.toISOString(),
                publishedAt: j.publishedAt ? j.publishedAt.toISOString() : null,
                effectiveVolumeNumber: volumeRank.get(j.id) ?? 0,
            }));
        },

        dashboard: async (_parent: any, _args: any, context: Context) => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            // Last 50 activity entries with device name + thumbnail image
            // Wrapped in try/catch so a pending migration doesn't crash the whole dashboard
            let rawActivity: any[] = [];
            try {
                rawActivity = await (context.prisma as any).activityLog.findMany({
                    take: 50,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        device: {
                            include: {
                                images: { where: { isThumbnail: true } },
                            },
                        },
                    },
                });
            } catch {
                // ActivityLog table may not exist yet (migration pending); return empty feed
            }

            // Financial snapshot — auth-gated; returns null when not authenticated
            let financialSnapshot = null;
            try {
                requireAuth(context);

                const spentAgg = await context.prisma.device.aggregate({
                    where: { deleted: false, dateAcquired: { gte: startOfMonth, lte: endOfMonth } },
                    _sum: { priceAcquired: true },
                });
                const revenueAgg = await context.prisma.device.aggregate({
                    where: {
                        deleted: false,
                        soldDate: { gte: startOfMonth, lte: endOfMonth },
                        status: { in: ['SOLD', 'DONATED', 'RETURNED'] as any },
                    },
                    _sum: { soldPrice: true },
                });
                const valueAgg = await context.prisma.device.aggregate({
                    where: { deleted: false, status: { notIn: ['SOLD', 'DONATED'] as any } },
                    _sum: { estimatedValue: true },
                });

                const spentThisMonth = Number(spentAgg._sum.priceAcquired ?? 0);
                const revenueThisMonth = Number(revenueAgg._sum.soldPrice ?? 0);

                financialSnapshot = {
                    spentThisMonth,
                    revenueThisMonth,
                    netThisMonth: revenueThisMonth - spentThisMonth,
                    collectionValue: Number(valueAgg._sum.estimatedValue ?? 0),
                };
            } catch {
                // Not authenticated — financialSnapshot remains null
            }

            // Needs Attention — each list includes device + thumbnail
            const deviceInclude = { images: { where: { isThumbnail: true } } };
            const [inRepair, pramBatteryPending, unknownFunctionalStatus] = await Promise.all([
                context.prisma.device.findMany({
                    where: { deleted: false, status: 'IN_REPAIR' as any },
                    include: deviceInclude,
                }),
                context.prisma.device.findMany({
                    where: { deleted: false, pramBatteryInstalled: false, status: { notIn: ['SOLD', 'DONATED', 'RETURNED'] as any } },
                    include: deviceInclude,
                    orderBy: [{ releaseYear: 'asc' }, { dateAcquired: 'asc' }],
                }),
                context.prisma.device.findMany({
                    where: { deleted: false, functionalStatus: 'UNKNOWN' as any },
                    include: deviceInclude,
                }),
            ]);

            // Collection Health — counts of devices missing key data (exclude devices no longer in collection)
            const inCollectionFilter = { deleted: false, status: { notIn: ['SOLD', 'DONATED', 'RETURNED'] as any } };
            const [noImages, noNotes, missingSpecs] = await Promise.all([
                context.prisma.device.count({ where: { ...inCollectionFilter, images: { none: {} } } }),
                context.prisma.device.count({ where: { ...inCollectionFilter, notes: { none: {} } } }),
                context.prisma.device.count({
                    where: {
                        ...inCollectionFilter,
                        category: { type: { notIn: ['ACCESSORY'] as any } },
                        AND: [
                            { OR: [{ cpuType: null }, { cpuType: '' }] },
                            { OR: [{ ram: null }, { ram: '' }] },
                        ],
                    },
                }),
            ]);

            return {
                recentActivity: rawActivity.map((entry: any) => ({
                    ...entry,
                    metadata: entry.metadata != null ? JSON.stringify(entry.metadata) : null,
                    createdAt: entry.createdAt.toISOString(),
                })),
                financialSnapshot,
                needsAttention: { inRepair, pramBatteryPending, unknownFunctionalStatus },
                collectionHealth: { noImages, noNotes, missingSpecs },
            };
        },
    },
    Mutation: {
        recordDeviceView: async (_parent: any, args: { deviceId: number }, context: Context) => {
            // No auth required — public storefront calls this
            try {
                await context.prisma.devicePageView.create({
                    data: { deviceId: args.deviceId },
                });
                return true;
            } catch {
                return false;
            }
        },
        createWishlistItem: async (_parent: any, args: { data: any }, context: Context) => {
            requireAuth(context);
            const item = await (context.prisma as any).wishlistItem.create({
                data: { ...args.data },
                include: { category: true },
            });
            return {
                ...item,
                targetPrice: item.targetPrice ? decimalToNumber(item.targetPrice) : null,
                createdAt: item.createdAt.toISOString(),
            };
        },
        updateWishlistItem: async (_parent: any, args: { id: string; data: any }, context: Context) => {
            requireAuth(context);
            const id = parseInt(args.id, 10);
            const cleanData = Object.fromEntries(Object.entries(args.data).filter(([_, v]) => v !== undefined));
            const item = await (context.prisma as any).wishlistItem.update({
                where: { id },
                data: cleanData,
                include: { category: true },
            });
            return {
                ...item,
                targetPrice: item.targetPrice ? decimalToNumber(item.targetPrice) : null,
                createdAt: item.createdAt.toISOString(),
            };
        },
        deleteWishlistItem: async (_parent: any, args: { id: string }, context: Context) => {
            requireAuth(context);
            const id = parseInt(args.id, 10);
            const item = await (context.prisma as any).wishlistItem.update({
                where: { id },
                data: { deleted: true },
                include: { category: true },
            });
            return {
                ...item,
                targetPrice: item.targetPrice ? decimalToNumber(item.targetPrice) : null,
                createdAt: item.createdAt.toISOString(),
            };
        },
        permanentlyDeleteWishlistItem: async (_parent: any, args: { id: string }, context: Context) => {
            requireAuth(context);
            const id = parseInt(args.id, 10);
            const item = await (context.prisma as any).wishlistItem.findUnique({
                where: { id },
                include: { category: true },
            });
            if (!item) throw new Error('WishlistItem not found');
            await (context.prisma as any).wishlistItem.delete({ where: { id } });
            return {
                ...item,
                targetPrice: item.targetPrice ? decimalToNumber(item.targetPrice) : null,
                createdAt: item.createdAt.toISOString(),
            };
        },
        createLocation: async (_parent: any, args: { name: string, description?: string }, context: Context) => {
            requireAuth(context);
            const loc = await (context.prisma as any).location.create({
                data: { name: args.name, description: args.description },
                include: { _count: { select: { devices: true } } },
            });
            return { ...loc, deviceCount: loc._count.devices };
        },
        updateLocation: async (_parent: any, args: { id: number, name?: string, description?: string }, context: Context) => {
            requireAuth(context);
            const data: any = {};
            if (args.name !== undefined) data.name = args.name;
            if (args.description !== undefined) data.description = args.description;
            const loc = await (context.prisma as any).location.update({
                where: { id: args.id },
                data,
                include: { _count: { select: { devices: true } } },
            });
            return { ...loc, deviceCount: loc._count.devices };
        },
        deleteLocation: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            const loc = await (context.prisma as any).location.findUnique({
                where: { id: args.id },
                include: { _count: { select: { devices: true } } },
            });
            if (!loc) throw new Error('Location not found');
            await (context.prisma as any).location.delete({ where: { id: args.id } });
            return { ...loc, deviceCount: loc._count.devices };
        },
        createCategory: async (
            _parent: any,
            args: { name: string; type: any; sortOrder?: number | null },
            context: Context
        ) => {
            requireAuth(context);
            return (context.prisma as any).category.create({
                data: {
                    name: args.name,
                    type: args.type,
                    sortOrder: args.sortOrder ?? 0,
                },
            });
        },
        updateCategory: async (
            _parent: any,
            args: { id: number; name?: string; type?: any; sortOrder?: number | null },
            context: Context
        ) => {
            requireAuth(context);
            const { id, ...data } = args;
            const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
            return (context.prisma as any).category.update({
                where: { id },
                data: cleanData as any,
            });
        },
        deleteCategory: async (
            _parent: any,
            args: { id: number },
            context: Context
        ) => {
            requireAuth(context);
            const deviceCount = await (context.prisma as any).device.count({
                where: { categoryId: args.id, deleted: false },
            });
            if (deviceCount > 0) {
                throw new Error(`Cannot delete: ${deviceCount} device(s) are assigned to this category.`);
            }
            return (context.prisma as any).category.delete({ where: { id: args.id } });
        },
        createTemplate: async (
            _parent: any,
            args: { input: any },
            context: Context
        ) => {
            requireAuth(context);
            const { input } = args;
            return (context.prisma as any).template.create({
                data: {
                    ...input,
                },
                include: { category: true },
            });
        },
        updateTemplate: async (
            _parent: any,
            args: { input: any },
            context: Context
        ) => {
            requireAuth(context);
            const { id, ...data } = args.input;
            const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
            return (context.prisma as any).template.update({
                where: { id },
                data: cleanData as any,
                include: { category: true },
            });
        },
        deleteTemplate: async (
            _parent: any,
            args: { id: number },
            context: Context
        ) => {
            requireAuth(context);
            await (context.prisma as any).template.delete({
                where: { id: args.id },
            });
            return true;
        },
        addDeviceTag: async (_parent: any, args: { deviceId: number; tagName: string }, context: Context) => {
            requireAuth(context);
            const name = (args.tagName ?? '').trim();
            if (!name) {
                throw new Error('tagName is required');
            }

            const tag = await context.prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
            });

            const device = await context.prisma.device.update({
                where: { id: args.deviceId },
                data: {
                    tags: {
                        connect: { id: tag.id },
                    },
                },
                include: DEVICE_INCLUDE,
            });
            return mapCustomFieldValues(device);
        },
        removeDeviceTag: async (_parent: any, args: { deviceId: number; tagId: number }, context: Context) => {
            requireAuth(context);
            const device = await context.prisma.device.update({
                where: { id: args.deviceId },
                data: {
                    tags: {
                        disconnect: { id: args.tagId },
                    },
                },
                include: DEVICE_INCLUDE,
            });
            return mapCustomFieldValues(device);
        },
        createDevice: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { input } = args;
            // Strip legacy fields that no longer exist on Device model
            const { storage, operatingSystem, ...deviceData } = input;
            const device = await context.prisma.device.create({
                data: {
                    ...deviceData,
                },
                include: DEVICE_INCLUDE,
            });
            // Activity log: acquisition event
            if (deviceData.dateAcquired) {
                await (context.prisma as any).activityLog.create({
                    data: {
                        deviceId: device.id,
                        type: 'DEVICE_ACQUIRED',
                        metadata: {
                            whereAcquired: deviceData.whereAcquired ?? null,
                            priceAcquired: deviceData.priceAcquired != null ? Number(deviceData.priceAcquired) : null,
                        },
                    },
                });
            }
            return mapCustomFieldValues(device);
        },
        updateDevice: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, storage, operatingSystem, ...data } = args.input;
            // Remove undefined values to avoid overwriting with null
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );
            // Read current state before update so we can detect what changed
            const existingDevice = await context.prisma.device.findUnique({
                where: { id },
                select: { status: true, functionalStatus: true, lastPowerOnDate: true },
            });
            const device = await context.prisma.device.update({
                where: { id },
                data: cleanData,
                include: DEVICE_INCLUDE,
            });

            // Create value snapshot if estimatedValue was changed
            if (cleanData.estimatedValue !== undefined) {
                const lastSnapshot = await context.prisma.valueSnapshot.findFirst({
                    where: { deviceId: device.id },
                    orderBy: { snapshotDate: 'desc' },
                });
                const newValue = device.estimatedValue ? Number(device.estimatedValue) : null;
                const lastValue = lastSnapshot?.estimatedValue ? Number(lastSnapshot.estimatedValue) : null;
                if (newValue !== lastValue) {
                    await context.prisma.valueSnapshot.create({
                        data: { deviceId: device.id, estimatedValue: device.estimatedValue },
                    });
                }
            }

            // Activity logging — compare old vs new values
            if (existingDevice) {
                const activityEntries: Array<{ type: string; metadata: object }> = [];

                if (cleanData.status !== undefined && cleanData.status !== existingDevice.status) {
                    const meta: Record<string, any> = { from: existingDevice.status, to: cleanData.status };
                    if (['FOR_SALE', 'PENDING_SALE'].includes(String(cleanData.status)) && cleanData.listPrice != null) {
                        meta.listPrice = Number(cleanData.listPrice);
                    }
                    if (['SOLD', 'RETURNED'].includes(String(cleanData.status)) && cleanData.soldPrice != null) {
                        meta.soldPrice = Number(cleanData.soldPrice);
                    }
                    activityEntries.push({ type: 'STATUS_CHANGED', metadata: meta });
                }

                if (cleanData.functionalStatus !== undefined && cleanData.functionalStatus !== existingDevice.functionalStatus) {
                    activityEntries.push({
                        type: 'FUNCTIONAL_STATUS_CHANGED',
                        metadata: { from: existingDevice.functionalStatus, to: cleanData.functionalStatus },
                    });
                }

                if (cleanData.lastPowerOnDate !== undefined) {
                    const oldDate = existingDevice.lastPowerOnDate?.toISOString().split('T')[0];
                    const newDate = typeof cleanData.lastPowerOnDate === 'string'
                        ? cleanData.lastPowerOnDate.split('T')[0]
                        : cleanData.lastPowerOnDate instanceof Date
                        ? cleanData.lastPowerOnDate.toISOString().split('T')[0]
                        : null;
                    if (newDate && newDate !== oldDate) {
                        activityEntries.push({ type: 'POWERED_ON', metadata: { date: newDate } });
                    }
                }

                for (const entry of activityEntries) {
                    await (context.prisma as any).activityLog.create({
                        data: {
                            deviceId: id,
                            type: entry.type,
                            metadata: entry.metadata,
                        },
                    });
                }
            }

            return mapCustomFieldValues(device);
        },
        deleteDevice: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await context.prisma.device.update({
                where: { id: args.id },
                data: { deleted: true },
            });
            return true;
        },
        restoreDevice: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            const device = await context.prisma.device.update({
                where: { id: args.id },
                data: { deleted: false },
                include: DEVICE_INCLUDE,
            });
            return mapCustomFieldValues(device);
        },
        permanentlyDeleteDevice: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            // Get the device with its images
            const device = await context.prisma.device.findUnique({
                where: { id: args.id },
                include: { images: true },
            });

            if (!device) {
                throw new Error('Device not found');
            }

            // Delete image files from the filesystem
            const deviceUploadDir = path.join('/app/uploads/devices', String(args.id));
            if (fs.existsSync(deviceUploadDir)) {
                fs.rmSync(deviceUploadDir, { recursive: true, force: true });
            }

            // Delete related records first (due to foreign key constraints)
            await context.prisma.image.deleteMany({ where: { deviceId: args.id } });
            await context.prisma.note.deleteMany({ where: { deviceId: args.id } });
            await context.prisma.maintenanceTask.deleteMany({ where: { deviceId: args.id } });
            await context.prisma.customFieldValue.deleteMany({ where: { deviceId: args.id } });

            // Delete the device
            await context.prisma.device.delete({ where: { id: args.id } });

            return true;
        },
        createImage: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { deviceId, path: imagePath, caption, isThumbnail, isShopImage } = args.input;

            // Derive mediaType from file extension
            const videoExts = new Set(['.mp4', '.mov', '.webm', '.avi', '.m4v']);
            const fileExt = path.posix.extname(imagePath).toLowerCase();
            const mediaType: 'IMAGE' | 'VIDEO' = videoExts.has(fileExt) ? 'VIDEO' : 'IMAGE';

            // If this is an image being set as thumbnail, unset other thumbnails
            if (mediaType === 'IMAGE' && isThumbnail) {
                await context.prisma.image.updateMany({
                    where: { deviceId, isThumbnail: true },
                    data: { isThumbnail: false },
                });
            }

            let dateTaken: Date | undefined;
            if (mediaType === 'IMAGE' && typeof imagePath === 'string' && imagePath.startsWith('/uploads/')) {
                const relative = imagePath.replace('/uploads/', '');
                const filePath = path.join('/app/uploads', relative);
                if (filePath.startsWith('/app/uploads') && fs.existsSync(filePath)) {
                    const exifDate = await getExifDateTaken(filePath);
                    if (exifDate) dateTaken = exifDate;
                }
            }

            // First IMAGE (not video) auto-becomes the device thumbnail
            const existingImageCount = await (context.prisma as any).image.count({
                where: { deviceId, mediaType: 'IMAGE' },
            });
            const shouldBeThumbnail = mediaType === 'IMAGE' && (isThumbnail || existingImageCount === 0);

            if (mediaType === 'VIDEO') {
                // Create the record immediately so the client isn't blocked by ffmpeg.
                // Thumbnail and duration are written back asynchronously once ffmpeg finishes.
                const image = await (context.prisma as any).image.create({
                    data: {
                        deviceId,
                        path: imagePath,
                        ...(dateTaken ? { dateTaken } : {}),
                        caption: caption || null,
                        isThumbnail: false,
                        thumbnailMode: 'BOTH',
                        isShopImage: false,
                        mediaType,
                    },
                });

                setImmediate(async () => {
                    try {
                        const { thumbnailPath, duration } = await generateVideoThumbnail(imagePath);
                        await (context.prisma as any).image.update({
                            where: { id: image.id },
                            data: {
                                ...(thumbnailPath ? { thumbnailPath } : {}),
                                ...(duration !== null ? { duration } : {}),
                            },
                        });
                    } catch (err) {
                        console.error(`Background thumbnail generation failed for image ${image.id}:`, err);
                    }
                });

                return image;
            }

            const thumbnailPath = await generateThumbnailForUpload(imagePath);

            return (context.prisma as any).image.create({
                data: {
                    deviceId,
                    path: imagePath,
                    ...(thumbnailPath ? { thumbnailPath } : {}),
                    ...(dateTaken ? { dateTaken } : {}),
                    caption: caption || null,
                    isThumbnail: shouldBeThumbnail,
                    thumbnailMode: 'BOTH',
                    isShopImage: (isShopImage && mediaType === 'IMAGE') || false,
                    mediaType,
                },
            });
        },
        updateImage: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, caption, isThumbnail, thumbnailMode, isShopImage, isListingImage } = args.input;

            // Thumbnail exclusivity logic:
            // Valid end states per device: none, one BOTH, or one LIGHT + one DARK (always paired).
            if (isThumbnail && thumbnailMode) {
                const image = await context.prisma.image.findUnique({ where: { id } });
                if (image) {
                    const existingThumbs = await (context.prisma as any).image.findMany({
                        where: { deviceId: image.deviceId, isThumbnail: true },
                    });
                    const bothThumb = existingThumbs.find((t: any) => t.thumbnailMode === 'BOTH');
                    const lightThumb = existingThumbs.find((t: any) => t.thumbnailMode === 'LIGHT');
                    const darkThumb = existingThumbs.find((t: any) => t.thumbnailMode === 'DARK');

                    if (thumbnailMode === 'BOTH') {
                        // Replace: unset all existing thumbnails
                        await context.prisma.image.updateMany({
                            where: { deviceId: image.deviceId, isThumbnail: true },
                            data: { isThumbnail: false },
                        });
                    } else if (thumbnailMode === 'LIGHT') {
                        if (bothThumb) {
                            // Promote BOTH → DARK (it keeps isThumbnail: true)
                            await (context.prisma as any).image.update({
                                where: { id: bothThumb.id },
                                data: { thumbnailMode: 'DARK' },
                            });
                        } else if (lightThumb) {
                            // Replace existing LIGHT thumbnail
                            await context.prisma.image.update({
                                where: { id: lightThumb.id },
                                data: { isThumbnail: false },
                            });
                        }
                        // If DARK exists without BOTH, leave it (paired with new LIGHT)
                    } else if (thumbnailMode === 'DARK') {
                        if (bothThumb) {
                            // Promote BOTH → LIGHT (it keeps isThumbnail: true)
                            await (context.prisma as any).image.update({
                                where: { id: bothThumb.id },
                                data: { thumbnailMode: 'LIGHT' },
                            });
                        } else if (darkThumb) {
                            // Replace existing DARK thumbnail
                            await context.prisma.image.update({
                                where: { id: darkThumb.id },
                                data: { isThumbnail: false },
                            });
                        }
                        // If LIGHT exists without BOTH, leave it (paired with new DARK)
                    }
                }
            } else if (isThumbnail) {
                // No thumbnailMode specified — treat as BOTH (replace all existing thumbnails)
                const image = await context.prisma.image.findUnique({ where: { id } });
                if (image) {
                    await context.prisma.image.updateMany({
                        where: { deviceId: image.deviceId, isThumbnail: true },
                        data: { isThumbnail: false },
                    });
                }
            }

            // If setting as listing image, unset other listing images for this device (only one allowed)
            if (isListingImage) {
                const image = await context.prisma.image.findUnique({ where: { id } });
                if (image) {
                    await context.prisma.image.updateMany({
                        where: { deviceId: image.deviceId, isListingImage: true },
                        data: { isListingImage: false },
                    });
                }
            }

            const updateData: any = {};
            if (caption !== undefined) updateData.caption = caption;
            if (isThumbnail !== undefined) updateData.isThumbnail = isThumbnail;
            if (thumbnailMode !== undefined) updateData.thumbnailMode = thumbnailMode;
            if (isShopImage !== undefined) updateData.isShopImage = isShopImage;
            if (isListingImage !== undefined) updateData.isListingImage = isListingImage;

            return context.prisma.image.update({
                where: { id },
                data: updateData,
            });
        },
        deleteImage: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            const image = await (context.prisma as any).image.findUnique({
                where: { id: args.id },
            });

            if (!image) {
                return false;
            }

            // Delete all files associated with this image: display copy, thumbnail, and
            // the untouched original (kept for non-destructive re-editing)
            const pathsToDelete: string[] = [image.path];
            if (image.thumbnailPath) pathsToDelete.push(image.thumbnailPath as string);
            if ((image as any).originalPath) pathsToDelete.push((image as any).originalPath);

            for (const apiPath of pathsToDelete) {
                const diskPath = path.join('/app/uploads', apiPath.replace('/uploads/', ''));
                try {
                    if (fs.existsSync(diskPath)) fs.unlinkSync(diskPath);
                } catch (err) {
                    console.error('Error deleting file:', diskPath, err);
                }
            }

            // Delete from database
            await (context.prisma as any).image.delete({
                where: { id: args.id },
            });

            return true;
        },

        editImage: async (_parent: any, args: any, context: Context) => {
            requireAuth(context);
            const { id, rotation, cropLeft, cropTop, cropWidth, cropHeight } = args;
            const image = await (context.prisma as any).image.findUniqueOrThrow({ where: { id } });

            // Always transform from the untouched original
            const sourceApiPath: string = image.originalPath ?? image.path;
            const sourceDiskPath = path.join('/app/uploads', sourceApiPath.replace('/uploads/', ''));

            // If this image was already edited, delete the old display copy and thumbnail before creating new ones
            if (image.originalPath) {
                for (const oldApiPath of [image.path, image.thumbnailPath].filter(Boolean)) {
                    const oldDiskPath = path.join('/app/uploads', (oldApiPath as string).replace('/uploads/', ''));
                    try { if (fs.existsSync(oldDiskPath)) fs.unlinkSync(oldDiskPath); } catch {}
                }
            }

            if (!sourceDiskPath.startsWith('/app/uploads') || !fs.existsSync(sourceDiskPath)) {
                throw new Error('Source image not found on disk');
            }

            // Build display copy path
            const ext = path.posix.extname(sourceApiPath) || '.jpg';
            const displayDir = `/uploads/devices/${image.deviceId}/display`;
            const displayBasename = randomUUID();
            const displayApiPath = `${displayDir}/${displayBasename}${ext}`;
            const displayDiskDir = path.join('/app/uploads', `devices/${image.deviceId}/display`);
            const displayDiskPath = path.join(displayDiskDir, `${displayBasename}${ext}`);

            // Crop object (null if no crop specified)
            const hasCrop = cropLeft != null && cropTop != null && cropWidth != null && cropHeight != null;
            const cropArg = hasCrop ? { left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight } : null;

            // Apply transforms → display copy
            await applyImageTransforms(sourceDiskPath, rotation ?? 0, cropArg, displayDiskPath);

            // Regenerate thumbnail from display copy at standard thumbs/ location
            const thumbDiskDir = path.join('/app/uploads', `devices/${image.deviceId}/thumbs`);
            fs.mkdirSync(thumbDiskDir, { recursive: true });
            const thumbDiskPath = path.join(thumbDiskDir, `${displayBasename}.webp`);
            const thumbApiPath = `/uploads/devices/${image.deviceId}/thumbs/${displayBasename}.webp`;
            await sharp(displayDiskPath)
                .rotate()
                .resize({ width: 320, height: 320, fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 70 })
                .toFile(thumbDiskPath);

            // Update DB: lock in originalPath on first edit
            return (context.prisma as any).image.update({
                where: { id },
                data: {
                    path: displayApiPath,
                    thumbnailPath: thumbApiPath,
                    originalPath: image.originalPath ?? image.path,
                    rotation: rotation ?? 0,
                    cropLeft:   hasCrop ? cropLeft   : null,
                    cropTop:    hasCrop ? cropTop    : null,
                    cropWidth:  hasCrop ? cropWidth  : null,
                    cropHeight: hasCrop ? cropHeight : null,
                },
            });
        },

        resetImageEdits: async (_parent: any, args: any, context: Context) => {
            requireAuth(context);
            const { id } = args;
            const image = await (context.prisma as any).image.findUniqueOrThrow({ where: { id } });

            if (!image.originalPath) throw new Error('Image has no edits to reset');

            // Delete current display copy
            const displayDiskPath = path.join('/app/uploads', image.path.replace('/uploads/', ''));
            if (displayDiskPath.startsWith('/app/uploads') && fs.existsSync(displayDiskPath)) {
                try { fs.unlinkSync(displayDiskPath); } catch {}
            }

            // Delete current thumbnail
            if (image.thumbnailPath) {
                const thumbDiskPath = path.join('/app/uploads', image.thumbnailPath.replace('/uploads/', ''));
                if (thumbDiskPath.startsWith('/app/uploads') && fs.existsSync(thumbDiskPath)) {
                    try { fs.unlinkSync(thumbDiskPath); } catch {}
                }
            }

            // Regenerate thumbnail from original using existing helper
            const newThumbPath = await generateThumbnailForUpload(image.originalPath);

            return (context.prisma as any).image.update({
                where: { id },
                data: {
                    path: image.originalPath,
                    thumbnailPath: newThumbPath,
                    originalPath: null,
                    rotation: 0,
                    cropLeft: null,
                    cropTop: null,
                    cropWidth: null,
                    cropHeight: null,
                },
            });
        },

        deleteOrphanedFiles: async (_parent: any, args: { paths: string[] }, context: Context) => {
            requireAuth(context);
            const fsModule = await import('fs');
            const pathModule = await import('path');

            let deleted = 0;
            for (const urlPath of args.paths) {
                // Path traversal guard — only allow /uploads/devices/ paths
                if (!urlPath.startsWith('/uploads/devices/')) {
                    continue;
                }
                const diskPath = pathModule.join('/app/uploads', urlPath.replace('/uploads/', ''));
                // Ensure resolved path stays within /app/uploads
                if (!diskPath.startsWith('/app/uploads/')) {
                    continue;
                }
                try {
                    fsModule.unlinkSync(diskPath);
                    deleted++;
                } catch {
                    // File already gone or unreadable — skip silently
                }
            }
            return deleted;
        },
        createMaintenanceTask: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { deviceId, label, dateCompleted, notes, cost } = args.input;
            const newTask = await context.prisma.maintenanceTask.create({
                data: {
                    deviceId,
                    label,
                    dateCompleted: new Date(dateCompleted),
                    notes: notes || null,
                    cost: cost != null ? cost : null,
                },
            });
            await (context.prisma as any).activityLog.create({
                data: {
                    deviceId: newTask.deviceId,
                    type: 'MAINTENANCE_LOGGED',
                    metadata: {
                        label: newTask.label,
                        cost: newTask.cost != null ? Number(newTask.cost) : null,
                    },
                },
            });
            return newTask;
        },
        updateMaintenanceTask: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, label, dateCompleted, notes, cost } = args.input;
            return context.prisma.maintenanceTask.update({
                where: { id },
                data: {
                    label,
                    dateCompleted: new Date(dateCompleted),
                    notes: notes || null,
                    cost: cost != null ? cost : null,
                },
            });
        },
        deleteMaintenanceTask: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await context.prisma.maintenanceTask.delete({
                where: { id: args.id },
            });
            return true;
        },
        createNote: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { deviceId, content, date } = args.input;
            const newNote = await context.prisma.note.create({
                data: {
                    deviceId,
                    content,
                    date: new Date(date),
                },
            });
            await (context.prisma as any).activityLog.create({
                data: {
                    deviceId: newNote.deviceId,
                    type: 'NOTE_ADDED',
                    metadata: {
                        noteId: newNote.id,
                        preview: newNote.content.slice(0, 80),
                    },
                },
            });
            return newNote;
        },
        updateNote: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, content, date } = args.input;
            return context.prisma.note.update({
                where: { id },
                data: {
                    content,
                    date: new Date(date),
                },
            });
        },
        deleteNote: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await context.prisma.note.delete({
                where: { id: args.id },
            });
            return true;
        },
        createCustomField: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { name, isPublic, sortOrder } = args.input;
            const trimmedName = (name || '').trim();
            if (!trimmedName) {
                throw new Error('Custom field name is required');
            }
            return context.prisma.customField.create({
                data: {
                    name: trimmedName,
                    isPublic: isPublic ?? false,
                    sortOrder: sortOrder ?? 0,
                },
            });
        },
        updateCustomField: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, ...data } = args.input;
            if (data.name !== undefined) {
                data.name = (data.name || '').trim();
                if (!data.name) {
                    throw new Error('Custom field name cannot be empty');
                }
            }
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );
            return context.prisma.customField.update({
                where: { id },
                data: cleanData,
            });
        },
        deleteCustomField: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await context.prisma.customField.delete({
                where: { id: args.id },
            });
            return true;
        },
        setCustomFieldValue: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { deviceId, customFieldId, value } = args.input;
            const result = await context.prisma.customFieldValue.upsert({
                where: {
                    customFieldId_deviceId: { customFieldId, deviceId },
                },
                update: { value },
                create: { customFieldId, deviceId, value },
                include: { customField: true },
            });
            return {
                id: result.id,
                customFieldId: result.customFieldId,
                customFieldName: result.customField.name,
                value: result.value,
                isPublic: result.customField.isPublic,
                sortOrder: result.customField.sortOrder,
            };
        },
        removeCustomFieldValue: async (_parent: any, args: { deviceId: number; customFieldId: number }, context: Context) => {
            requireAuth(context);
            try {
                await context.prisma.customFieldValue.delete({
                    where: {
                        customFieldId_deviceId: {
                            customFieldId: args.customFieldId,
                            deviceId: args.deviceId,
                        },
                    },
                });
            } catch {
                // Value may not exist, that's OK
            }
            return true;
        },

        addDeviceAccessory: async (_parent: any, args: { deviceId: number; name: string }, context: Context) => {
            requireAuth(context);
            return context.prisma.deviceAccessory.upsert({
                where: { deviceId_name: { deviceId: args.deviceId, name: args.name } },
                create: { deviceId: args.deviceId, name: args.name },
                update: {},
            });
        },

        removeDeviceAccessory: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await context.prisma.deviceAccessory.delete({ where: { id: args.id } });
            return true;
        },

        addDeviceLink: async (_parent: any, args: { deviceId: number; label: string; url: string }, context: Context) => {
            requireAuth(context);
            return context.prisma.deviceLink.create({
                data: { deviceId: args.deviceId, label: args.label, url: args.url },
            });
        },

        removeDeviceLink: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await context.prisma.deviceLink.delete({ where: { id: args.id } });
            return true;
        },

        addDeviceRelationship: async (_parent: any, args: { fromDeviceId: number; toDeviceId: number; type: string }, context: Context) => {
            requireAuth(context);
            if (args.fromDeviceId === args.toDeviceId) {
                throw new Error('A device cannot be related to itself');
            }
            await (context.prisma as any).deviceRelationship.upsert({
                where: {
                    fromDeviceId_toDeviceId_type: {
                        fromDeviceId: args.fromDeviceId,
                        toDeviceId: args.toDeviceId,
                        type: args.type,
                    },
                },
                update: {},
                create: { fromDeviceId: args.fromDeviceId, toDeviceId: args.toDeviceId, type: args.type },
            });
            return context.prisma.device.findUnique({
                where: { id: args.fromDeviceId },
                include: DEVICE_INCLUDE,
            });
        },

        removeDeviceRelationship: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).deviceRelationship.delete({ where: { id: args.id } });
            return true;
        },

        setSystemSetting: async (_parent: any, args: { key: string; value: string }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).systemSetting.upsert({
                where: { key: args.key },
                create: { key: args.key, value: args.value },
                update: { value: args.value },
            });
            return true;
        },

        // Showcase mutations
        upsertShowcaseConfig: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const data: any = {};
            if (args.input.siteTitle != null) data.siteTitle = args.input.siteTitle;
            if (args.input.tagline != null) data.tagline = args.input.tagline;
            if (args.input.bioText != null) data.bioText = args.input.bioText;
            if (args.input.heroImagePath !== undefined) data.heroImagePath = args.input.heroImagePath;
            if (args.input.accentColor != null) data.accentColor = args.input.accentColor;
            if (args.input.timelineCuratorNote != null) data.timelineCuratorNote = args.input.timelineCuratorNote;
            if (args.input.narrativeStatement != null) data.narrativeStatement = args.input.narrativeStatement;
            if (args.input.collectionOverview != null) data.collectionOverview = args.input.collectionOverview;

            // Delete old hero image file if it's being replaced
            if (args.input.heroImagePath !== undefined) {
                const current = await (context.prisma as any).showcaseConfig.findUnique({
                    where: { id: 'singleton' },
                    select: { heroImagePath: true },
                });
                const oldPath = current?.heroImagePath;
                if (oldPath && oldPath !== args.input.heroImagePath) {
                    const diskPath = path.join('/app/uploads', oldPath);
                    if (diskPath.startsWith('/app/uploads/') && fs.existsSync(diskPath)) {
                        try { fs.unlinkSync(diskPath); } catch { /* ignore */ }
                    }
                }
            }

            return (context.prisma as any).showcaseConfig.upsert({
                where: { id: 'singleton' },
                update: data,
                create: { id: 'singleton', ...data },
            });
        },

        createJourney: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const publishing = args.input.published ?? false;
            const journey = await (context.prisma as any).showcaseJourney.create({
                data: {
                    title: args.input.title,
                    slug: args.input.slug,
                    description: args.input.description,
                    coverImagePath: args.input.coverImagePath ?? null,
                    sortOrder: args.input.sortOrder ?? 0,
                    volumeNumber: args.input.volumeNumber ?? null,
                    published: publishing,
                    publishedAt: publishing ? new Date() : null,
                },
                include: { chapters: { include: { devices: { include: { device: { include: DEVICE_INCLUDE } } } } } },
            });
            return {
                ...journey,
                createdAt: journey.createdAt.toISOString(),
                updatedAt: journey.updatedAt.toISOString(),
                publishedAt: journey.publishedAt ? journey.publishedAt.toISOString() : null,
                effectiveVolumeNumber: journey.volumeNumber ?? 0,
            };
        },

        updateJourney: async (_parent: any, args: { id: string; input: any }, context: Context) => {
            requireAuth(context);
            const data: any = {};
            if (args.input.title !== undefined) data.title = args.input.title;
            if (args.input.slug !== undefined) data.slug = args.input.slug;
            if (args.input.description !== undefined) data.description = args.input.description;
            if (args.input.coverImagePath !== undefined) {
                data.coverImagePath = args.input.coverImagePath;
                // Delete old cover image file if it's being replaced
                const current = await (context.prisma as any).showcaseJourney.findUnique({
                    where: { id: args.id },
                    select: { coverImagePath: true },
                });
                const oldPath = current?.coverImagePath;
                if (oldPath && oldPath !== args.input.coverImagePath) {
                    const diskPath = path.join('/app/uploads', oldPath);
                    if (diskPath.startsWith('/app/uploads/') && fs.existsSync(diskPath)) {
                        try { fs.unlinkSync(diskPath); } catch { /* ignore */ }
                    }
                }
            }
            if (args.input.sortOrder !== undefined) data.sortOrder = args.input.sortOrder;
            if (args.input.volumeNumber !== undefined) data.volumeNumber = args.input.volumeNumber;
            if (args.input.published !== undefined) {
                data.published = args.input.published;
                // Set publishedAt on first publish only
                if (args.input.published) {
                    const current = await (context.prisma as any).showcaseJourney.findUnique({
                        where: { id: args.id },
                        select: { publishedAt: true },
                    });
                    if (!current?.publishedAt) {
                        data.publishedAt = new Date();
                    }
                }
            }
            const journey = await (context.prisma as any).showcaseJourney.update({
                where: { id: args.id },
                data,
                include: { chapters: { include: { devices: { include: { device: { include: DEVICE_INCLUDE } } } } } },
            });
            return {
                ...journey,
                createdAt: journey.createdAt.toISOString(),
                updatedAt: journey.updatedAt.toISOString(),
                publishedAt: journey.publishedAt ? journey.publishedAt.toISOString() : null,
                effectiveVolumeNumber: journey.volumeNumber ?? 0,
            };
        },

        deleteJourney: async (_parent: any, args: { id: string }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).showcaseJourney.delete({ where: { id: args.id } });
            return true;
        },

        upsertChapter: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, journeyId, title, description, sortOrder } = args.input;
            const descriptionValue = description ?? null;
            if (id) {
                return (context.prisma as any).showcaseChapter.update({
                    where: { id },
                    data: { title, description: descriptionValue, sortOrder: sortOrder ?? 0 },
                    include: { devices: { include: { device: { include: DEVICE_INCLUDE } } } },
                });
            }
            return (context.prisma as any).showcaseChapter.create({
                data: { journeyId, title, description: descriptionValue, sortOrder: sortOrder ?? 0 },
                include: { devices: { include: { device: { include: DEVICE_INCLUDE } } } },
            });
        },

        deleteChapter: async (_parent: any, args: { id: string }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).showcaseChapter.delete({ where: { id: args.id } });
            return true;
        },

        upsertShowcaseDevice: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, chapterId, deviceId, curatorNote, sortOrder, isFeatured } = args.input;
            const data: any = {
                chapterId,
                deviceId,
                curatorNote: curatorNote ?? null,
                sortOrder: sortOrder ?? 0,
                isFeatured: isFeatured ?? false,
            };
            if (id) {
                return (context.prisma as any).showcaseDevice.update({
                    where: { id },
                    data,
                    include: { device: { include: DEVICE_INCLUDE } },
                });
            }
            return (context.prisma as any).showcaseDevice.create({
                data,
                include: { device: { include: DEVICE_INCLUDE } },
            });
        },

        removeShowcaseDevice: async (_parent: any, args: { id: string }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).showcaseDevice.delete({ where: { id: args.id } });
            return true;
        },

        upsertShowcaseQuote: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, author, text, source, isEnabled, sortOrder } = args.input;
            const data: any = { author, text, source: source ?? null, isEnabled: isEnabled ?? true, sortOrder: sortOrder ?? 0 };
            if (id) {
                return (context.prisma as any).showcaseQuote.update({
                    where: { id },
                    data,
                });
            }
            return (context.prisma as any).showcaseQuote.create({ data });
        },

        deleteShowcaseQuote: async (_parent: any, args: { id: string }, context: Context) => {
            requireAuth(context);
            const quote = await (context.prisma as any).showcaseQuote.findUnique({ where: { id: args.id } });
            if (!quote) throw new Error('Quote not found');
            if (quote.isDefault) throw new Error('Cannot delete a default quote');
            await (context.prisma as any).showcaseQuote.delete({ where: { id: args.id } });
            return true;
        },

        addDeviceStorageEntry: async (_parent: any, args: { deviceId: number; value: string; sortOrder?: number }, context: Context) => {
            requireAuth(context);
            return (context.prisma as any).deviceStorage.create({
                data: { deviceId: args.deviceId, value: args.value, sortOrder: args.sortOrder ?? 0 },
            });
        },

        updateDeviceStorageEntry: async (_parent: any, args: { id: number; value: string; sortOrder?: number }, context: Context) => {
            requireAuth(context);
            return (context.prisma as any).deviceStorage.update({
                where: { id: args.id },
                data: { value: args.value, ...(args.sortOrder !== undefined ? { sortOrder: args.sortOrder } : {}) },
            });
        },

        removeDeviceStorageEntry: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).deviceStorage.delete({ where: { id: args.id } });
            return true;
        },

        addDeviceOSEntry: async (_parent: any, args: { deviceId: number; value: string; sortOrder?: number }, context: Context) => {
            requireAuth(context);
            return (context.prisma as any).deviceOS.create({
                data: { deviceId: args.deviceId, value: args.value, sortOrder: args.sortOrder ?? 0 },
            });
        },

        updateDeviceOSEntry: async (_parent: any, args: { id: number; value: string; sortOrder?: number }, context: Context) => {
            requireAuth(context);
            return (context.prisma as any).deviceOS.update({
                where: { id: args.id },
                data: { value: args.value, ...(args.sortOrder !== undefined ? { sortOrder: args.sortOrder } : {}) },
            });
        },

        removeDeviceOSEntry: async (_parent: any, args: { id: number }, context: Context) => {
            requireAuth(context);
            await (context.prisma as any).deviceOS.delete({ where: { id: args.id } });
            return true;
        },
    },

    // Field resolvers for showcase types
    ShowcaseJourney: {
        chapters: async (parent: any, _args: any, context: Context) => {
            return (context.prisma as any).showcaseChapter.findMany({
                where: { journeyId: parent.id },
                orderBy: { sortOrder: 'asc' },
                include: { devices: { include: { device: { include: DEVICE_INCLUDE } }, orderBy: { sortOrder: 'asc' } } },
            });
        },
        createdAt: (parent: any) => {
            return parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt;
        },
        updatedAt: (parent: any) => {
            return parent.updatedAt instanceof Date ? parent.updatedAt.toISOString() : parent.updatedAt;
        },
    },

    ShowcaseChapter: {
        devices: async (parent: any, _args: any, context: Context) => {
            return (context.prisma as any).showcaseDevice.findMany({
                where: { chapterId: parent.id },
                orderBy: { sortOrder: 'asc' },
                include: { device: { include: DEVICE_INCLUDE } },
            });
        },
    },

    ShowcaseDevice: {
        device: async (parent: any, _args: any, context: Context) => {
            if (parent.device) return mapCustomFieldValues(parent.device);
            const device = await context.prisma.device.findUnique({
                where: { id: parent.deviceId },
                include: DEVICE_INCLUDE,
            });
            return device ? mapCustomFieldValues(device) : null;
        },
    },

    DeviceRelationship: {
        fromDevice: (parent: any) => {
            return parent.fromDevice ? mapCustomFieldValues(parent.fromDevice) : null;
        },
        toDevice: (parent: any) => {
            return parent.toDevice ? mapCustomFieldValues(parent.toDevice) : null;
        },
        createdAt: (parent: any) => {
            return parent.createdAt instanceof Date ? parent.createdAt.toISOString() : parent.createdAt;
        },
    },
};
