import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, getAuthToken, disconnectPrisma } from '../helpers/setup';
import type { Express } from 'express';

let app: Express;
let token: string;

beforeAll(async () => {
    const result = await createApp(getTestPrismaClient());
    app = result.app;
    token = getAuthToken();
});

afterAll(async () => {
    await disconnectPrisma();
});

describe('POST /upload', () => {
    it('requires authentication', async () => {
        const res = await request(app)
            .post('/upload')
            .query({ deviceId: '1' })
            .attach('image', Buffer.from('fake-image'), 'test.jpg');

        expect(res.status).toBe(401);
    });

    it('rejects non-image files', async () => {
        const res = await request(app)
            .post('/upload')
            .set('Authorization', `Bearer ${token}`)
            .query({ deviceId: '1' })
            .attach('image', Buffer.from('not an image'), {
                filename: 'test.txt',
                contentType: 'text/plain',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid file type');
    });
});
