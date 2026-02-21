import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { handleGetFinancialSummary } from '../../src/handlers';
import { getTestPrismaClient, cleanDatabase, seedCategories, disconnectPrisma } from '../helpers/setup';

let categories: { computer: any; peripheral: any };
const prisma = getTestPrismaClient();

afterAll(async () => { await disconnectPrisma(); });

beforeEach(async () => {
    await cleanDatabase();
    categories = await seedCategories();
});

describe('handleGetFinancialSummary', () => {
    it('calculates correct aggregations', async () => {
        await prisma.device.create({
            data: { name: 'Owned', categoryId: categories.computer.id, priceAcquired: 100, estimatedValue: 300 },
        });
        await prisma.device.create({
            data: { name: 'Sold', categoryId: categories.computer.id, priceAcquired: 50, soldPrice: 200, status: 'SOLD' },
        });

        const result = await handleGetFinancialSummary(prisma);
        expect(result.totalSpent).toBeCloseTo(150);
        expect(result.totalReceived).toBeCloseTo(200);
        expect(result.netCash).toBeCloseTo(50);
        expect(result.estimatedValueOwned).toBeCloseTo(300);
        expect(result.totalProfit).toBeCloseTo(150);
    });

    it('returns zeros with no devices', async () => {
        const result = await handleGetFinancialSummary(prisma);
        expect(result.totalSpent).toBe(0);
        expect(result.totalReceived).toBe(0);
        expect(result.totalProfit).toBe(0);
    });
});
