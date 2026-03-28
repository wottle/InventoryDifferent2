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

describe('devices query', () => {
    it('returns empty array when no devices exist', async () => {
        const res = await graphqlQuery(app, `{ devices { id name } }`, undefined, token);
        expect(res.errors).toBeUndefined();
        expect(res.data.devices).toEqual([]);
    });

    it('returns non-deleted devices by default', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: { name: 'Active Device', categoryId: categories.computer.id },
        });
        await prisma.device.create({
            data: { name: 'Deleted Device', categoryId: categories.computer.id, deleted: true },
        });

        const res = await graphqlQuery(app, `{ devices { id name } }`, undefined, token);
        expect(res.data.devices).toHaveLength(2);
    });

    it('filters by deleted flag', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: { name: 'Active Device', categoryId: categories.computer.id },
        });
        await prisma.device.create({
            data: { name: 'Deleted Device', categoryId: categories.computer.id, deleted: true },
        });

        const res = await graphqlQuery(app, `
            query { devices(where: { deleted: { equals: false } }) { id name } }
        `, undefined, token);
        expect(res.data.devices).toHaveLength(1);
        expect(res.data.devices[0].name).toBe('Active Device');
    });

    it('filters by status', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: { name: 'Available Device', categoryId: categories.computer.id, status: 'COLLECTION' },
        });
        await prisma.device.create({
            data: { name: 'For Sale Device', categoryId: categories.computer.id, status: 'FOR_SALE' },
        });

        const res = await graphqlQuery(app, `
            query { devices(where: { status: { equals: COLLECTION } }) { id name status } }
        `, undefined, token);
        expect(res.data.devices).toHaveLength(1);
        expect(res.data.devices[0].name).toBe('Available Device');
    });

    it('filters by category', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: { name: 'Computer', categoryId: categories.computer.id },
        });
        await prisma.device.create({
            data: { name: 'Peripheral', categoryId: categories.peripheral.id },
        });

        const res = await graphqlQuery(app, `
            query($catId: Int!) { devices(where: { category: { id: { equals: $catId } } }) { id name } }
        `, { catId: categories.computer.id }, token);
        expect(res.data.devices).toHaveLength(1);
        expect(res.data.devices[0].name).toBe('Computer');
    });

    it('filters by functionalStatus', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: { name: 'Working', categoryId: categories.computer.id, functionalStatus: 'YES' },
        });
        await prisma.device.create({
            data: { name: 'Broken', categoryId: categories.computer.id, functionalStatus: 'NO' },
        });

        const res = await graphqlQuery(app, `
            query { devices(where: { functionalStatus: { equals: NO } }) { id name } }
        `, undefined, token);
        expect(res.data.devices).toHaveLength(1);
        expect(res.data.devices[0].name).toBe('Broken');
    });

    it('filters sensitive fields for unauthenticated users', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: {
                name: 'Secret Device',
                categoryId: categories.computer.id,
                priceAcquired: 100,
                estimatedValue: 200,
                whereAcquired: 'eBay',
            },
        });

        const res = await graphqlQuery(app, `
            { devices { id name priceAcquired estimatedValue whereAcquired notes { id } } }
        `);
        expect(res.data.devices).toHaveLength(1);
        expect(res.data.devices[0].priceAcquired).toBeNull();
        expect(res.data.devices[0].estimatedValue).toBeNull();
        expect(res.data.devices[0].whereAcquired).toBeNull();
        expect(res.data.devices[0].notes).toEqual([]);
    });
});

describe('device query', () => {
    it('returns device by ID', async () => {
        const prisma = getTestPrismaClient();
        const device = await prisma.device.create({
            data: { name: 'Test Device', categoryId: categories.computer.id },
        });

        const res = await graphqlQuery(app, `
            query($id: Int!) { device(where: { id: $id }) { id name } }
        `, { id: device.id }, token);
        expect(res.data.device.name).toBe('Test Device');
    });

    it('returns device by serialNumber', async () => {
        const prisma = getTestPrismaClient();
        await prisma.device.create({
            data: { name: 'Serial Device', categoryId: categories.computer.id, serialNumber: 'SN12345' },
        });

        const res = await graphqlQuery(app, `
            query { device(where: { serialNumber: { equals: "SN12345" } }) { id name serialNumber } }
        `, undefined, token);
        expect(res.data.device.serialNumber).toBe('SN12345');
    });

    it('returns null for nonexistent device', async () => {
        const res = await graphqlQuery(app, `
            query { device(where: { id: 99999 }) { id name } }
        `, undefined, token);
        expect(res.data.device).toBeNull();
    });
});
