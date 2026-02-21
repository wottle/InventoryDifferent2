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

describe('templates query', () => {
    it('requires authentication', async () => {
        const res = await graphqlQuery(app, `{ templates { id name } }`);
        expect(res.errors).toBeDefined();
        expect(res.errors![0].message).toContain('Authentication required');
    });

    it('returns templates when authenticated', async () => {
        const prisma = getTestPrismaClient();
        await (prisma as any).template.create({
            data: { name: 'Mac SE Template', categoryId: categories.computer.id },
        });

        const res = await graphqlQuery(app, `{ templates { id name category { name } } }`, undefined, token);
        expect(res.data.templates).toHaveLength(1);
        expect(res.data.templates[0].name).toBe('Mac SE Template');
    });
});

describe('createTemplate', () => {
    it('creates a template', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: TemplateCreateInput!) {
                createTemplate(input: $input) { id name manufacturer category { name } }
            }
        `, {
            input: { name: 'iMac G3', categoryId: categories.computer.id, manufacturer: 'Apple' },
        }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createTemplate.name).toBe('iMac G3');
        expect(res.data.createTemplate.manufacturer).toBe('Apple');
    });
});

describe('updateTemplate', () => {
    it('updates a template', async () => {
        const prisma = getTestPrismaClient();
        const tmpl = await (prisma as any).template.create({
            data: { name: 'Old Template', categoryId: categories.computer.id },
        });

        const res = await graphqlQuery(app, `
            mutation($input: TemplateUpdateInput!) {
                updateTemplate(input: $input) { id name }
            }
        `, {
            input: { id: tmpl.id, name: 'Updated Template' },
        }, token);

        expect(res.data.updateTemplate.name).toBe('Updated Template');
    });
});

describe('deleteTemplate', () => {
    it('deletes a template', async () => {
        const prisma = getTestPrismaClient();
        const tmpl = await (prisma as any).template.create({
            data: { name: 'Delete Me', categoryId: categories.computer.id },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { deleteTemplate(id: $id) }
        `, { id: tmpl.id }, token);

        expect(res.data.deleteTemplate).toBe(true);
    });
});
