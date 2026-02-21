import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../../src/index';
import { getTestPrismaClient, cleanDatabase, getAuthToken, disconnectPrisma } from '../helpers/setup';
import { graphqlQuery } from '../helpers/graphql';
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

beforeEach(async () => {
    await cleanDatabase();
});

describe('categories query', () => {
    it('returns categories ordered by sortOrder then name', async () => {
        const prisma = getTestPrismaClient();
        await (prisma as any).category.create({ data: { name: 'Zebra', type: 'OTHER', sortOrder: 2 } });
        await (prisma as any).category.create({ data: { name: 'Apple', type: 'COMPUTER', sortOrder: 1 } });
        await (prisma as any).category.create({ data: { name: 'Beta', type: 'PERIPHERAL', sortOrder: 1 } });

        const res = await graphqlQuery(app, `{ categories { id name sortOrder } }`, undefined, token);
        expect(res.data.categories).toHaveLength(3);
        expect(res.data.categories[0].name).toBe('Apple');
        expect(res.data.categories[1].name).toBe('Beta');
        expect(res.data.categories[2].name).toBe('Zebra');
    });
});

describe('createCategory', () => {
    it('creates a category', async () => {
        const res = await graphqlQuery(app, `
            mutation { createCategory(name: "Laptops", type: "COMPUTER", sortOrder: 5) { id name type sortOrder } }
        `, undefined, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createCategory.name).toBe('Laptops');
        expect(res.data.createCategory.type).toBe('COMPUTER');
        expect(res.data.createCategory.sortOrder).toBe(5);
    });
});

describe('updateCategory', () => {
    it('updates a category', async () => {
        const prisma = getTestPrismaClient();
        const cat = await (prisma as any).category.create({
            data: { name: 'Old Name', type: 'COMPUTER', sortOrder: 0 },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { updateCategory(id: $id, name: "New Name") { id name } }
        `, { id: cat.id }, token);

        expect(res.data.updateCategory.name).toBe('New Name');
    });
});
