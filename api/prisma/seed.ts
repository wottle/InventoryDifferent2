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
        return inner.replace(/\\'/g, "'").replace(/\\\\/g, '\\').replace(/\\"/g, '"');
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
    externalLinkLabel?: string;
    isWifiEnabled?: boolean;
    isPramBatteryRemoved?: boolean;
    rarity?: string;
};

// Rarity map keyed by device name. Unlisted templates default to COMMON.
const TEMPLATE_RARITY: Record<string, string> = {
    // EXTREMELY_RARE
    'Macintosh 128k':                        'EXTREMELY_RARE',
    'Apple Lisa':                            'EXTREMELY_RARE',
    'Apple Lisa 2':                          'EXTREMELY_RARE',
    'Apple Lisa 2/10':                       'EXTREMELY_RARE',
    'Macintosh TV':                          'EXTREMELY_RARE',
    'Twentieth Anniversary Macintosh':       'EXTREMELY_RARE',
    'Macintosh Color Classic II':            'EXTREMELY_RARE',
    'PowerBook 550c':                        'EXTREMELY_RARE',
    'Apple III':                             'EXTREMELY_RARE',
    'Apple III Plus':                        'EXTREMELY_RARE',
    'NeXT Cube':                             'EXTREMELY_RARE',
    'NeXTcube Turbo':                        'EXTREMELY_RARE',

    // VERY_RARE
    'Macintosh IIfx':                        'VERY_RARE',
    'Macintosh Quadra 900':                  'VERY_RARE',
    'Macintosh Quadra 950':                  'VERY_RARE',
    'Macintosh Portable':                    'VERY_RARE',
    'Macintosh Portable Backlit':            'VERY_RARE',
    'Power Macintosh G4 Cube':               'VERY_RARE',
    'Power Macintosh 9500/132':              'VERY_RARE',
    'Power Macintosh 9600':                  'VERY_RARE',
    'PowerBook Duo 2300c':                   'VERY_RARE',
    'Apple IIGS':                            'VERY_RARE',
    'Apple Newton MessagePad':               'VERY_RARE',
    'Apple Newton MessagePad 100':           'VERY_RARE',
    'Apple Newton MessagePad 2000':          'VERY_RARE',
    'Apple Newton MessagePad 2100':          'VERY_RARE',
    'NeXTstation Turbo':                     'VERY_RARE',
    'NeXTstation Turbo Color':               'VERY_RARE',
    'Xserve G4':                             'VERY_RARE',
    'Xserve G5':                             'VERY_RARE',
    'Mac Pro (2013)':                        'VERY_RARE',
    'Power Macintosh G3 All-In-One':         'VERY_RARE',
    'Apple eMate 300':                       'VERY_RARE',
    'Twentieth Anniversary Macintosh Keyboard': '',
    'Macintosh Quadra 840AV':                'VERY_RARE',

    // RARE
     'Macintosh Color Classic':               'RARE',
    'Macintosh IIcx':                        'RARE',
    'Macintosh IIci':                        'RARE',
    'Macintosh Quadra 700':                  'RARE',
    'Macintosh Quadra 800':                  'RARE',
    'PowerBook 100':                         'RARE',
    'PowerBook Duo 210':                     'RARE',
    'PowerBook Duo 230':                     'RARE',
    'PowerBook Duo 250':                     'RARE',
    'PowerBook Duo 270c':                    'RARE',
    'PowerBook Duo 280':                     'RARE',
    'PowerBook Duo 280c':                    'RARE',
    'PowerBook 5300ce/117':                  'RARE',
    'Power Macintosh 8100/80':               'RARE',
    'Power Macintosh 9500':                  'RARE',
    'iMac G4':                               'RARE',
    'NeXTstation':                           'RARE',
    'NeXTstation Color':                     'RARE',
    'Apple Newton MessagePad 110':           'RARE',
    'Apple Newton MessagePad 120':           'RARE',
    'Apple Newton MessagePad 130':           'RARE',
    'PowerBook G3 (Kanga)':                  'RARE',
    'Performa 6300':                         'RARE',
    'Apple IIc Plus':                        'RARE',
    'Apple Adjustable Keyboard':             'RARE',
    'Newton Keyboard':                       'RARE',
    'Mac Pro (Early 2006)':                  'RARE',
    'Mac Pro (Early 2008)':                  'RARE',
    'Mac Pro (Early 2009)':                  'RARE',
    'Mac Pro (Mid 2010)':                    'RARE',
    'Mac Pro (Mid 2012)':                    'RARE',
    'Apple II':                              'RARE',
    'Original Macintosh Keyboard':           'RARE',
    'Lisa Keyboard':                         'RARE',
    'Macintosh SE/30':                       'RARE',

    // UNCOMMON
    'Macintosh 512k':                        'UNCOMMON',
    'Macintosh 512Ke':                       'UNCOMMON',
    'Macintosh Classic II':                  'UNCOMMON',
    'Macintosh IIx':                         'UNCOMMON',
    'Macintosh IIsi':                        'UNCOMMON',
    'Macintosh IIvi':                        'UNCOMMON',
    'Macintosh IIvx':                        'UNCOMMON',
    'Macintosh II':                          'UNCOMMON',
    'Macintosh LC 475':                      'UNCOMMON',
    'Macintosh LC 520':                      'UNCOMMON',
    'Macintosh LC 550':                      'UNCOMMON',
    'Macintosh LC 575':                      'UNCOMMON',
    'Macintosh LC 580':                      'UNCOMMON',
    'Macintosh LC 630':                      'UNCOMMON',
    'Macintosh Quadra 610':                  'UNCOMMON',
    'Macintosh Quadra 630':                  'UNCOMMON',
    'Macintosh Quadra 650':                  'UNCOMMON',
    'Macintosh Quadra 660AV':                'UNCOMMON',
    'PowerBook 140':                         'UNCOMMON',
    'PowerBook 145':                         'UNCOMMON',
    'PowerBook 150':                         'UNCOMMON',
    'PowerBook 160':                         'UNCOMMON',
    'PowerBook 165':                         'UNCOMMON',
    'PowerBook 165c':                        'UNCOMMON',
    'PowerBook 170':                         'UNCOMMON',
    'PowerBook 180':                         'UNCOMMON',
    'PowerBook 180c':                        'UNCOMMON',
    'PowerBook 190':                         'UNCOMMON',
    'PowerBook 190cs':                       'UNCOMMON',
    'PowerBook 520':                         'UNCOMMON',
    'PowerBook 520c':                        'UNCOMMON',
    'PowerBook 540':                         'UNCOMMON',
    'PowerBook 540c':                        'UNCOMMON',
    'PowerBook 5300/100':                    'UNCOMMON',
    'PowerBook 5300cs/100':                  'UNCOMMON',
    'PowerBook 5300c/100':                   'UNCOMMON',
    'PowerBook 1400cs/117':                  'UNCOMMON',
    'PowerBook 1400c/117':                   'UNCOMMON',
    'PowerBook 1400cs/133':                  'UNCOMMON',
    'PowerBook 1400c/133':                   'UNCOMMON',
    'PowerBook 1400cs/166':                  'UNCOMMON',
    'PowerBook 1400c/166':                   'UNCOMMON',
    'PowerBook 2400c/180':                   'UNCOMMON',
    'PowerBook 2400c/240':                   'UNCOMMON',
    'PowerBook 3400c/180':                   'UNCOMMON',
    'PowerBook 3400c/200':                   'UNCOMMON',
    'PowerBook 3400c/240':                   'UNCOMMON',
    'Power Macintosh 7200/75':               'UNCOMMON',
    'Power Macintosh 7300':                  'UNCOMMON',
    'Power Macintosh 7500/100':              'UNCOMMON',
    'Power Macintosh 7600':                  'UNCOMMON',
    'Power Macintosh 8500/120':              'UNCOMMON',
    'Power Macintosh 8600':                  'UNCOMMON',
    'Power Macintosh 4400/200':              'UNCOMMON',
    'Power Macintosh 5400':                  'UNCOMMON',
    'Power Macintosh 5500':                  'UNCOMMON',
    'Power Macintosh 6400':                  'UNCOMMON',
    'Power Macintosh 6500':                  'UNCOMMON',
    'PowerBook G3 Series (Wallstreet)':      'UNCOMMON',
    'PowerBook G3 (Bronze Keyboard)':        'UNCOMMON',
    'PowerBook G3 (FireWire)':               'UNCOMMON',
    'PowerBook G4 (Titanium)':               'UNCOMMON',
    'PowerBook G4 (DVI)':                    'UNCOMMON',
    'PowerBook G4 (12-inch)':                'UNCOMMON',
    'PowerBook G4 (15-inch)':                'UNCOMMON',
    'PowerBook G4 (17-inch)':                'UNCOMMON',
    'iBook G3':                              'UNCOMMON',
    'Mac mini G4':                           'UNCOMMON',
    'eMac':                                  'UNCOMMON',
    'iMac G5':                               'UNCOMMON',
    'Apple IIc':                             'UNCOMMON',
    'Apple II Plus':                         'UNCOMMON',
};

function linkLabelFromUrl(url: string): string | undefined {
    try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        if (host.includes('everymac.com')) return 'EveryMac';
        if (host.includes('wikipedia.org')) return 'Wikipedia';
        if (host.includes('apple.com')) return 'Apple';
        if (host.includes('next.com') || host.includes('nextcomputers.org')) return 'NeXT';
        return 'Reference';
    } catch {
        return undefined;
    }
}

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
        if (typeof generalInfoUrl === 'string' && generalInfoUrl.trim()) {
            tpl.externalUrl = generalInfoUrl.trim();
            tpl.externalLinkLabel = linkLabelFromUrl(generalInfoUrl.trim());
        }
        // processorType exists in the source SQL but we are intentionally not storing it on Template for now.
        void processorType;
        if (typeof cpu === 'string' && cpu.trim()) tpl.cpu = cpu.trim();
        if (typeof ram === 'string' && ram.trim()) tpl.ram = ram.trim();
        if (typeof graphics === 'string' && graphics.trim()) tpl.graphics = graphics.trim();
        if (typeof storage === 'string' && storage.trim()) tpl.storage = storage.trim();

        const rarity = TEMPLATE_RARITY[tpl.name];
        if (rarity) tpl.rarity = rarity;

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

    const existingCategoryCount = await prisma.category.count();
    if (existingCategoryCount > 0) {
        console.log('Categories already exist — skipping seed.');
        return;
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
                        externalLinkLabel: tpl.externalLinkLabel,
                        isWifiEnabled: tpl.isWifiEnabled,
                        isPramBatteryRemoved: tpl.isPramBatteryRemoved,
                        rarity: tpl.rarity as any,
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
                        externalLinkLabel: tpl.externalLinkLabel,
                        isWifiEnabled: tpl.isWifiEnabled,
                        isPramBatteryRemoved: tpl.isPramBatteryRemoved,
                        rarity: tpl.rarity as any,
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

    // Seed timeline events
    const timelineEventData = [
        { year: 1975, title: "Altair 8800 ships", description: "MITS ships the Altair 8800 kit computer, sparking the home computer revolution and inspiring Bill Gates and Paul Allen to write BASIC for it.", titleDe: "Altair 8800 erscheint", descriptionDe: "MITS liefert den Altair 8800 als Bausatz aus und löst damit die Heimcomputerrevolution aus – und inspiriert Bill Gates und Paul Allen, BASIC dafür zu schreiben.", titleFr: "Sortie de l'Altair 8800", descriptionFr: "MITS expédie l'Altair 8800 en kit, déclenchant la révolution de l'ordinateur personnel et inspirant Bill Gates et Paul Allen à écrire BASIC pour lui.", type: "tech", sortOrder: 0 },
        { year: 1976, title: "Apple Computer founded", description: "Steve Jobs, Steve Wozniak, and Ronald Wayne found Apple Computer on April 1st. The Apple I is sold as a bare circuit board.", titleDe: "Apple Computer gegründet", descriptionDe: "Steve Jobs, Steve Wozniak und Ronald Wayne gründen Apple Computer am 1. April. Der Apple I wird als blanke Platine verkauft.", titleFr: "Fondation d'Apple Computer", descriptionFr: "Steve Jobs, Steve Wozniak et Ronald Wayne fondent Apple Computer le 1er avril. L'Apple I est vendu comme simple circuit imprimé.", type: "apple", sortOrder: 0 },
        { year: 1977, title: "Apple II introduced", description: "The Apple II launches at the West Coast Computer Faire — one of the first mass-market personal computers with color graphics and an open architecture.", titleDe: "Apple II vorgestellt", descriptionDe: "Der Apple II wird auf der West Coast Computer Faire vorgestellt – einer der ersten Massenmarkt-PCs mit Farbgrafik und offener Architektur.", titleFr: "Présentation de l'Apple II", descriptionFr: "L'Apple II est lancé à la West Coast Computer Faire – l'un des premiers ordinateurs personnels grand public avec graphiques couleur et architecture ouverte.", type: "apple", sortOrder: 0 },
        { year: 1977, title: "The 1977 Trinity", description: "Apple II, Commodore PET, and TRS-80 all debut — defining the personal computer market.", titleDe: "Die Dreiheit von 1977", descriptionDe: "Apple II, Commodore PET und TRS-80 debütieren alle – und definieren den Markt für Heimcomputer.", titleFr: "La trinité de 1977", descriptionFr: "L'Apple II, le Commodore PET et le TRS-80 font tous leurs débuts – définissant le marché de l'ordinateur personnel.", type: "tech", sortOrder: 1 },
        { year: 1979, title: "VisiCalc released", description: "The first killer app: VisiCalc, the spreadsheet that makes the Apple II indispensable to businesses.", titleDe: "VisiCalc veröffentlicht", descriptionDe: "Die erste Killer-App: VisiCalc, die Tabellenkalkulation, die den Apple II für Unternehmen unverzichtbar macht.", titleFr: "Sortie de VisiCalc", descriptionFr: "La première application incontournable : VisiCalc, le tableur qui rend l'Apple II indispensable aux entreprises.", type: "tech", sortOrder: 0 },
        { year: 1980, title: "Apple goes public", description: "Apple's IPO raises $101 million — the largest since Ford in 1956 — and creates more millionaires overnight than any company in history.", titleDe: "Apple geht an die Börse", descriptionDe: "Apples Börsengang bringt 101 Millionen Dollar ein – der größte seit Ford 1956 – und schafft über Nacht mehr Millionäre als jedes andere Unternehmen in der Geschichte.", titleFr: "Introduction en Bourse d'Apple", descriptionFr: "L'introduction en Bourse d'Apple lève 101 millions de dollars – la plus importante depuis Ford en 1956 – créant plus de millionnaires en une nuit que toute autre entreprise de l'histoire.", type: "apple", sortOrder: 0 },
        { year: 1981, title: "IBM PC introduced", description: "IBM launches the IBM Personal Computer 5150 running PC-DOS. Its open architecture spawns a clone industry that reshapes computing.", titleDe: "IBM PC vorgestellt", descriptionDe: "IBM bringt den IBM Personal Computer 5150 mit PC-DOS auf den Markt. Seine offene Architektur bringt eine Klonindustrie hervor, die die Computerwelt umgestaltet.", titleFr: "Présentation de l'IBM PC", descriptionFr: "IBM lance l'IBM Personal Computer 5150 sous PC-DOS. Son architecture ouverte engendre une industrie de clones qui redéfinit l'informatique.", type: "tech", sortOrder: 0 },
        { year: 1983, title: "Apple Lisa introduced", description: "Apple's Lisa debuts as the first commercial personal computer with a graphical interface and mouse — priced at $9,995.", titleDe: "Apple Lisa vorgestellt", descriptionDe: "Apples Lisa debütiert als erster kommerzieller PC mit grafischer Oberfläche und Maus – zum Preis von 9.995 Dollar.", titleFr: "Présentation de l'Apple Lisa", descriptionFr: "L'Apple Lisa débute comme le premier ordinateur personnel commercial doté d'une interface graphique et d'une souris – au prix de 9 995 $.", type: "apple", sortOrder: 0 },
        { year: 1984, title: "Macintosh 128K introduced", description: "The original Macintosh launches January 24th after the iconic '1984' Super Bowl ad. It ships with MacPaint and MacWrite and changes personal computing forever.", titleDe: "Macintosh 128K vorgestellt", descriptionDe: "Der originale Macintosh erscheint am 24. Januar nach dem legendären '1984'-Super-Bowl-Werbespot. Er wird mit MacPaint und MacWrite geliefert und verändert die PC-Welt für immer.", titleFr: "Présentation du Macintosh 128K", descriptionFr: "Le Macintosh original est lancé le 24 janvier après la publicité emblématique du Super Bowl '1984'. Livré avec MacPaint et MacWrite, il révolutionne l'informatique personnelle.", type: "apple", sortOrder: 0 },
        { year: 1984, title: "System 1.0 released", description: "System 1.0 ships with the original Macintosh — a single-tasking graphical OS with the Finder, MacPaint, and MacWrite. It fits on a 400K floppy and sets the template for personal computing GUIs.", titleDe: "System 1.0 veröffentlicht", descriptionDe: "System 1.0 wird mit dem originalen Macintosh geliefert – ein grafisches Single-Tasking-Betriebssystem mit Finder, MacPaint und MacWrite. Es passt auf eine 400-KB-Diskette und setzt den Standard für grafische Benutzeroberflächen.", titleFr: "Sortie de System 1.0", descriptionFr: "System 1.0 est livré avec le Macintosh original – un OS graphique monotâche avec le Finder, MacPaint et MacWrite. Il tient sur une disquette de 400 Ko et établit le modèle des interfaces graphiques.", type: "apple", sortOrder: 1 },
        { year: 1984, title: "Mac 512K (Fat Mac)", description: "Apple releases the Macintosh 512K, quadrupling RAM over the original and earning the nickname 'Fat Mac'.", titleDe: "Mac 512K (Fat Mac)", descriptionDe: "Apple veröffentlicht den Macintosh 512K mit viermal so viel RAM wie das Original – daher der Spitzname 'Fat Mac'.", titleFr: "Mac 512K (Fat Mac)", descriptionFr: "Apple lance le Macintosh 512K, quadruplant la RAM par rapport à l'original, lui valant le surnom de 'Fat Mac'.", type: "apple", sortOrder: 2 },
        { year: 1985, title: "Steve Jobs leaves Apple", description: "Jobs resigns from Apple following a boardroom power struggle and founds NeXT Computer.", titleDe: "Steve Jobs verlässt Apple", descriptionDe: "Jobs tritt nach einem Machtkampf im Vorstand von Apple zurück und gründet NeXT Computer.", titleFr: "Steve Jobs quitte Apple", descriptionFr: "Jobs démissionne d'Apple après une lutte de pouvoir au conseil d'administration et fonde NeXT Computer.", type: "apple", sortOrder: 0 },
        { year: 1985, title: "Windows 1.0 ships", description: "Microsoft ships Windows 1.0, a graphical shell for MS-DOS — roundly criticized but the beginning of a 40-year platform.", titleDe: "Windows 1.0 erscheint", descriptionDe: "Microsoft liefert Windows 1.0 aus, eine grafische Oberfläche für MS-DOS – scharf kritisiert, aber der Beginn einer 40-jährigen Plattform.", titleFr: "Sortie de Windows 1.0", descriptionFr: "Microsoft lance Windows 1.0, une interface graphique pour MS-DOS – très critiquée, mais le début d'une plateforme vieille de 40 ans.", type: "tech", sortOrder: 1 },
        { year: 1986, title: "Mac Plus introduced", description: "The Mac Plus brings 1 MB RAM, SCSI, and an upgraded keyboard — becoming the longest-selling Mac model at nearly 5 years.", titleDe: "Mac Plus vorgestellt", descriptionDe: "Der Mac Plus bringt 1 MB RAM, SCSI und eine verbesserte Tastatur – und wird zum am längsten verkauften Mac-Modell mit fast 5 Jahren Laufzeit.", titleFr: "Présentation du Mac Plus", descriptionFr: "Le Mac Plus apporte 1 Mo de RAM, le SCSI et un clavier amélioré – devenant le modèle Mac le plus longtemps vendu pendant près de 5 ans.", type: "apple", sortOrder: 0 },
        { year: 1986, title: "System 3.0 released", description: "System 3.0 introduces the Hierarchical File System (HFS), replacing the flat MFS and allowing folders within folders — a foundational change that made the Mac's file system practical for hard drives.", titleDe: "System 3.0 veröffentlicht", descriptionDe: "System 3.0 führt das Hierarchical File System (HFS) ein, ersetzt das flache MFS und ermöglicht Ordner in Ordnern – eine grundlegende Änderung, die das Mac-Dateisystem für Festplatten praktikabel machte.", titleFr: "Sortie de System 3.0", descriptionFr: "System 3.0 introduit le Hierarchical File System (HFS), remplaçant le MFS plat et permettant les dossiers imbriqués – un changement fondamental qui a rendu le système de fichiers Mac pratique pour les disques durs.", type: "apple", sortOrder: 1 },
        { year: 1987, title: "Mac II and SE introduced", description: "Apple introduces the modular Mac II with color support and NuBus expansion slots, alongside the compact Mac SE.", titleDe: "Mac II und SE vorgestellt", descriptionDe: "Apple stellt den modularen Mac II mit Farbunterstützung und NuBus-Erweiterungssteckplätzen vor, zusammen mit dem kompakten Mac SE.", titleFr: "Présentation du Mac II et du Mac SE", descriptionFr: "Apple présente le Mac II modulaire avec support couleur et emplacements NuBus, ainsi que le Mac SE compact.", type: "apple", sortOrder: 0 },
        { year: 1987, title: "HyperCard released", description: "Apple ships HyperCard, a groundbreaking hypermedia tool that foreshadows the World Wide Web.", titleDe: "HyperCard veröffentlicht", descriptionDe: "Apple liefert HyperCard aus, ein bahnbrechendes Hypermedia-Werkzeug, das das World Wide Web vorwegnimmt.", titleFr: "Sortie de HyperCard", descriptionFr: "Apple lance HyperCard, un outil hypermédia révolutionnaire qui préfigure le World Wide Web.", type: "apple", sortOrder: 1 },
        { year: 1988, title: "System 6.0 released", description: "System 6.0 integrates MultiFinder, allowing multiple applications to run simultaneously for the first time. Lean, stable, and fast, it became the definitive OS for the classic compact Mac era.", titleDe: "System 6.0 veröffentlicht", descriptionDe: "System 6.0 integriert MultiFinder und ermöglicht erstmals das gleichzeitige Ausführen mehrerer Anwendungen. Schlank, stabil und schnell – es wurde das definitive Betriebssystem der klassischen kompakten Mac-Ära.", titleFr: "Sortie de System 6.0", descriptionFr: "System 6.0 intègre MultiFinder, permettant pour la première fois d'exécuter plusieurs applications simultanément. Léger, stable et rapide, il devient l'OS de référence de l'ère Mac compact classique.", type: "apple", sortOrder: 0 },
        { year: 1988, title: "NeXT Computer unveiled", description: "Steve Jobs unveils the NeXT Computer — an elegant workstation with an optical drive and object-oriented OS that later becomes the foundation of macOS.", titleDe: "NeXT Computer vorgestellt", descriptionDe: "Steve Jobs präsentiert den NeXT Computer – eine elegante Workstation mit optischem Laufwerk und objektorientiertem OS, das später die Grundlage von macOS bildet.", titleFr: "Présentation du NeXT Computer", descriptionFr: "Steve Jobs présente le NeXT Computer – une élégante station de travail avec lecteur optique et OS orienté objet, qui deviendra la base de macOS.", type: "tech", sortOrder: 1 },
        { year: 1989, title: "Mac IIci and Mac Portable", description: "Apple releases the Mac IIci (its most popular desktop of the era) and the Mac Portable — the first battery-powered Macintosh.", titleDe: "Mac IIci und Mac Portable", descriptionDe: "Apple veröffentlicht den Mac IIci (seinen populärsten Desktop der Ära) und den Mac Portable – den ersten batteriebetriebenen Macintosh.", titleFr: "Mac IIci et Mac Portable", descriptionFr: "Apple lance le Mac IIci (son bureau le plus populaire de l'époque) et le Mac Portable – le premier Macintosh alimenté par batterie.", type: "apple", sortOrder: 0 },
        { year: 1990, title: "Mac LC and Classic introduced", description: "Apple targets education with the affordable Mac LC and brings back a compact classic design with the Macintosh Classic.", titleDe: "Mac LC und Classic vorgestellt", descriptionDe: "Apple richtet sich mit dem erschwinglichen Mac LC an den Bildungsmarkt und bringt mit dem Macintosh Classic ein kompaktes klassisches Design zurück.", titleFr: "Présentation du Mac LC et du Classic", descriptionFr: "Apple cible l'éducation avec le Mac LC abordable et renoue avec un design compact classique avec le Macintosh Classic.", type: "apple", sortOrder: 0 },
        { year: 1991, title: "PowerBook 100/140/170 debut", description: "Apple's landmark PowerBook line defines the modern laptop form factor with a trackball, wrist rest, and centered keyboard.", titleDe: "PowerBook 100/140/170 Debüt", descriptionDe: "Apples wegweisende PowerBook-Linie definiert die moderne Laptop-Form mit Trackball, Handballenauflage und zentrierter Tastatur.", titleFr: "Débuts des PowerBook 100/140/170", descriptionFr: "La gamme PowerBook d'Apple définit le format moderne de l'ordinateur portable avec trackball, repose-poignets et clavier centré.", type: "apple", sortOrder: 0 },
        { year: 1991, title: "System 7 released", description: "System 7 brings color, virtual memory, networking, and aliases to the Mac OS — a major leap for the platform.", titleDe: "System 7 veröffentlicht", descriptionDe: "System 7 bringt Farbe, virtuellen Speicher, Netzwerkfähigkeit und Aliase für das Mac-Betriebssystem – ein großer Sprung für die Plattform.", titleFr: "Sortie de System 7", descriptionFr: "System 7 apporte couleur, mémoire virtuelle, mise en réseau et alias au Mac OS – un bond majeur pour la plateforme.", type: "apple", sortOrder: 1 },
        { year: 1991, title: "World Wide Web goes public", description: "Tim Berners-Lee opens the World Wide Web to the public from CERN — built on a NeXT workstation.", titleDe: "World Wide Web wird öffentlich", descriptionDe: "Tim Berners-Lee öffnet das World Wide Web für die Öffentlichkeit am CERN – entwickelt auf einer NeXT-Workstation.", titleFr: "Le World Wide Web devient public", descriptionFr: "Tim Berners-Lee ouvre le World Wide Web au public depuis le CERN – développé sur une station de travail NeXT.", type: "tech", sortOrder: 2 },
        { year: 1993, title: "Apple Newton MessagePad", description: "Apple introduces the Newton MessagePad, an early PDA with handwriting recognition — ambitious, controversial, and ahead of its time.", titleDe: "Apple Newton MessagePad", descriptionDe: "Apple stellt den Newton MessagePad vor, einen frühen PDA mit Handschrifterkennung – ehrgeizig, kontrovers und seiner Zeit voraus.", titleFr: "Apple Newton MessagePad", descriptionFr: "Apple présente le Newton MessagePad, un PDA pionnier avec reconnaissance d'écriture manuscrite – ambitieux, controversé et en avance sur son temps.", type: "apple", sortOrder: 0 },
        { year: 1993, title: "Mosaic browser released", description: "NCSA Mosaic makes the web graphical and accessible, triggering the internet boom of the 1990s.", titleDe: "Mosaic-Browser veröffentlicht", descriptionDe: "NCSA Mosaic macht das Web grafisch und zugänglich und löst den Internetboom der 1990er Jahre aus.", titleFr: "Sortie du navigateur Mosaic", descriptionFr: "NCSA Mosaic rend le Web graphique et accessible, déclenchant le boom d'Internet dans les années 1990.", type: "tech", sortOrder: 1 },
        { year: 1994, title: "Power Macintosh introduced", description: "Apple ships the first Power Macs using the IBM/Motorola PowerPC chip — the first of three major Mac architecture transitions.", titleDe: "Power Macintosh vorgestellt", descriptionDe: "Apple liefert die ersten Power Macs mit dem IBM/Motorola PowerPC-Chip – die erste von drei großen Mac-Architekturübergängen.", titleFr: "Présentation du Power Macintosh", descriptionFr: "Apple lance les premiers Power Mac avec la puce PowerPC IBM/Motorola – la première des trois grandes transitions d'architecture Mac.", type: "apple", sortOrder: 0 },
        { year: 1994, title: "Mac OS 7.5 released", description: "Mac OS 7.5 is the most feature-complete System 7 release, adding Apple Guide, WindowShade, and Macintosh Drag and Drop. Apple later made it a free download — a rare act of generosity that kept older Macs useful well into the late 90s.", titleDe: "Mac OS 7.5 veröffentlicht", descriptionDe: "Mac OS 7.5 ist die funktionsreichste System-7-Version mit Apple Guide, WindowShade und Macintosh Drag-and-Drop. Apple stellte es später als kostenlosen Download bereit – eine seltene Geste, die ältere Macs bis Ende der 90er nützlich hielt.", titleFr: "Sortie de Mac OS 7.5", descriptionFr: "Mac OS 7.5 est la version System 7 la plus complète, ajoutant Apple Guide, WindowShade et le glisser-déposer Macintosh. Apple l'a ensuite proposé en téléchargement gratuit – un geste rare qui a maintenu les vieux Mac utiles jusqu'à la fin des années 90.", type: "apple", sortOrder: 1 },
        { year: 1995, title: "Windows 95 launches", description: "Windows 95 ships to massive fanfare, introducing the Start menu, 32-bit multitasking, and plug-and-play hardware.", titleDe: "Windows 95 erscheint", descriptionDe: "Windows 95 erscheint unter großem Jubel und führt das Startmenü, 32-Bit-Multitasking und Plug-and-Play-Hardware ein.", titleFr: "Lancement de Windows 95", descriptionFr: "Windows 95 sort avec un grand battage médiatique, introduisant le menu Démarrer, le multitâche 32 bits et le matériel plug-and-play.", type: "tech", sortOrder: 0 },
        { year: 1996, title: "Apple acquires NeXT", description: "Apple buys NeXT for $429 million, bringing Steve Jobs back to Cupertino and the foundation of what becomes Mac OS X.", titleDe: "Apple übernimmt NeXT", descriptionDe: "Apple kauft NeXT für 429 Millionen Dollar und bringt damit Steve Jobs nach Cupertino zurück sowie die Grundlage für das spätere Mac OS X.", titleFr: "Apple rachète NeXT", descriptionFr: "Apple achète NeXT pour 429 millions de dollars, ramenant Steve Jobs à Cupertino et posant les fondations de ce qui deviendra Mac OS X.", type: "apple", sortOrder: 0 },
        { year: 1997, title: "Mac OS 7.6 released", description: "Mac OS 7.6 is the first release officially branded 'Mac OS' rather than 'System', marking the end of the classic System Software naming era. It also dropped support for 68000-based Macs, signaling Apple's move forward.", titleDe: "Mac OS 7.6 veröffentlicht", descriptionDe: "Mac OS 7.6 ist die erste Version, die offiziell als 'Mac OS' statt 'System' bezeichnet wird, und markiert das Ende der klassischen System-Software-Benennung. Sie strich auch die Unterstützung für 68000-basierte Macs.", titleFr: "Sortie de Mac OS 7.6", descriptionFr: "Mac OS 7.6 est la première version officiellement baptisée 'Mac OS' plutôt que 'System', marquant la fin de l'ère du logiciel système classique. Elle supprime aussi le support des Mac basés sur le 68000.", type: "apple", sortOrder: 0 },
        { year: 1997, title: "Jobs returns as CEO", description: "Steve Jobs becomes Apple's interim CEO. He axes Newton, consolidates the product line to four quadrants, and launches the Think Different campaign.", titleDe: "Jobs kehrt als CEO zurück", descriptionDe: "Steve Jobs wird Apples Interims-CEO. Er streicht Newton, konsolidiert das Produktportfolio auf vier Quadranten und startet die Think-Different-Kampagne.", titleFr: "Jobs revient en tant que PDG", descriptionFr: "Steve Jobs devient PDG par intérim d'Apple. Il supprime Newton, consolide la gamme en quatre quadrants et lance la campagne Think Different.", type: "apple", sortOrder: 1 },
        { year: 1997, title: "Mac OS 8 released", description: "Mac OS 8 ships as a major update Apple could sell separately, bypassing Macintosh clone license agreements and generating $100 million in its first two weeks — effectively ending the clone era.", titleDe: "Mac OS 8 veröffentlicht", descriptionDe: "Mac OS 8 erscheint als großes Update, das Apple separat verkaufen kann – wodurch die Macintosh-Klonlizenzverträge umgangen werden – und bringt in den ersten zwei Wochen 100 Millionen Dollar ein. Das beendet effektiv die Klon-Ära.", titleFr: "Sortie de Mac OS 8", descriptionFr: "Mac OS 8 est une mise à jour majeure qu'Apple peut vendre séparément, contournant les accords de licence des clones Macintosh et générant 100 millions de dollars en deux semaines, mettant fin à l'ère des clones.", type: "apple", sortOrder: 2 },
        { year: 1998, title: "iMac G3 introduced", description: "The translucent Bondi Blue iMac G3 launches at Macworld, restoring Apple's design credibility and returning the company to profitability.", titleDe: "iMac G3 vorgestellt", descriptionDe: "Der durchsichtige Bondi-Blue iMac G3 wird auf der Macworld vorgestellt, stellt Apples Design-Glaubwürdigkeit wieder her und bringt das Unternehmen zurück in die Gewinnzone.", titleFr: "Présentation de l'iMac G3", descriptionFr: "L'iMac G3 translucide bleu Bondi est lancé à la Macworld, restaurant la crédibilité design d'Apple et ramenant l'entreprise à la rentabilité.", type: "apple", sortOrder: 0 },
        { year: 1999, title: "iBook G3 (Clamshell) and AirPort", description: "The colorful clamshell iBook brings Apple's design language to laptops; AirPort makes consumer Wi-Fi mainstream two years before the competition.", titleDe: "iBook G3 (Clamshell) und AirPort", descriptionDe: "Das farbenfrohe Clamshell-iBook überträgt Apples Design auf Laptops; AirPort macht Consumer-WLAN zwei Jahre vor der Konkurrenz zum Massenprodukt.", titleFr: "iBook G3 (Clamshell) et AirPort", descriptionFr: "L'iBook coquille colorée apporte le langage design d'Apple aux portables ; AirPort démocratise le Wi-Fi grand public deux ans avant la concurrence.", type: "apple", sortOrder: 0 },
        { year: 1999, title: "Mac OS 9 released", description: "Mac OS 9 arrives as the last major Classic Mac OS release, adding Keychain, Sherlock 2 internet searching, and multi-user support — later serving as the compatibility layer inside Mac OS X's Classic environment.", titleDe: "Mac OS 9 veröffentlicht", descriptionDe: "Mac OS 9 erscheint als letzte große Classic-Mac-OS-Version mit Keychain, Sherlock 2 und Multi-User-Unterstützung – später die Kompatibilitätsschicht in Mac OS X's Classic-Umgebung.", titleFr: "Sortie de Mac OS 9", descriptionFr: "Mac OS 9 arrive comme la dernière grande version de Mac OS classique, ajoutant Keychain, Sherlock 2 et le support multi-utilisateurs – servant ensuite de couche de compatibilité dans l'environnement Classic de Mac OS X.", type: "apple", sortOrder: 1 },
        { year: 2000, title: "Power Mac G4 Cube", description: "The G4 Cube wows with its silent, handle-free, 8-inch cube design — a design triumph but a commercial disappointment.", titleDe: "Power Mac G4 Cube", descriptionDe: "Der G4 Cube beeindruckt mit seinem lautlosen, grifflosen 20-cm-Würfeldesign – ein Designerfolg, aber ein kommerzieller Misserfolg.", titleFr: "Power Mac G4 Cube", descriptionFr: "Le G4 Cube impressionne par son design en cube de 20 cm, silencieux et sans poignée – un triomphe du design mais une déception commerciale.", type: "apple", sortOrder: 0 },
        { year: 2001, title: "Mac OS X 10.0 ships", description: "Mac OS X debuts with its Aqua interface and Unix core — a clean break from the Classic Mac OS and the foundation for the next 25+ years.", titleDe: "Mac OS X 10.0 erscheint", descriptionDe: "Mac OS X debütiert mit seiner Aqua-Oberfläche und Unix-Kern – ein klarer Bruch mit dem Classic Mac OS und die Grundlage für die nächsten 25+ Jahre.", titleFr: "Sortie de Mac OS X 10.0", descriptionFr: "Mac OS X fait ses débuts avec son interface Aqua et son noyau Unix – une rupture nette avec le Mac OS classique et la base des 25 années suivantes.", type: "apple", sortOrder: 0 },
        { year: 2001, title: "iPod introduced", description: "The original iPod with scroll wheel launches October 23rd, beginning Apple's transformation into a consumer electronics company.", titleDe: "iPod vorgestellt", descriptionDe: "Der originale iPod mit Scroll Wheel wird am 23. Oktober vorgestellt und leitet Apples Wandlung zum Consumer-Electronics-Unternehmen ein.", titleFr: "Présentation de l'iPod", descriptionFr: "L'iPod original avec sa molette est lancé le 23 octobre, marquant la transformation d'Apple en entreprise d'électronique grand public.", type: "apple", sortOrder: 1 },
        { year: 2001, title: "First Apple Retail Stores open", description: "Apple opens its first two retail stores in Tysons Corner, VA and Glendale, CA on May 19th.", titleDe: "Erste Apple Retail Stores eröffnen", descriptionDe: "Apple eröffnet seine ersten beiden Einzelhandelsgeschäfte in Tysons Corner, VA und Glendale, CA am 19. Mai.", titleFr: "Ouverture des premiers Apple Retail Stores", descriptionFr: "Apple ouvre ses deux premiers magasins de vente au détail à Tysons Corner (Virginie) et Glendale (Californie) le 19 mai.", type: "apple", sortOrder: 2 },
        { year: 2002, title: "iMac G4 (Lamp) introduced", description: "The iMac G4's floating flat-panel display on a chrome arm becomes one of computing's most iconic design landmarks.", titleDe: "iMac G4 (Lampe) vorgestellt", descriptionDe: "Das schwebende Flachbildschirm-Display des iMac G4 auf einem verchromten Arm wird zu einem der ikonischsten Designmeilensteine der Computergeschichte.", titleFr: "Présentation de l'iMac G4 (Lampe)", descriptionFr: "L'écran plat flottant de l'iMac G4 sur un bras chromé devient l'un des jalons design les plus emblématiques de l'histoire informatique.", type: "apple", sortOrder: 0 },
        { year: 2003, title: "iTunes Store opens", description: "Apple launches the iTunes Music Store with 200,000 songs at 99 cents each, upending the music industry.", titleDe: "iTunes Store eröffnet", descriptionDe: "Apple startet den iTunes Music Store mit 200.000 Songs zu je 99 Cent und krempelt damit die Musikindustrie um.", titleFr: "Ouverture de l'iTunes Store", descriptionFr: "Apple lance l'iTunes Music Store avec 200 000 chansons à 99 cents chacune, bouleversant l'industrie musicale.", type: "apple", sortOrder: 0 },
        { year: 2003, title: "Power Mac G5 introduced", description: "The aluminum Power Mac G5 debuts with IBM's 64-bit G5 chip — Apple's most powerful desktop to date and the last PowerPC tower.", titleDe: "Power Mac G5 vorgestellt", descriptionDe: "Der Aluminium-Power-Mac-G5 debütiert mit IBMs 64-Bit-G5-Chip – Apples leistungsstärkster Desktop bis dahin und der letzte PowerPC-Tower.", titleFr: "Présentation du Power Mac G5", descriptionFr: "Le Power Mac G5 en aluminium débute avec la puce 64 bits G5 d'IBM – le bureau Apple le plus puissant de l'époque et la dernière tour PowerPC.", type: "apple", sortOrder: 1 },
        { year: 2004, title: "iMac G5 introduced", description: "The iMac G5 moves all components behind the display, foreshadowing the modern all-in-one form factor.", titleDe: "iMac G5 vorgestellt", descriptionDe: "Der iMac G5 verlagert alle Komponenten hinter das Display und nimmt damit die moderne All-in-One-Formgebung vorweg.", titleFr: "Présentation de l'iMac G5", descriptionFr: "L'iMac G5 déplace tous les composants derrière l'écran, préfigurant le format tout-en-un moderne.", type: "apple", sortOrder: 0 },
        { year: 2005, title: "Mac mini and iPod nano debut", description: "Apple launches the Mac mini (cheapest Mac ever) and the ultra-thin iPod nano — a thousand songs in your pocket made even smaller.", titleDe: "Mac mini und iPod nano Debüt", descriptionDe: "Apple bringt den Mac mini (günstigster Mac aller Zeiten) und den ultradünnen iPod nano heraus – tausend Songs in der Tasche, noch kleiner.", titleFr: "Débuts du Mac mini et de l'iPod nano", descriptionFr: "Apple lance le Mac mini (le Mac le moins cher jamais conçu) et l'ultra-fin iPod nano – mille chansons dans votre poche, encore plus petit.", type: "apple", sortOrder: 0 },
        { year: 2006, title: "Intel Mac transition complete", description: "Apple ships MacBook Pro and iMac with Intel Core Duo chips, completing the PowerPC-to-Intel transition in just 7 months.", titleDe: "Intel-Mac-Übergang abgeschlossen", descriptionDe: "Apple liefert MacBook Pro und iMac mit Intel-Core-Duo-Prozessoren und schließt damit den PowerPC-zu-Intel-Übergang in nur 7 Monaten ab.", titleFr: "Transition Intel Mac achevée", descriptionFr: "Apple livre le MacBook Pro et l'iMac avec des puces Intel Core Duo, achevant la transition de PowerPC vers Intel en seulement 7 mois.", type: "apple", sortOrder: 0 },
        { year: 2007, title: "iPhone introduced", description: "Steve Jobs unveils the original iPhone on January 9th — an iPod, a phone, and an internet communicator — redefining the mobile industry.", titleDe: "iPhone vorgestellt", descriptionDe: "Steve Jobs stellt das originale iPhone am 9. Januar vor – ein iPod, ein Telefon und ein Internet-Kommunikationsgerät – und definiert die Mobilbranche neu.", titleFr: "Présentation de l'iPhone", descriptionFr: "Steve Jobs présente l'iPhone original le 9 janvier – un iPod, un téléphone et un communicateur Internet – redéfinissant l'industrie mobile.", type: "apple", sortOrder: 0 },
        { year: 2008, title: "MacBook Air and App Store", description: "The original MacBook Air slides out of a manila envelope at Macworld; six months later the App Store launches with 500 apps.", titleDe: "MacBook Air und App Store", descriptionDe: "Das originale MacBook Air gleitet auf der Macworld aus einem Briefumschlag; sechs Monate später startet der App Store mit 500 Apps.", titleFr: "MacBook Air et App Store", descriptionFr: "Le MacBook Air original glisse hors d'une enveloppe à la Macworld ; six mois plus tard, l'App Store lance avec 500 applications.", type: "apple", sortOrder: 0 },
        { year: 2010, title: "iPad introduced", description: "The original iPad ships, creating the modern tablet market and becoming Apple's fastest-growing product line ever.", titleDe: "iPad vorgestellt", descriptionDe: "Das originale iPad erscheint und schafft den modernen Tablet-Markt, der zur am schnellsten wachsenden Produktlinie Apples aller Zeiten wird.", titleFr: "Présentation de l'iPad", descriptionFr: "L'iPad original est lancé, créant le marché moderne des tablettes et devenant la gamme de produits Apple à la croissance la plus rapide.", type: "apple", sortOrder: 0 },
        { year: 2011, title: "iCloud, Siri, and Steve Jobs", description: "iOS 5 brings iCloud; the iPhone 4S introduces Siri. Steve Jobs passes away October 5th at age 56, the day after the iPhone 4S announcement.", titleDe: "iCloud, Siri und Steve Jobs", descriptionDe: "iOS 5 bringt iCloud; das iPhone 4S führt Siri ein. Steve Jobs stirbt am 5. Oktober im Alter von 56 Jahren – am Tag nach der iPhone-4S-Ankündigung.", titleFr: "iCloud, Siri et Steve Jobs", descriptionFr: "iOS 5 apporte iCloud ; l'iPhone 4S introduit Siri. Steve Jobs s'éteint le 5 octobre à l'âge de 56 ans, le lendemain de l'annonce de l'iPhone 4S.", type: "apple", sortOrder: 0 },
        { year: 2012, title: "Retina MacBook Pro and iPhone 5", description: "Apple introduces the first Retina Display MacBook Pro and the taller, lighter iPhone 5 with Lightning connector.", titleDe: "Retina MacBook Pro und iPhone 5", descriptionDe: "Apple stellt das erste MacBook Pro mit Retina-Display vor sowie das schlankere iPhone 5 mit Lightning-Anschluss.", titleFr: "MacBook Pro Retina et iPhone 5", descriptionFr: "Apple présente le premier MacBook Pro avec écran Retina et l'iPhone 5, plus fin et plus léger, avec connecteur Lightning.", type: "apple", sortOrder: 0 },
        { year: 2013, title: "Mac Pro (Trash Can)", description: "The radical cylindrical Mac Pro with dual GPUs launches — powerful and beautiful, but criticized for its dead-end thermal design.", titleDe: "Mac Pro (Mülleimer)", descriptionDe: "Der radikale zylindrische Mac Pro mit Dual-GPU wird vorgestellt – leistungsstark und schön, aber wegen seines thermischen Dead-End-Designs kritisiert.", titleFr: "Mac Pro (Poubelle)", descriptionFr: "Le radical Mac Pro cylindrique avec double GPU est lancé – puissant et élégant, mais critiqué pour sa conception thermique sans issue.", type: "apple", sortOrder: 0 },
        { year: 2014, title: "Swift programming language", description: "Apple open-sources Swift, its new modern programming language designed to replace Objective-C for iOS and Mac development.", titleDe: "Swift-Programmiersprache", descriptionDe: "Apple open-sourct Swift, seine neue moderne Programmiersprache, die Objective-C für iOS- und Mac-Entwicklung ablösen soll.", titleFr: "Langage de programmation Swift", descriptionFr: "Apple open-source Swift, son nouveau langage de programmation moderne conçu pour remplacer Objective-C dans le développement iOS et Mac.", type: "apple", sortOrder: 0 },
        { year: 2015, title: "Apple Watch and 12-inch MacBook", description: "Apple Watch enters the wearables market; the new MacBook introduces a USB-C-only design and the controversial butterfly keyboard.", titleDe: "Apple Watch und 12-Zoll-MacBook", descriptionDe: "Die Apple Watch betritt den Wearables-Markt; das neue MacBook führt ein Nur-USB-C-Design und die kontroverse Butterfly-Tastatur ein.", titleFr: "Apple Watch et MacBook 12 pouces", descriptionFr: "L'Apple Watch entre sur le marché des wearables ; le nouveau MacBook introduit un design tout USB-C et le controversé clavier papillon.", type: "apple", sortOrder: 0 },
        { year: 2017, title: "iMac Pro and iPhone X", description: "The iMac Pro brings workstation-class performance to an all-in-one; iPhone X ditches Touch ID for Face ID and an OLED edge-to-edge display.", titleDe: "iMac Pro und iPhone X", descriptionDe: "Der iMac Pro bringt Workstation-Leistung in einem All-in-One; das iPhone X verzichtet auf Touch ID zugunsten von Face ID und einem OLED-randlosen Display.", titleFr: "iMac Pro et iPhone X", descriptionFr: "L'iMac Pro apporte des performances de station de travail dans un tout-en-un ; l'iPhone X abandonne Touch ID pour Face ID et un écran OLED bord à bord.", type: "apple", sortOrder: 0 },
        { year: 2019, title: "Mac Pro (cheese grater) returns", description: "The tower Mac Pro returns with its iconic cheese-grater design and full modular expandability, reaching up to 1.5 TB RAM.", titleDe: "Mac Pro (Käsereibe) kehrt zurück", descriptionDe: "Der Tower Mac Pro kehrt mit seinem ikonischen Käsereiben-Design und vollständiger modularer Erweiterbarkeit zurück, mit bis zu 1,5 TB RAM.", titleFr: "Retour du Mac Pro (grille de fromage)", descriptionFr: "Le Mac Pro tour revient avec son design iconique en grille de fromage et une expansibilité modulaire complète, jusqu'à 1,5 To de RAM.", type: "apple", sortOrder: 0 },
        { year: 2020, title: "Apple Silicon M1", description: "Apple introduces the M1 chip, completing the Intel-to-Apple Silicon transition in record time. The M1 MacBook Air runs cool and silent with no fan.", titleDe: "Apple Silicon M1", descriptionDe: "Apple stellt den M1-Chip vor und schließt den Intel-zu-Apple-Silicon-Übergang in Rekordzeit ab. Das M1 MacBook Air läuft kühl und geräuschlos ohne Lüfter.", titleFr: "Apple Silicon M1", descriptionFr: "Apple présente la puce M1, achevant la transition d'Intel vers Apple Silicon en un temps record. Le MacBook Air M1 fonctionne sans bruit ni ventilateur.", type: "apple", sortOrder: 0 },
        { year: 2021, title: "M1 Pro, Max, and redesigned MacBook Pros", description: "Apple's M1 Pro and Max chips power redesigned MacBook Pros that bring back MagSafe, HDMI, and SD card slots — and retire the Touch Bar.", titleDe: "M1 Pro, Max und neu gestaltete MacBook Pros", descriptionDe: "Apples M1-Pro- und Max-Chips betreiben neu gestaltete MacBook Pros, die MagSafe, HDMI und SD-Kartenslots zurückbringen – und die Touch Bar verabschieden.", titleFr: "M1 Pro, Max et MacBook Pro redessinés", descriptionFr: "Les puces M1 Pro et Max d'Apple propulsent des MacBook Pro redessinés qui ramènent MagSafe, HDMI et les slots SD – et retirent la Touch Bar.", type: "apple", sortOrder: 0 },
        { year: 2022, title: "Mac Studio and M1 Ultra", description: "The Mac Studio fills the gap between Mac mini and Mac Pro; M1 Ultra fuses two M1 Max dies into the most powerful consumer chip Apple has shipped.", titleDe: "Mac Studio und M1 Ultra", descriptionDe: "Das Mac Studio füllt die Lücke zwischen Mac mini und Mac Pro; M1 Ultra verbindet zwei M1-Max-Dies zur leistungsstärksten Consumer-Chip, den Apple je ausgeliefert hat.", titleFr: "Mac Studio et M1 Ultra", descriptionFr: "Le Mac Studio comble l'écart entre le Mac mini et le Mac Pro ; le M1 Ultra fusionne deux puces M1 Max pour former la puce grand public la plus puissante jamais livrée par Apple.", type: "apple", sortOrder: 0 },
        { year: 2023, title: "Apple Vision Pro announced", description: "Apple announces Vision Pro — its first new product category since Apple Watch — a spatial computing headset starting at $3,499.", titleDe: "Apple Vision Pro angekündigt", descriptionDe: "Apple kündigt Vision Pro an – seine erste neue Produktkategorie seit der Apple Watch – ein Spatial-Computing-Headset ab 3.499 Dollar.", titleFr: "Annonce de l'Apple Vision Pro", descriptionFr: "Apple annonce le Vision Pro – sa première nouvelle catégorie de produit depuis l'Apple Watch – un casque de calcul spatial à partir de 3 499 $.", type: "apple", sortOrder: 0 },
        { year: 2024, title: "Apple Intelligence and M4 Macs", description: "Apple ships on-device AI features as Apple Intelligence and transitions its Mac lineup to M4 chips.", titleDe: "Apple Intelligence und M4-Macs", descriptionDe: "Apple liefert On-Device-KI-Funktionen als Apple Intelligence und stellt seine Mac-Produktlinie auf M4-Chips um.", titleFr: "Apple Intelligence et Macs M4", descriptionFr: "Apple propose des fonctionnalités d'IA embarquées avec Apple Intelligence et fait migrer sa gamme Mac vers les puces M4.", type: "apple", sortOrder: 0 },
    ];

    const existingEvents = await (prisma as any).timelineEvent.findMany({ select: { title: true } });
    const existingTitles = new Set(existingEvents.map((e: any) => e.title));
    const newEvents = timelineEventData.filter(e => !existingTitles.has(e.title));
    if (newEvents.length > 0) {
        await (prisma as any).timelineEvent.createMany({ data: newEvents });
        console.log(`Seeded ${newEvents.length} timeline events.`);
    }

    // Update translations on existing events
    for (const event of timelineEventData) {
        await (prisma as any).timelineEvent.updateMany({
            where: { title: event.title, year: event.year },
            data: { titleDe: event.titleDe, descriptionDe: event.descriptionDe, titleFr: event.titleFr, descriptionFr: event.descriptionFr },
        });
    }
    console.log('Timeline event translations updated.');

    // Seed default showcase quotes
    const defaultQuotes = [
        // Steve Jobs
        { id: 'quote-jobs-1', author: 'Steve Jobs', text: 'Design is not just what it looks like and feels like. Design is how it works.', source: 'The New York Times, 2003', isDefault: true, sortOrder: 0 },
        { id: 'quote-jobs-2', author: 'Steve Jobs', text: 'The people who are crazy enough to think they can change the world are the ones who do.', source: 'Think Different campaign, 1997', isDefault: true, sortOrder: 1 },
        { id: 'quote-jobs-3', author: 'Steve Jobs', text: 'Creativity is just connecting things.', source: 'Wired, 1996', isDefault: true, sortOrder: 2 },
        { id: 'quote-jobs-4', author: 'Steve Jobs', text: 'Stay hungry. Stay foolish.', source: 'Stanford commencement address, 2005', isDefault: true, sortOrder: 3 },
        { id: 'quote-jobs-5', author: 'Steve Jobs', text: 'Simple can be harder than complex. You have to work hard to get your thinking clean to make it simple.', source: 'BusinessWeek, 1998', isDefault: true, sortOrder: 4 },
        { id: 'quote-jobs-6', author: 'Steve Jobs', text: 'Innovation distinguishes between a leader and a follower.', source: null, isDefault: true, sortOrder: 5 },
        // Jony Ive
        { id: 'quote-ive-1', author: 'Jony Ive', text: 'We try to develop products that seem somehow inevitable.', source: 'Objectified documentary, 2009', isDefault: true, sortOrder: 6 },
        { id: 'quote-ive-2', author: 'Jony Ive', text: 'True simplicity is derived from so much more than just the absence of clutter and ornamentation.', source: null, isDefault: true, sortOrder: 7 },
        { id: 'quote-ive-3', author: 'Jony Ive', text: 'The best ideas start as conversations.', source: null, isDefault: true, sortOrder: 8 },
        // Dieter Rams
        { id: 'quote-rams-1', author: 'Dieter Rams', text: 'Good design is as little design as possible.', source: 'Ten Principles for Good Design', isDefault: true, sortOrder: 9 },
        { id: 'quote-rams-2', author: 'Dieter Rams', text: 'Good design is innovative.', source: 'Ten Principles for Good Design', isDefault: true, sortOrder: 10 },
        { id: 'quote-rams-3', author: 'Dieter Rams', text: 'Good design makes a product useful.', source: 'Ten Principles for Good Design', isDefault: true, sortOrder: 11 },
        { id: 'quote-rams-4', author: 'Dieter Rams', text: 'Indifference towards people and the reality in which they live is actually the one and only cardinal sin in design.', source: null, isDefault: true, sortOrder: 12 },
        // Steve Wozniak
        { id: 'quote-woz-1', author: 'Steve Wozniak', text: "Never trust a computer you can't throw out a window.", source: 'iWoz, 2006', isDefault: true, sortOrder: 13 },
        { id: 'quote-woz-2', author: 'Steve Wozniak', text: "My goal wasn't to make a ton of money. It was to build good computers.", source: null, isDefault: true, sortOrder: 14 },
        { id: 'quote-woz-3', author: 'Steve Wozniak', text: 'All the best things that I did at Apple came from not having money and not having done it before, ever.', source: null, isDefault: true, sortOrder: 15 },
        // Susan Kare
        { id: 'quote-kare-1', author: 'Susan Kare', text: 'Icons are the vocabulary of the visual language of the interface.', source: null, isDefault: true, sortOrder: 16 },
        { id: 'quote-kare-2', author: 'Susan Kare', text: 'You want people to feel like they know how to use it just by looking at it.', source: null, isDefault: true, sortOrder: 17 },
        // Jef Raskin
        { id: 'quote-raskin-1', author: 'Jef Raskin', text: 'An interface is humane if it is responsive to human needs and considerate of human frailty.', source: 'The Humane Interface, 2000', isDefault: true, sortOrder: 18 },
        { id: 'quote-raskin-2', author: 'Jef Raskin', text: 'The system should treat all user input as sacred.', source: 'The Humane Interface, 2000', isDefault: true, sortOrder: 19 },
        // Bruce Tognazzini
        { id: 'quote-tog-1', author: 'Bruce Tognazzini', text: 'Consistency enables users to build accurate mental models of the way things work.', source: 'AskTog', isDefault: true, sortOrder: 20 },
        // Think Different
        { id: 'quote-thinkdiff-1', author: 'Think Different campaign', text: "Here's to the crazy ones. The misfits. The rebels. The troublemakers. The round pegs in the square holes.", source: 'Apple Inc., 1997', isDefault: true, sortOrder: 21 },
    ];

    for (const quote of defaultQuotes) {
        await (prisma as any).showcaseQuote.upsert({
            where: { id: quote.id },
            update: {},
            create: quote,
        });
    }
    console.log('Seeded default showcase quotes.');

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
