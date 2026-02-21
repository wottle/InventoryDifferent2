import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:testpass@localhost:5433/inventory_test';
const JWT_SECRET = 'test-jwt-secret';

// Set env vars before any imports that might read them
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = JWT_SECRET;
process.env.AUTH_PASSWORD = 'testpassword';
process.env.AUTH_USERNAME = 'admin';

let prismaClient: PrismaClient | null = null;

export function getTestPrismaClient(): PrismaClient {
    if (!prismaClient) {
        prismaClient = new PrismaClient({
            datasources: {
                db: { url: TEST_DATABASE_URL },
            },
        });
    }
    return prismaClient;
}

export async function cleanDatabase(): Promise<void> {
    const prisma = getTestPrismaClient();
    // Truncate in dependency order
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            "Image",
            "Note",
            "MaintenanceTask",
            "_DeviceToTag",
            "Device",
            "Template",
            "Tag",
            "Category"
        RESTART IDENTITY CASCADE;
    `);
}

export async function seedCategories(): Promise<{ computer: any; peripheral: any }> {
    const prisma = getTestPrismaClient();
    const computer = await (prisma as any).category.create({
        data: { name: 'Computers', type: 'COMPUTER', sortOrder: 1 },
    });
    const peripheral = await (prisma as any).category.create({
        data: { name: 'Peripherals', type: 'PERIPHERAL', sortOrder: 2 },
    });
    return { computer, peripheral };
}

export function getAuthToken(): string {
    return jwt.sign({ type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
}

export function getRefreshToken(): string {
    return jwt.sign({ type: 'refresh' }, JWT_SECRET, { expiresIn: '7d' });
}

export async function disconnectPrisma(): Promise<void> {
    if (prismaClient) {
        await prismaClient.$disconnect();
        prismaClient = null;
    }
}
