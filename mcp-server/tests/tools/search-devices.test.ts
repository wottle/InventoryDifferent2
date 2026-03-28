import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { handleSearchDevices } from '../../src/handlers';
import { getTestPrismaClient, cleanDatabase, seedCategories, disconnectPrisma } from '../helpers/setup';

let categories: { computer: any; peripheral: any };
const prisma = getTestPrismaClient();

afterAll(async () => { await disconnectPrisma(); });

beforeEach(async () => {
    await cleanDatabase();
    categories = await seedCategories();
});

describe('handleSearchDevices', () => {
    it('returns non-deleted devices', async () => {
        await prisma.device.create({ data: { name: 'Active', categoryId: categories.computer.id } });
        await prisma.device.create({ data: { name: 'Deleted', categoryId: categories.computer.id, deleted: true } });

        const result = await handleSearchDevices(prisma, {});
        expect(result.count).toBe(1);
        expect(result.devices[0].name).toBe('Active');
    });

    it('filters by status', async () => {
        await prisma.device.create({ data: { name: 'Available', categoryId: categories.computer.id, status: 'COLLECTION' } });
        await prisma.device.create({ data: { name: 'Sold', categoryId: categories.computer.id, status: 'SOLD' } });

        const result = await handleSearchDevices(prisma, { status: 'COLLECTION' });
        expect(result.count).toBe(1);
        expect(result.devices[0].name).toBe('Available');
    });

    it('filters by manufacturer', async () => {
        await prisma.device.create({ data: { name: 'Mac', categoryId: categories.computer.id, manufacturer: 'Apple' } });
        await prisma.device.create({ data: { name: 'PC', categoryId: categories.computer.id, manufacturer: 'IBM' } });

        const result = await handleSearchDevices(prisma, { manufacturer: 'apple' });
        expect(result.count).toBe(1);
        expect(result.devices[0].name).toBe('Mac');
    });

    it('filters by text query', async () => {
        await prisma.device.create({ data: { name: 'Macintosh SE', categoryId: categories.computer.id, manufacturer: 'Apple' } });
        await prisma.device.create({ data: { name: 'Amiga 500', categoryId: categories.computer.id, manufacturer: 'Commodore' } });

        const result = await handleSearchDevices(prisma, { query: 'macintosh' });
        expect(result.count).toBe(1);
        expect(result.devices[0].name).toBe('Macintosh SE');
    });

    it('limits results', async () => {
        for (let i = 0; i < 5; i++) {
            await prisma.device.create({ data: { name: `Device ${i}`, categoryId: categories.computer.id } });
        }

        const result = await handleSearchDevices(prisma, { limit: 3 });
        expect(result.count).toBe(3);
    });

    it('caps limit at 100', async () => {
        const result = await handleSearchDevices(prisma, { limit: 200 });
        expect(result.count).toBe(0); // No devices, just verifying no error
    });

    it('filters by categoryId', async () => {
        await prisma.device.create({ data: { name: 'Computer', categoryId: categories.computer.id } });
        await prisma.device.create({ data: { name: 'Peripheral', categoryId: categories.peripheral.id } });

        const result = await handleSearchDevices(prisma, { categoryId: categories.computer.id });
        expect(result.count).toBe(1);
        expect(result.devices[0].name).toBe('Computer');
    });
});
