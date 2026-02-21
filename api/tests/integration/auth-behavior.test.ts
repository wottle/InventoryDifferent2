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

describe('unauthenticated mutation rejection', () => {
    it('rejects createDevice without auth', async () => {
        const res = await graphqlQuery(app, `
            mutation { createDevice(input: { name: "Test", categoryId: 1 }) { id } }
        `);
        expect(res.errors).toBeDefined();
        expect(res.errors![0].message).toContain('Authentication required');
    });

    it('rejects updateDevice without auth', async () => {
        const res = await graphqlQuery(app, `
            mutation { updateDevice(input: { id: 1, name: "Test" }) { id } }
        `);
        expect(res.errors).toBeDefined();
    });

    it('rejects deleteDevice without auth', async () => {
        const res = await graphqlQuery(app, `
            mutation { deleteDevice(id: 1) }
        `);
        expect(res.errors).toBeDefined();
    });

    it('rejects createCategory without auth', async () => {
        const res = await graphqlQuery(app, `
            mutation { createCategory(name: "Test", type: "OTHER") { id } }
        `);
        expect(res.errors).toBeDefined();
    });

    it('rejects createNote without auth', async () => {
        const res = await graphqlQuery(app, `
            mutation { createNote(input: { deviceId: 1, content: "test", date: "2024-01-01" }) { id } }
        `);
        expect(res.errors).toBeDefined();
    });

    it('rejects addDeviceTag without auth', async () => {
        const res = await graphqlQuery(app, `
            mutation { addDeviceTag(deviceId: 1, tagName: "test") { id } }
        `);
        expect(res.errors).toBeDefined();
    });
});

describe('protected queries', () => {
    it('rejects templates without auth', async () => {
        const res = await graphqlQuery(app, `{ templates { id } }`);
        expect(res.errors).toBeDefined();
    });

    it('rejects financialOverview without auth', async () => {
        const res = await graphqlQuery(app, `{ financialOverview { totalSpent } }`);
        expect(res.errors).toBeDefined();
    });

    it('rejects financialTransactions without auth', async () => {
        const res = await graphqlQuery(app, `{ financialTransactions { type } }`);
        expect(res.errors).toBeDefined();
    });
});

describe('public queries without auth', () => {
    it('allows devices query', async () => {
        const res = await graphqlQuery(app, `{ devices { id name } }`);
        expect(res.errors).toBeUndefined();
    });

    it('allows device query', async () => {
        const res = await graphqlQuery(app, `{ device(where: { id: 99999 }) { id } }`);
        expect(res.errors).toBeUndefined();
    });

    it('allows categories query', async () => {
        const res = await graphqlQuery(app, `{ categories { id name } }`);
        expect(res.errors).toBeUndefined();
    });

    it('allows tags query', async () => {
        const res = await graphqlQuery(app, `{ tags { id name } }`);
        expect(res.errors).toBeUndefined();
    });

    it('allows systemUsage query', async () => {
        const res = await graphqlQuery(app, `{ systemUsage { deviceCount } }`);
        expect(res.errors).toBeUndefined();
    });
});
