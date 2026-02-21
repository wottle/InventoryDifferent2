import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { handleReadResource } from '../../src/handlers';
import { getTestPrismaClient, cleanDatabase, seedCategories, disconnectPrisma } from '../helpers/setup';

let categories: { computer: any; peripheral: any };
const prisma = getTestPrismaClient();

afterAll(async () => { await disconnectPrisma(); });

beforeEach(async () => {
    await cleanDatabase();
    categories = await seedCategories();
});

describe('handleReadResource', () => {
    it('inventory://categories returns categories', async () => {
        const result = await handleReadResource(prisma, 'inventory://categories') as any[];
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Computers');
    });

    it('inventory://tags returns tags', async () => {
        await prisma.tag.create({ data: { name: 'vintage' } });
        const result = await handleReadResource(prisma, 'inventory://tags') as any[];
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('vintage');
    });

    it('inventory://stats returns counts', async () => {
        await prisma.device.create({ data: { name: 'Test', categoryId: categories.computer.id } });
        const result = await handleReadResource(prisma, 'inventory://stats') as any;
        expect(result.deviceCount).toBe(1);
        expect(result.categoryCount).toBe(2);
    });

    it('inventory://financials returns financial data', async () => {
        await prisma.device.create({
            data: { name: 'Test', categoryId: categories.computer.id, priceAcquired: 100 },
        });
        const result = await handleReadResource(prisma, 'inventory://financials') as any;
        expect(result.totalSpent).toBeCloseTo(100);
    });

    it('inventory://transactions returns transaction lists', async () => {
        await prisma.device.create({
            data: {
                name: 'Acquired',
                categoryId: categories.computer.id,
                priceAcquired: 100,
                dateAcquired: new Date(),
            },
        });
        const result = await handleReadResource(prisma, 'inventory://transactions') as any;
        expect(result.acquisitions).toHaveLength(1);
        expect(result.sales).toHaveLength(0);
        expect(result.donations).toHaveLength(0);
    });

    it('throws for unknown resource', async () => {
        await expect(handleReadResource(prisma, 'inventory://unknown')).rejects.toThrow('Unknown resource');
    });
});
