import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { handleGetDeviceDetails } from '../../src/handlers';
import { getTestPrismaClient, cleanDatabase, seedCategories, disconnectPrisma } from '../helpers/setup';

let categories: { computer: any; peripheral: any };
const prisma = getTestPrismaClient();

afterAll(async () => { await disconnectPrisma(); });

beforeEach(async () => {
    await cleanDatabase();
    categories = await seedCategories();
});

describe('handleGetDeviceDetails', () => {
    it('returns full device details', async () => {
        const device = await prisma.device.create({
            data: {
                name: 'Macintosh SE',
                categoryId: categories.computer.id,
                manufacturer: 'Apple',
                cpu: '68000',
            },
        });

        const result = await handleGetDeviceDetails(prisma, { deviceId: device.id });
        expect(result).not.toBeNull();
        expect(result!.name).toBe('Macintosh SE');
        expect(result!.manufacturer).toBe('Apple');
        expect(result!.specs.cpu).toBe('68000');
        expect(result!.category.name).toBe('Computers');
    });

    it('returns null for nonexistent device', async () => {
        const result = await handleGetDeviceDetails(prisma, { deviceId: 99999 });
        expect(result).toBeNull();
    });

    it('throws when deviceId is missing', async () => {
        await expect(handleGetDeviceDetails(prisma, {})).rejects.toThrow('deviceId is required');
    });

    it('includes related data', async () => {
        const device = await prisma.device.create({
            data: { name: 'Test', categoryId: categories.computer.id },
        });
        await prisma.note.create({ data: { deviceId: device.id, content: 'A note', date: new Date() } });
        await prisma.maintenanceTask.create({ data: { deviceId: device.id, label: 'Clean', dateCompleted: new Date() } });

        const result = await handleGetDeviceDetails(prisma, { deviceId: device.id });
        expect(result!.notes).toHaveLength(1);
        expect(result!.maintenanceTasks).toHaveLength(1);
    });
});
