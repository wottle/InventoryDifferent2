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

describe('createNote', () => {
    it('creates a note', async () => {
        const res = await graphqlQuery(app, `
            mutation($input: NoteCreateInput!) {
                createNote(input: $input) { id content date }
            }
        `, {
            input: { deviceId, content: 'Test note', date: '2024-01-01T00:00:00Z' },
        }, token);

        expect(res.errors).toBeUndefined();
        expect(res.data.createNote.content).toBe('Test note');
    });
});

describe('updateNote', () => {
    it('updates a note', async () => {
        const prisma = getTestPrismaClient();
        const note = await prisma.note.create({
            data: { deviceId, content: 'Original', date: new Date() },
        });

        const res = await graphqlQuery(app, `
            mutation($input: NoteUpdateInput!) {
                updateNote(input: $input) { id content }
            }
        `, {
            input: { id: note.id, content: 'Updated', date: '2024-06-01T00:00:00Z' },
        }, token);

        expect(res.data.updateNote.content).toBe('Updated');
    });
});

describe('deleteNote', () => {
    it('deletes a note', async () => {
        const prisma = getTestPrismaClient();
        const note = await prisma.note.create({
            data: { deviceId, content: 'Delete me', date: new Date() },
        });

        const res = await graphqlQuery(app, `
            mutation($id: Int!) { deleteNote(id: $id) }
        `, { id: note.id }, token);

        expect(res.data.deleteNote).toBe(true);
    });
});
