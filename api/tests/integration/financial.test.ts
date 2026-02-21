import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, cleanDatabase, seedCategories, getAuthToken, disconnectPrisma } from '../helpers/setup';
import { graphqlQuery } from '../helpers/graphql';
import type { Express } from 'express';

let app: Express;
let token: string;
let categories: { computer: any; peripheral: any };

beforeAll(async () => {
    const result = await createApp(getTestPrismaClient());
    app = result.app;
    token = getAuthToken();
});

afterAll(async () => {
    await disconnectPrisma();
});

beforeEach(async () => {
    await cleanDatabase();
    categories = await seedCategories();
});

describe('financialOverview', () => {
    it('requires authentication', async () => {
        const res = await graphqlQuery(app, `{ financialOverview { totalSpent } }`);
        expect(res.errors).toBeDefined();
    });

    it('calculates correct financial totals', async () => {
        const prisma = getTestPrismaClient();
        // Acquired device, still owned
        await prisma.device.create({
            data: {
                name: 'Mac SE',
                categoryId: categories.computer.id,
                priceAcquired: 100,
                estimatedValue: 300,
            },
        });
        // Sold device
        await prisma.device.create({
            data: {
                name: 'Mac Plus',
                categoryId: categories.computer.id,
                priceAcquired: 50,
                soldPrice: 200,
                status: 'SOLD',
            },
        });
        // Donated device
        await prisma.device.create({
            data: {
                name: 'Old Printer',
                categoryId: categories.peripheral.id,
                priceAcquired: 25,
                estimatedValue: 10,
                status: 'DONATED',
            },
        });

        const res = await graphqlQuery(app, `{
            financialOverview {
                totalSpent totalReceived netCash estimatedValueOwned netPosition totalProfit
            }
        }`, undefined, token);

        const overview = res.data.financialOverview;
        // totalSpent is negative sum of priceAcquired = -(100+50+25) = -175
        expect(overview.totalSpent).toBeCloseTo(-175);
        // totalReceived = soldPrice of sold = 200
        expect(overview.totalReceived).toBeCloseTo(200);
        // netCash = 200 + (-175) = 25
        expect(overview.netCash).toBeCloseTo(25);
        // estimatedValueOwned = 300 (only "available" device - SOLD/DONATED excluded)
        expect(overview.estimatedValueOwned).toBeCloseTo(300);
        // netPosition = 300 + 25 = 325
        expect(overview.netPosition).toBeCloseTo(325);
        // totalProfit = (200 - 50) = 150
        expect(overview.totalProfit).toBeCloseTo(150);
    });
});

describe('financialTransactions', () => {
    it('requires authentication', async () => {
        const res = await graphqlQuery(app, `{ financialTransactions { type deviceName } }`);
        expect(res.errors).toBeDefined();
    });

    it('returns sorted transactions', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: {
                name: 'Acquired First',
                categoryId: categories.computer.id,
                priceAcquired: 100,
                dateAcquired: new Date('2024-01-01'),
            },
        });
        await prisma.device.create({
            data: {
                name: 'Sold Later',
                categoryId: categories.computer.id,
                priceAcquired: 50,
                dateAcquired: new Date('2024-02-01'),
                soldPrice: 200,
                soldDate: new Date('2024-06-01'),
                status: 'SOLD',
            },
        });

        const res = await graphqlQuery(app, `{
            financialTransactions { type deviceName amount }
        }`, undefined, token);

        expect(res.data.financialTransactions.length).toBeGreaterThanOrEqual(2);
        // Should be sorted by date descending
        const types = res.data.financialTransactions.map((t: any) => t.type);
        expect(types).toContain('ACQUISITION');
        expect(types).toContain('SALE');
    });
});
