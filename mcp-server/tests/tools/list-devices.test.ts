import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { handleListDevices } from '../../src/handlers';
import { getTestPrismaClient, cleanDatabase, seedCategories, disconnectPrisma } from '../helpers/setup';

let categories: { computer: any; peripheral: any };
const prisma = getTestPrismaClient();

afterAll(async () => { await disconnectPrisma(); });

beforeEach(async () => {
    await cleanDatabase();
    categories = await seedCategories();
});

describe('handleListDevices', () => {
    it('returns all fields by default', async () => {
        await prisma.device.create({
            data: { name: 'Test', categoryId: categories.computer.id, manufacturer: 'Apple' },
        });

        const result = await handleListDevices(prisma, {});
        expect(result.count).toBe(1);
        const device = result.devices[0];
        expect(device.name).toBe('Test');
        expect(device.manufacturer).toBe('Apple');
        expect(device.id).toBeDefined();
        expect(device.status).toBeDefined();
    });

    it('limits output to requested fields', async () => {
        await prisma.device.create({
            data: { name: 'Test', categoryId: categories.computer.id, manufacturer: 'Apple' },
        });

        const result = await handleListDevices(prisma, { fields: ['id', 'name'] });
        const device = result.devices[0];
        expect(device.id).toBeDefined();
        expect(device.name).toBe('Test');
        expect(device.manufacturer).toBeUndefined();
        expect(device.status).toBeUndefined();
    });

    it('filters by status', async () => {
        await prisma.device.create({ data: { name: 'Available', categoryId: categories.computer.id, status: 'AVAILABLE' } });
        await prisma.device.create({ data: { name: 'Sold', categoryId: categories.computer.id, status: 'SOLD' } });

        const result = await handleListDevices(prisma, { status: 'AVAILABLE' });
        expect(result.count).toBe(1);
        expect(result.devices[0].name).toBe('Available');
    });

    it('excludes deleted devices', async () => {
        await prisma.device.create({ data: { name: 'Active', categoryId: categories.computer.id } });
        await prisma.device.create({ data: { name: 'Deleted', categoryId: categories.computer.id, deleted: true } });

        const result = await handleListDevices(prisma, {});
        expect(result.count).toBe(1);
    });
});
