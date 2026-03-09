import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import type { Context } from './index';

const exifr: any = require('exifr');
const sharp: any = require('sharp');

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
    images: true,
    notes: true,
    maintenanceTasks: true,
    tags: true,
    customFieldValues: { include: { customField: true } },
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

async function generateThumbnailForUpload(imagePath: string) {
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

            const devices = await context.prisma.device.findMany({
                where: whereClause,
                include: DEVICE_INCLUDE,
            });

            // Add searchText field, map custom fields, and filter sensitive fields
            return devices.map(device => {
                const mapped = mapCustomFieldValues(device);
                const filtered = filterDeviceSensitiveFields(mapped, context.isAuthenticated);
                return {
                    ...filtered,
                    searchText: [
                        device.name,
                        device.additionalName,
                        device.manufacturer,
                        device.modelNumber,
                        device.serialNumber,
                        device.cpu,
                        device.ram,
                        device.graphics,
                        device.storage,
                        device.info,
                        ...device.tags.map(tag => tag.name),
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
            return filterDeviceSensitiveFields(mapCustomFieldValues(device), context.isAuthenticated);
        },
        categories: async (_parent: any, _args: any, context: Context) => {
            // Categories are public (needed for device list display)
            return (context.prisma as any).category.findMany({
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            });
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
            return (context.prisma as any).template.findMany({
                orderBy: { name: 'asc' },
                include: { category: true },
            });
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

            const ownedValueAgg = await context.prisma.device.aggregate({
                where: {
                    ...baseWhere,
                    status: { notIn: ['SOLD', 'DONATED'] as any },
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

            const totalSpent = -decimalToNumber(spentAgg?._sum?.priceAcquired);
            const totalReceived = decimalToNumber(receivedAgg?._sum?.soldPrice);
            const netCash = totalReceived + totalSpent;
            const estimatedValueOwned = decimalToNumber(ownedValueAgg?._sum?.estimatedValue);
            const netPosition = estimatedValueOwned + netCash;

            return {
                totalSpent,
                totalReceived,
                netCash,
                estimatedValueOwned,
                netPosition,
                totalProfit,
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

            const rows = [...acquisitionRows, ...saleRows, ...donationRows];
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
        timelineEvents: async (_parent: any, _args: any, context: Context) => {
            return (context.prisma as any).timelineEvent.findMany({
                orderBy: [{ year: 'asc' }, { sortOrder: 'asc' }],
            });
        },
        collectionStats: async (_parent: any, _args: any, context: Context) => {
            requireAuth(context);

            const baseWhere: any = { deleted: false };

            const statusLabels: Record<string, string> = {
                AVAILABLE: 'Available',
                FOR_SALE: 'For Sale',
                PENDING_SALE: 'Pending Sale',
                SOLD: 'Sold',
                DONATED: 'Donated',
            };
            const functionalLabels: Record<string, string> = {
                YES: 'Working',
                PARTIAL: 'Partial',
                NO: 'Not Working',
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
                totalDevices,
                workingPercent,
                avgEstimatedValue,
                topCategoryType,
            };
        },
    },
    Mutation: {
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
            const device = await context.prisma.device.create({
                data: {
                    ...input,
                },
                include: DEVICE_INCLUDE,
            });
            return mapCustomFieldValues(device);
        },
        updateDevice: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, ...data } = args.input;
            // Remove undefined values to avoid overwriting with null
            const cleanData = Object.fromEntries(
                Object.entries(data).filter(([_, v]) => v !== undefined)
            );
            const device = await context.prisma.device.update({
                where: { id },
                data: cleanData,
                include: DEVICE_INCLUDE,
            });
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

            // If this is set as thumbnail, unset other thumbnails for this device
            if (isThumbnail) {
                await context.prisma.image.updateMany({
                    where: { deviceId, isThumbnail: true },
                    data: { isThumbnail: false },
                });
            }

            let dateTaken: Date | undefined;
            if (typeof imagePath === 'string' && imagePath.startsWith('/uploads/')) {
                const relative = imagePath.replace('/uploads/', '');
                const filePath = path.join('/app/uploads', relative);
                if (filePath.startsWith('/app/uploads') && fs.existsSync(filePath)) {
                    const exifDate = await getExifDateTaken(filePath);
                    if (exifDate) dateTaken = exifDate;
                }
            }

            const thumbnailPath = await generateThumbnailForUpload(imagePath);

            // Check if this is the first image for the device - if so, make it the thumbnail
            const existingImages = await context.prisma.image.count({
                where: { deviceId },
            });
            const shouldBeThumbnail = isThumbnail || existingImages === 0;

            return (context.prisma as any).image.create({
                data: {
                    deviceId,
                    path: imagePath,
                    ...(thumbnailPath ? { thumbnailPath } : {}),
                    ...(dateTaken ? { dateTaken } : {}),
                    caption: caption || null,
                    isThumbnail: shouldBeThumbnail,
                    isShopImage: isShopImage || false,
                },
            });
        },
        updateImage: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { id, caption, isThumbnail, isShopImage, isListingImage } = args.input;

            // If setting as thumbnail, unset other thumbnails for this device
            if (isThumbnail) {
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

            // Delete the file from disk
            const filePath = path.join('/app/uploads', image.path.replace('/uploads/', ''));
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (err) {
                console.error('Error deleting file:', err);
                // Continue with DB deletion even if file deletion fails
            }

            const thumbnailPath = image.thumbnailPath as string | null | undefined;
            if (thumbnailPath) {
                const thumbFilePath = path.join('/app/uploads', thumbnailPath.replace('/uploads/', ''));
                try {
                    if (fs.existsSync(thumbFilePath)) {
                        fs.unlinkSync(thumbFilePath);
                    }
                } catch (err) {
                    console.error('Error deleting thumbnail file:', err);
                }
            }

            // Delete from database
            await (context.prisma as any).image.delete({
                where: { id: args.id },
            });

            return true;
        },
        createMaintenanceTask: async (_parent: any, args: { input: any }, context: Context) => {
            requireAuth(context);
            const { deviceId, label, dateCompleted, notes } = args.input;
            return context.prisma.maintenanceTask.create({
                data: {
                    deviceId,
                    label,
                    dateCompleted: new Date(dateCompleted),
                    notes: notes || null,
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
            return context.prisma.note.create({
                data: {
                    deviceId,
                    content,
                    date: new Date(date),
                },
            });
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
    },
};
