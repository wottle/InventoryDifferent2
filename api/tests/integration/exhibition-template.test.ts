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

const TEMPLATE_FIELDS = `
  id name orgName logoPath layout accentColor footerText
  showQR showManufacturer showModel showSerial showYear showCategory
  showStatus showCondition showLocation showDescription showSpecs showTags showCustomFields
  customHtml createdAt updatedAt
`;

describe('exhibitionTemplates query', () => {
    it('requires authentication', async () => {
        const res = await graphqlQuery(app, `{ exhibitionTemplates { id name } }`);
        expect(res.errors).toBeDefined();
    });

    it('returns empty list when no templates exist', async () => {
        const res = await graphqlQuery(app, `{ exhibitionTemplates { id name } }`, undefined, token);
        expect(res.errors).toBeUndefined();
        expect(res.data.exhibitionTemplates).toHaveLength(0);
    });

    it('returns templates ordered by createdAt desc', async () => {
        const prisma = getTestPrismaClient();
        await (prisma as any).exhibitionTemplate.create({ data: { name: 'First', layout: 'A4_FULL' } });
        await (prisma as any).exhibitionTemplate.create({ data: { name: 'Second', layout: 'A4_FULL' } });

        const res = await graphqlQuery(app, `{ exhibitionTemplates { name } }`, undefined, token);
        expect(res.errors).toBeUndefined();
        expect(res.data.exhibitionTemplates).toHaveLength(2);
        // newest first
        expect(res.data.exhibitionTemplates[0].name).toBe('Second');
    });
});

describe('exhibitionTemplate query', () => {
    it('returns a single template by id', async () => {
        const prisma = getTestPrismaClient();
        const tmpl = await (prisma as any).exhibitionTemplate.create({
            data: { name: 'My Show', layout: 'DISPLAY_CARD', orgName: 'RetroMac Society' },
        });

        const res = await graphqlQuery(app, `
            query($id: ID!) { exhibitionTemplate(id: $id) { id name orgName layout } }
        `, { id: tmpl.id }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.exhibitionTemplate.name).toBe('My Show');
        expect(res.data.exhibitionTemplate.orgName).toBe('RetroMac Society');
        expect(res.data.exhibitionTemplate.layout).toBe('DISPLAY_CARD');
    });

    it('returns null for unknown id', async () => {
        const res = await graphqlQuery(app, `
            query { exhibitionTemplate(id: "nonexistent-id") { id name } }
        `, undefined, token);
        expect(res.errors).toBeUndefined();
        expect(res.data.exhibitionTemplate).toBeNull();
    });
});

describe('createExhibitionTemplate', () => {
    it('creates a template with defaults', async () => {
        const res = await graphqlQuery(app, `
            mutation {
                createExhibitionTemplate(input: { name: "Test Template" }) {
                    ${TEMPLATE_FIELDS}
                }
            }
        `, undefined, token);

        expect(res.errors).toBeUndefined();
        const t = res.data.createExhibitionTemplate;
        expect(t.name).toBe('Test Template');
        expect(t.layout).toBe('A4_FULL');
        expect(t.showQR).toBe(true);
        expect(t.showManufacturer).toBe(true);
        expect(t.showModel).toBe(true);
        expect(t.showSerial).toBe(true);
        expect(t.showYear).toBe(true);
        expect(t.showCategory).toBe(true);
        expect(t.showStatus).toBe(false);
        expect(t.showCondition).toBe(true);
        expect(t.showLocation).toBe(false);
        expect(t.showDescription).toBe(true);
        expect(t.showSpecs).toBe(true);
        expect(t.showTags).toBe(false);
        expect(t.showCustomFields).toBe(false);
        expect(t.orgName).toBeNull();
        expect(t.logoPath).toBeNull();
        expect(t.customHtml).toBeNull();
        expect(t.id).toBeDefined();
        expect(t.createdAt).toBeDefined();
    });

    it('creates a template with all fields', async () => {
        const res = await graphqlQuery(app, `
            mutation {
                createExhibitionTemplate(input: {
                    name: "Full Template",
                    orgName: "RetroMac Society",
                    layout: "COMPACT_LABEL",
                    accentColor: "#ff0000",
                    footerText: "On loan from the collection",
                    showQR: false,
                    showManufacturer: false,
                    showStatus: true,
                    showLocation: true,
                    showTags: true,
                    showCustomFields: true,
                }) {
                    name orgName layout accentColor footerText
                    showQR showManufacturer showStatus showLocation showTags showCustomFields
                }
            }
        `, undefined, token);

        expect(res.errors).toBeUndefined();
        const t = res.data.createExhibitionTemplate;
        expect(t.name).toBe('Full Template');
        expect(t.orgName).toBe('RetroMac Society');
        expect(t.layout).toBe('COMPACT_LABEL');
        expect(t.accentColor).toBe('#ff0000');
        expect(t.footerText).toBe('On loan from the collection');
        expect(t.showQR).toBe(false);
        expect(t.showManufacturer).toBe(false);
        expect(t.showStatus).toBe(true);
        expect(t.showLocation).toBe(true);
        expect(t.showTags).toBe(true);
        expect(t.showCustomFields).toBe(true);
    });

    it('creates a CUSTOM layout template with customHtml', async () => {
        const res = await graphqlQuery(app, `
            mutation {
                createExhibitionTemplate(input: {
                    name: "Custom HTML",
                    layout: "CUSTOM",
                    customHtml: "<h1>{{device.name}}</h1>",
                }) {
                    name layout customHtml
                }
            }
        `, undefined, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createExhibitionTemplate.layout).toBe('CUSTOM');
        expect(res.data.createExhibitionTemplate.customHtml).toBe('<h1>{{device.name}}</h1>');
    });

    it('requires authentication', async () => {
        const res = await graphqlQuery(app, `
            mutation { createExhibitionTemplate(input: { name: "Test" }) { id } }
        `);
        expect(res.errors).toBeDefined();
    });
});

describe('updateExhibitionTemplate', () => {
    it('updates fields', async () => {
        const prisma = getTestPrismaClient();
        const tmpl = await (prisma as any).exhibitionTemplate.create({
            data: { name: 'Original', layout: 'A4_FULL' },
        });

        const res = await graphqlQuery(app, `
            mutation($id: ID!) {
                updateExhibitionTemplate(id: $id, input: {
                    name: "Updated",
                    layout: "DISPLAY_CARD",
                    showStatus: true,
                }) {
                    name layout showStatus
                }
            }
        `, { id: tmpl.id }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.updateExhibitionTemplate.name).toBe('Updated');
        expect(res.data.updateExhibitionTemplate.layout).toBe('DISPLAY_CARD');
        expect(res.data.updateExhibitionTemplate.showStatus).toBe(true);
    });
});

describe('deleteExhibitionTemplate', () => {
    it('deletes an existing template', async () => {
        const prisma = getTestPrismaClient();
        const tmpl = await (prisma as any).exhibitionTemplate.create({
            data: { name: 'To Delete', layout: 'A4_FULL' },
        });

        const res = await graphqlQuery(app, `
            mutation($id: ID!) { deleteExhibitionTemplate(id: $id) }
        `, { id: tmpl.id }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.deleteExhibitionTemplate).toBe(true);

        const check = await (prisma as any).exhibitionTemplate.findUnique({ where: { id: tmpl.id } });
        expect(check).toBeNull();
    });

    it('requires authentication', async () => {
        const res = await graphqlQuery(app, `
            mutation { deleteExhibitionTemplate(id: "any-id") }
        `);
        expect(res.errors).toBeDefined();
    });
});
