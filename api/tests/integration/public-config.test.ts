import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, disconnectPrisma } from '../helpers/setup';
import { graphqlQuery } from '../helpers/graphql';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
    const result = await createApp(getTestPrismaClient());
    app = result.app;
});

afterAll(async () => {
    await disconnectPrisma();
    delete process.env.SHOP_DOMAIN;
});

describe('publicConfig query', () => {
    it('returns the configured SHOP_DOMAIN', async () => {
        process.env.SHOP_DOMAIN = 'shop.example.com';
        const res = await graphqlQuery(app, `{ publicConfig { shopDomain } }`);
        expect(res.errors).toBeUndefined();
        expect(res.data.publicConfig.shopDomain).toBe('shop.example.com');
    });

    it('returns null when SHOP_DOMAIN is unset', async () => {
        delete process.env.SHOP_DOMAIN;
        const res = await graphqlQuery(app, `{ publicConfig { shopDomain } }`);
        expect(res.errors).toBeUndefined();
        expect(res.data.publicConfig.shopDomain).toBeNull();
    });
});
