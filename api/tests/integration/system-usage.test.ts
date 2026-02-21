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

describe('systemUsage query', () => {
    it('returns correct counts', async () => {
        const prisma = getTestPrismaClient();
        const device = await prisma.device.create({
            data: { name: 'Test Device', categoryId: categories.computer.id },
        });
        await prisma.note.create({
            data: { deviceId: device.id, content: 'Note 1', date: new Date() },
        });
        await prisma.maintenanceTask.create({
            data: { deviceId: device.id, label: 'Task 1', dateCompleted: new Date() },
        });

        const res = await graphqlQuery(app, `{
            systemUsage {
                deviceCount noteCount taskCount imageCount categoryCount templateCount tagCount
            }
        }`, undefined, token);

        expect(res.errors).toBeUndefined();
        const usage = res.data.systemUsage;
        expect(usage.deviceCount).toBe(1);
        expect(usage.noteCount).toBe(1);
        expect(usage.taskCount).toBe(1);
        expect(usage.imageCount).toBe(0);
        expect(usage.categoryCount).toBe(2);
        expect(usage.templateCount).toBe(0);
        expect(usage.tagCount).toBe(0);
    });
});
