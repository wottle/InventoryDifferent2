import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:testpass@localhost:5433/inventory_test';

process.env.DATABASE_URL = TEST_DATABASE_URL;

let prismaClient: PrismaClient | null = null;

export function getTestPrismaClient(): PrismaClient {
    if (!prismaClient) {
        prismaClient = new PrismaClient({
            datasources: { db: { url: TEST_DATABASE_URL } },
        });
    }
    return prismaClient;
}

export async function cleanDatabase(): Promise<void> {
    const prisma = getTestPrismaClient();
    await prisma.$executeRawUnsafe(`
        TRUNCATE TABLE
            "Image", "Note", "MaintenanceTask", "_DeviceToTag",
            "Device", "Template", "Tag", "Category"
        RESTART IDENTITY CASCADE;
    `);
}

export async function seedCategories(): Promise<{ computer: any; peripheral: any }> {
    const prisma = getTestPrismaClient();
    const computer = await prisma.category.create({ data: { name: 'Computers', type: 'COMPUTER', sortOrder: 1 } });
    const peripheral = await prisma.category.create({ data: { name: 'Peripherals', type: 'PERIPHERAL', sortOrder: 2 } });
    return { computer, peripheral };
}

export async function disconnectPrisma(): Promise<void> {
    if (prismaClient) {
        await prismaClient.$disconnect();
        prismaClient = null;
    }
}
