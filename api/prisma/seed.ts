import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type SeedCategory = { oldId?: number; name: string; type: 'COMPUTER' | 'PERIPHERAL' | 'ACCESSORY' | 'OTHER'; sortOrder?: number };

function sqlFilePathFromPrismaDir(filename: string) {
    const candidates = [
        // Preferred when running in Docker: /app/<file>
        path.resolve(__dirname, '..', filename),
        // Preferred when running locally: <repoRoot>/<file>
        path.resolve(__dirname, '..', '..', filename),
    ];

    for (const p of candidates) {
        if (fs.existsSync(p)) return p;
    }

    // Fall back to the local/repo-root assumption
    return candidates[1];
}

function unescapeSqlString(raw: string) {
    const trimmed = raw.trim();
    if (trimmed === 'NULL') return null;
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        const inner = trimmed.slice(1, -1);
        return inner.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
    }
    return trimmed;
}

function splitSqlFields(tupleBody: string) {
    const fields: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < tupleBody.length; i++) {
        const ch = tupleBody[i];
        const prev = i > 0 ? tupleBody[i - 1] : '';

        if (ch === "'" && prev !== '\\') {
            inQuote = !inQuote;
            current += ch;
            continue;
        }

        if (ch === ',' && !inQuote) {
            fields.push(current.trim());
            current = '';
            continue;
        }

        current += ch;
    }
    if (current.trim().length > 0) fields.push(current.trim());
    return fields;
}

function extractInsertValuesBlock(sql: string, tableName: string) {
    const insertIdx = sql.indexOf(`INSERT INTO \`${tableName}\``);
    if (insertIdx < 0) return null;
    const afterInsert = sql.slice(insertIdx);
    const valuesIdx = afterInsert.indexOf('VALUES');
    if (valuesIdx < 0) return null;
    const afterValues = afterInsert.slice(valuesIdx + 'VALUES'.length);
    const semicolonIdx = afterValues.indexOf(';');
    if (semicolonIdx < 0) return null;
    return afterValues.slice(0, semicolonIdx);
}

function splitValueTuples(valuesBlock: string) {
    const tuples: string[] = [];
    let depth = 0;
    let inQuote = false;
    let current = '';

    for (let i = 0; i < valuesBlock.length; i++) {
        const ch = valuesBlock[i];
        const prev = i > 0 ? valuesBlock[i - 1] : '';

        if (ch === "'" && prev !== '\\') {
            inQuote = !inQuote;
        }

        if (!inQuote) {
            if (ch === '(') {
                if (depth === 0) {
                    current = '';
                } else {
                    current += ch;
                }
                depth++;
                continue;
            }
            if (ch === ')') {
                depth--;
                if (depth === 0) {
                    tuples.push(current);
                    current = '';
                    continue;
                }
            }
        }

        if (depth > 0) {
            current += ch;
        }
    }

    return tuples;
}

function mapCategoryType(name: string, isComputerType: number): SeedCategory['type'] {
    if (isComputerType === 1) {
        return 'COMPUTER';
    }
    if (name === 'Keyboards' || name === 'Monitors') return 'PERIPHERAL';
    if (name === 'Accessories') return 'ACCESSORY';
    return 'OTHER';
}

function normalizeCategoryName(name: string) {
    if (name === 'All-In-Ones') return 'All-in-Ones';
    return name;
}

function parseCategoriesFromSql(sql: string): SeedCategory[] {
    const valuesBlock = extractInsertValuesBlock(sql, 'category');
    if (!valuesBlock) return [];

    const tuples = splitValueTuples(valuesBlock);
    const categories: SeedCategory[] = [];

    for (const tupleBody of tuples) {
        const fields = splitSqlFields(tupleBody);
        if (fields.length < 4) continue;
        const oldId = Number(fields[0]);
        const rawName = unescapeSqlString(fields[1]);
        const name = typeof rawName === 'string' ? normalizeCategoryName(rawName) : '';
        const isComputerType = Number(fields[2]);
        const sortOrder = Number(fields[3]);
        if (!name) continue;
        categories.push({ oldId, name, type: mapCategoryType(name, isComputerType), sortOrder });
    }

    return categories;
}

type ParsedTemplate = {
    id: number;
    name: string;
    categoryId: number;
    additionalName?: string;
    manufacturer?: string;
    modelNumber?: string;
    releaseYear?: number;
    estimatedValue?: number;
    cpu?: string;
    ram?: string;
    graphics?: string;
    storage?: string;
    operatingSystem?: string;
    externalUrl?: string;
    isWifiEnabled?: boolean;
    isPramBatteryRemoved?: boolean;
};

function templateDisplayName(deviceName: string, additionalName: string | null) {
    const extra = (additionalName ?? '').trim();
    if (!extra) return deviceName;
    return `${deviceName} (${extra})`;
}

function parseTemplatesFromSql(sql: string, oldCategoryIdToNewId: Map<number, number>) {
    const valuesBlock = extractInsertValuesBlock(sql, 'device_templates');
    if (!valuesBlock) return [];

    const tuples = splitValueTuples(valuesBlock);
    const templates: ParsedTemplate[] = [];

    for (const tupleBody of tuples) {
        const fields = splitSqlFields(tupleBody);
        if (fields.length < 17) continue;

        const templateId = Number(fields[0]);
        const deleted = Number(fields[1]);
        if (deleted === 1) continue;

        const deviceName = unescapeSqlString(fields[2]);
        if (typeof deviceName !== 'string' || !deviceName.trim()) continue;

        const additionalName = unescapeSqlString(fields[3]);
        const estimatedValueRaw = unescapeSqlString(fields[4]);
        const oldCategoryId = Number(fields[5]);
        const manufacturer = unescapeSqlString(fields[6]);
        const modelNumber = unescapeSqlString(fields[7]);
        const generalInfoUrl = unescapeSqlString(fields[8]);
        const releaseYearRaw = unescapeSqlString(fields[9]);
        const processorType = unescapeSqlString(fields[10]);
        const cpu = unescapeSqlString(fields[11]);
        const ram = unescapeSqlString(fields[12]);
        const graphics = unescapeSqlString(fields[13]);
        const storage = unescapeSqlString(fields[14]);

        const categoryId = oldCategoryIdToNewId.get(oldCategoryId);
        if (!categoryId) {
            throw new Error(`No category mapping for old category_id=${oldCategoryId} (template_id=${templateId})`);
        }

        const tpl: ParsedTemplate = {
            id: templateId,
            name: deviceName.trim(),
            categoryId,
        };

        if (typeof additionalName === 'string' && additionalName.trim()) tpl.additionalName = additionalName.trim();
        if (typeof manufacturer === 'string' && manufacturer.trim()) tpl.manufacturer = manufacturer.trim();
        if (typeof modelNumber === 'string' && modelNumber.trim()) tpl.modelNumber = modelNumber.trim();
        if (typeof generalInfoUrl === 'string' && generalInfoUrl.trim()) tpl.externalUrl = generalInfoUrl.trim();
        // processorType exists in the source SQL but we are intentionally not storing it on Template for now.
        void processorType;
        if (typeof cpu === 'string' && cpu.trim()) tpl.cpu = cpu.trim();
        if (typeof ram === 'string' && ram.trim()) tpl.ram = ram.trim();
        if (typeof graphics === 'string' && graphics.trim()) tpl.graphics = graphics.trim();
        if (typeof storage === 'string' && storage.trim()) tpl.storage = storage.trim();

        if (releaseYearRaw !== null && releaseYearRaw !== '' && !Number.isNaN(Number(releaseYearRaw))) {
            tpl.releaseYear = Number(releaseYearRaw);
        }
        if (estimatedValueRaw !== null && estimatedValueRaw !== '' && !Number.isNaN(Number(estimatedValueRaw))) {
            tpl.estimatedValue = Number(estimatedValueRaw);
        }

        templates.push(tpl);
    }

    return templates;
}

async function main() {
    const categoriesSqlPath = sqlFilePathFromPrismaDir('category.sql');
    const templatesSqlPath = sqlFilePathFromPrismaDir('device_templates.sql');

    const fallbackCategories: SeedCategory[] = [
        { name: 'Compacts', type: 'COMPUTER', sortOrder: 10 },
        { name: 'All-in-Ones', type: 'COMPUTER', sortOrder: 20 },
        { name: 'Desktops', type: 'COMPUTER', sortOrder: 30 },
        { name: 'Towers', type: 'COMPUTER', sortOrder: 40 },
        { name: 'Servers', type: 'COMPUTER', sortOrder: 50 },
        { name: 'Laptops', type: 'COMPUTER', sortOrder: 60 },
        { name: 'Portables', type: 'COMPUTER', sortOrder: 70 },
        { name: 'Keyboards', type: 'PERIPHERAL', sortOrder: 80 },
        { name: 'Monitors', type: 'PERIPHERAL', sortOrder: 90 },
        { name: 'Accessories', type: 'ACCESSORY', sortOrder: 100 },
        { name: 'Non-Apples', type: 'COMPUTER', sortOrder: 110 },
    ];

    let categories: SeedCategory[] = fallbackCategories;
    if (fs.existsSync(categoriesSqlPath)) {
        const categorySql = fs.readFileSync(categoriesSqlPath, 'utf8');
        const parsed = parseCategoriesFromSql(categorySql);
        if (parsed.length > 0) categories = parsed;
    }

    console.log('Seeding categories...');
    for (const cat of categories) {
        await (prisma as any).category.upsert({
            where: { name: cat.name },
            update: {
                type: cat.type as any,
                sortOrder: cat.sortOrder ?? 0,
            },
            create: {
                name: cat.name,
                type: cat.type as any,
                sortOrder: cat.sortOrder ?? 0,
            },
        });
    }

    const categoriesInDb = await prisma.category.findMany();
    const nameToId = new Map(categoriesInDb.map(c => [c.name, c.id] as const));
    const oldCategoryIdToNewId = new Map<number, number>();
    for (const cat of categories) {
        if (cat.oldId !== undefined) {
            const newId = nameToId.get(cat.name);
            if (!newId) {
                throw new Error(`Category not found after upsert: ${cat.name}`);
            }
            oldCategoryIdToNewId.set(cat.oldId, newId);
        }
    }

    if (fs.existsSync(templatesSqlPath)) {
        const templatesSql = fs.readFileSync(templatesSqlPath, 'utf8');
        const templates = parseTemplatesFromSql(templatesSql, oldCategoryIdToNewId);
        if (templates.length > 0) {
            console.log('Seeding templates...');
            for (const tpl of templates) {
                await (prisma as any).template.upsert({
                    where: { id: tpl.id },
                    update: {
                        name: tpl.name,
                        additionalName: tpl.additionalName,
                        manufacturer: tpl.manufacturer,
                        modelNumber: tpl.modelNumber,
                        releaseYear: tpl.releaseYear,
                        estimatedValue: tpl.estimatedValue,
                        cpu: tpl.cpu,
                        ram: tpl.ram,
                        graphics: tpl.graphics,
                        storage: tpl.storage,
                        operatingSystem: tpl.operatingSystem,
                        externalUrl: tpl.externalUrl,
                        isWifiEnabled: tpl.isWifiEnabled,
                        isPramBatteryRemoved: tpl.isPramBatteryRemoved,
                        categoryId: tpl.categoryId,
                    },
                    create: {
                        id: tpl.id,
                        name: tpl.name,
                        additionalName: tpl.additionalName,
                        manufacturer: tpl.manufacturer,
                        modelNumber: tpl.modelNumber,
                        releaseYear: tpl.releaseYear,
                        estimatedValue: tpl.estimatedValue,
                        cpu: tpl.cpu,
                        ram: tpl.ram,
                        graphics: tpl.graphics,
                        storage: tpl.storage,
                        operatingSystem: tpl.operatingSystem,
                        externalUrl: tpl.externalUrl,
                        isWifiEnabled: tpl.isWifiEnabled,
                        isPramBatteryRemoved: tpl.isPramBatteryRemoved,
                        categoryId: tpl.categoryId,
                    },
                });
            }

            // Reset the PostgreSQL sequence to avoid unique constraint errors on future inserts
            await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Template"', 'id'), COALESCE((SELECT MAX(id) FROM "Template"), 0) + 1, false)`;
        }
    }

    // Create a sample device if none exists
    // const count = await prisma.device.count();
    // if (count === 0) {
    //     console.log('Seeding sample device...');
    //     const compactCategory = await prisma.category.findUnique({ where: { name: 'Compacts' } });
    //     if (compactCategory) {
    //         await prisma.device.create({
    //             data: {
    //                 name: 'Macintosh SE',
    //                 manufacturer: 'Apple',
    //                 modelNumber: 'M5011',
    //                 serialNumber: 'F90362',
    //                 releaseYear: 1987,
    //                 location: 'Shelf A',
    //                 status: 'AVAILABLE',
    //                 categoryId: compactCategory.id,
    //                 info: 'Dual floppy drive model.',
    //             },
    //         });
    //     }
    // }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
