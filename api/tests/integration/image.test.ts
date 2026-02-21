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

describe('createImage', () => {
    it('first image becomes thumbnail automatically', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: ImageCreateInput!) {
                createImage(input: $input) { id isThumbnail path }
            }
        `, {
            input: { deviceId, path: '/test/image1.jpg' },
        }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createImage.isThumbnail).toBe(true);
    });

    it('second image is not thumbnail by default', async () => {
        const prisma = getTestPrismaClient();
        await (prisma as any).image.create({
            data: { deviceId, path: '/test/image1.jpg', isThumbnail: true },
        });

        const res = await graphqlQuery(app, `
            mutation($input: ImageCreateInput!) {
                createImage(input: $input) { id isThumbnail }
            }
        `, {
            input: { deviceId, path: '/test/image2.jpg' },
        }, token);

        expect(res.data.createImage.isThumbnail).toBe(false);
    });
});

describe('updateImage', () => {
    it('sets isThumbnail and unsets others', async () => {
        const prisma = getTestPrismaClient();
        const img1 = await (prisma as any).image.create({
            data: { deviceId, path: '/test/img1.jpg', isThumbnail: true },
        });
        const img2 = await (prisma as any).image.create({
            data: { deviceId, path: '/test/img2.jpg', isThumbnail: false },
        });

        await graphqlQuery(app, `
            mutation($input: ImageUpdateInput!) {
                updateImage(input: $input) { id isThumbnail }
            }
        `, {
            input: { id: img2.id, isThumbnail: true },
        }, token);

        const updatedImg1 = await prisma.image.findUnique({ where: { id: img1.id } });
        const updatedImg2 = await prisma.image.findUnique({ where: { id: img2.id } });
        expect(updatedImg1?.isThumbnail).toBe(false);
        expect(updatedImg2?.isThumbnail).toBe(true);
    });
});

describe('deleteImage', () => {
    it('returns false for nonexistent image', async () => {
        const res = await graphqlQuery(app, `
            mutation { deleteImage(id: 99999) }
        `, undefined, token);

        expect(res.data.deleteImage).toBe(false);
    });
});
