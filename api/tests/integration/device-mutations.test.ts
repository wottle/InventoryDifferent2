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

describe('createDevice', () => {
    it('creates a device with required fields', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: DeviceCreateInput!) {
                createDevice(input: $input) { id name category { id name } }
            }
        `, {
            input: { name: 'Macintosh SE', categoryId: categories.computer.id },
        }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createDevice.name).toBe('Macintosh SE');
        expect(res.data.createDevice.category.name).toBe('Computers');
    });

    it('creates a device with all optional fields', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: DeviceCreateInput!) {
                createDevice(input: $input) {
                    id name manufacturer modelNumber serialNumber status functionalStatus
                    priceAcquired estimatedValue location info isFavorite
                }
            }
        `, {
            input: {
                name: 'Macintosh SE',
                categoryId: categories.computer.id,
                manufacturer: 'Apple',
                modelNumber: 'M5011',
                serialNumber: 'SN001',
                status: 'FOR_SALE',
                functionalStatus: 'YES',
                priceAcquired: 150.50,
                estimatedValue: 300,
                location: 'Shelf A',
                info: 'Great condition',
                isFavorite: true,
            },
        }, token);

        expect(res.errors).toBeUndefined();
        const device = res.data.createDevice;
        expect(device.manufacturer).toBe('Apple');
        expect(device.status).toBe('FOR_SALE');
        expect(device.priceAcquired).toBeCloseTo(150.50);
        expect(device.isFavorite).toBe(true);
    });

    it('returns relations on create', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: DeviceCreateInput!) {
                createDevice(input: $input) {
                    id images { id } notes { id } maintenanceTasks { id } tags { id }
                }
            }
        `, {
            input: { name: 'Test', categoryId: categories.computer.id },
        }, token);

        expect(res.data.createDevice.images).toEqual([]);
        expect(res.data.createDevice.notes).toEqual([]);
        expect(res.data.createDevice.maintenanceTasks).toEqual([]);
        expect(res.data.createDevice.tags).toEqual([]);
    });
});

describe('updateDevice', () => {
    it('updates a device partially', async () => {
        const prisma = getTestPrismaClient();
        const device = await prisma.device.create({
            data: { name: 'Original', categoryId: categories.computer.id, manufacturer: 'Apple' },
        });

        const res = await graphqlQuery(app, `
            mutation($input: DeviceUpdateInput!) {
                updateDevice(input: $input) { id name manufacturer }
            }
        `, {
            input: { id: device.id, name: 'Updated' },
        }, token);

        expect(res.data.updateDevice.name).toBe('Updated');
        expect(res.data.updateDevice.manufacturer).toBe('Apple');
    });
});

describe('deleteDevice (soft)', () => {
    it('soft deletes a device', async () => {
        const prisma = getTestPrismaClient();
        const device = await prisma.device.create({
            data: { name: 'ToDelete', categoryId: categories.computer.id },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { deleteDevice(id: $id) }
        `, { id: device.id }, token);

        expect(res.data.deleteDevice).toBe(true);

        const deleted = await prisma.device.findUnique({ where: { id: device.id } });
        expect(deleted?.deleted).toBe(true);
    });
});

describe('restoreDevice', () => {
    it('restores a soft-deleted device', async () => {
        const prisma = getTestPrismaClient();
        const device = await prisma.device.create({
            data: { name: 'Deleted', categoryId: categories.computer.id, deleted: true },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { restoreDevice(id: $id) { id name } }
        `, { id: device.id }, token);

        expect(res.data.restoreDevice.name).toBe('Deleted');
        const restored = await prisma.device.findUnique({ where: { id: device.id } });
        expect(restored?.deleted).toBe(false);
    });
});

describe('permanentlyDeleteDevice', () => {
    it('hard deletes a device', async () => {
        const prisma = getTestPrismaClient();
        const device = await prisma.device.create({
            data: { name: 'HardDelete', categoryId: categories.computer.id },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { permanentlyDeleteDevice(id: $id) }
        `, { id: device.id }, token);

        expect(res.data.permanentlyDeleteDevice).toBe(true);
        const gone = await prisma.device.findUnique({ where: { id: device.id } });
        expect(gone).toBeNull();
    });

    it('errors on nonexistent device', async () => {
        const res = await graphqlQuery(app, `
            mutation { permanentlyDeleteDevice(id: 99999) }
        `, undefined, token);

        expect(res.errors).toBeDefined();
        expect(res.errors![0].message).toContain('not found');
    });
});
