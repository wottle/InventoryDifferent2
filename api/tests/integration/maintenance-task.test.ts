import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, cleanDatabase, seedCategories, getAuthToken, disconnectPrisma } from '../helpers/setup';
import { graphqlQuery } from '../helpers/graphql';
import type { Express } from 'express';

let app: Express;
let token: string;
let categories: { computer: any; peripheral: any };
let deviceId: number;

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
    const prisma = getTestPrismaClient();
    const device = await prisma.device.create({
        data: { name: 'Test Device', categoryId: categories.computer.id },
    });
    deviceId = device.id;
});

describe('createMaintenanceTask', () => {
    it('creates a maintenance task', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: MaintenanceTaskCreateInput!) {
                createMaintenanceTask(input: $input) { id label notes dateCompleted }
            }
        `, {
            input: {
                deviceId,
                label: 'Battery Replacement',
                dateCompleted: '2024-01-15T00:00:00Z',
                notes: 'Used CR2032',
            },
        }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createMaintenanceTask.label).toBe('Battery Replacement');
        expect(res.data.createMaintenanceTask.notes).toBe('Used CR2032');
    });
});

describe('deleteMaintenanceTask', () => {
    it('deletes a maintenance task', async () => {
        const prisma = getTestPrismaClient();
        const task = await prisma.maintenanceTask.create({
            data: { deviceId, label: 'Clean', dateCompleted: new Date() },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { deleteMaintenanceTask(id: $id) }
        `, { id: task.id }, token);

        expect(res.data.deleteMaintenanceTask).toBe(true);
    });
});

describe('maintenanceTaskLabels', () => {
    it('returns distinct labels', async () => {
        const prisma = getTestPrismaClient();
        await prisma.maintenanceTask.create({
            data: { deviceId, label: 'Battery Replacement', dateCompleted: new Date() },
        });
        await prisma.maintenanceTask.create({
            data: { deviceId, label: 'Cleaning', dateCompleted: new Date() },
        });
        await prisma.maintenanceTask.create({
            data: { deviceId, label: 'Battery Replacement', dateCompleted: new Date() },
        });

        const res = await graphqlQuery(app, `{ maintenanceTaskLabels }`, undefined, token);
        expect(res.data.maintenanceTaskLabels).toHaveLength(2);
        expect(res.data.maintenanceTaskLabels).toContain('Battery Replacement');
        expect(res.data.maintenanceTaskLabels).toContain('Cleaning');
    });
});
