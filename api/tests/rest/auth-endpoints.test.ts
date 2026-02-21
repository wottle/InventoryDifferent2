import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, getAuthToken, getRefreshToken, disconnectPrisma } from '../helpers/setup';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
    const result = await createApp(getTestPrismaClient());
    app = result.app;
});

afterAll(async () => {
    await disconnectPrisma();
});

describe('POST /auth/login', () => {
    it('returns tokens for valid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'testpassword' });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.refreshToken).toBeDefined();
        expect(res.body.expiresIn).toBe(3600);
    });

    it('returns 401 for invalid password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'admin', password: 'wrongpassword' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it('returns 400 when password is missing', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ username: 'admin' });

        expect(res.status).toBe(400);
    });
});

describe('POST /auth/refresh', () => {
    it('returns new access token for valid refresh token', async () => {
        const refreshToken = getRefreshToken();
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBeDefined();
        expect(res.body.expiresIn).toBe(3600);
    });

    it('returns 401 for invalid refresh token', async () => {
        const res = await request(app)
            .post('/auth/refresh')
            .send({ refreshToken: 'invalid-token' });

        expect(res.status).toBe(401);
    });

    it('returns 400 when refresh token is missing', async () => {
        const res = await request(app)
            .post('/auth/refresh')
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('GET /auth/status', () => {
    it('returns unauthenticated status without token', async () => {
        const res = await request(app).get('/auth/status');

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(false);
        expect(res.body.authRequired).toBe(true);
    });

    it('returns authenticated status with valid token', async () => {
        const token = getAuthToken();
        const res = await request(app)
            .get('/auth/status')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.authenticated).toBe(true);
    });
});
