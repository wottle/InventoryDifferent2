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

describe('addDeviceTag', () => {
    it('upserts a tag and connects to device', async () => {
        const res = await graphqlQuery(app, `
            mutation($deviceId: Int!, $tagName: String!) {
                addDeviceTag(deviceId: $deviceId, tagName: $tagName) { id tags { id name } }
            }
        `, { deviceId, tagName: 'vintage' }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.addDeviceTag.tags).toHaveLength(1);
        expect(res.data.addDeviceTag.tags[0].name).toBe('vintage');
    });

    it('reuses existing tag', async () => {
        const prisma = getTestPrismaClient();
        await prisma.tag.create({ data: { name: 'existing' } });

        const res = await graphqlQuery(app, `
            mutation($deviceId: Int!, $tagName: String!) {
                addDeviceTag(deviceId: $deviceId, tagName: $tagName) { id tags { name } }
            }
        `, { deviceId, tagName: 'existing' }, token);

        expect(res.data.addDeviceTag.tags[0].name).toBe('existing');
        const tags = await prisma.tag.findMany({ where: { name: 'existing' } });
        expect(tags).toHaveLength(1);
    });
});

describe('removeDeviceTag', () => {
    it('disconnects a tag from device', async () => {
        const prisma = getTestPrismaClient();
        const tag = await prisma.tag.create({ data: { name: 'removeme' } });
        await prisma.device.update({
            where: { id: deviceId },
            data: { tags: { connect: { id: tag.id } } },
        });

        const res = await graphqlQuery(app, `
            mutation($deviceId: Int!, $tagId: Int!) {
                removeDeviceTag(deviceId: $deviceId, tagId: $tagId) { id tags { name } }
            }
        `, { deviceId, tagId: tag.id }, token);

        expect(res.data.removeDeviceTag.tags).toEqual([]);
    });
});

describe('tags query', () => {
    it('returns all tags', async () => {
        const prisma = getTestPrismaClient();
        await prisma.tag.create({ data: { name: 'vintage' } });
        await prisma.tag.create({ data: { name: 'rare' } });

        const res = await graphqlQuery(app, `{ tags { id name } }`, undefined, token);
        expect(res.data.tags).toHaveLength(2);
    });
});
