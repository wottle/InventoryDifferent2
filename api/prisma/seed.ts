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

    // Seed timeline events
    const timelineEventData = [
        { year: 1975, title: "Altair 8800 ships", description: "MITS ships the Altair 8800 kit computer, sparking the home computer revolution and inspiring Bill Gates and Paul Allen to write BASIC for it.", type: "tech", sortOrder: 0 },
        { year: 1976, title: "Apple Computer founded", description: "Steve Jobs, Steve Wozniak, and Ronald Wayne found Apple Computer on April 1st. The Apple I is sold as a bare circuit board.", type: "apple", sortOrder: 0 },
        { year: 1977, title: "Apple II introduced", description: "The Apple II launches at the West Coast Computer Faire — one of the first mass-market personal computers with color graphics and an open architecture.", type: "apple", sortOrder: 0 },
        { year: 1977, title: "The 1977 Trinity", description: "Apple II, Commodore PET, and TRS-80 all debut — defining the personal computer market.", type: "tech", sortOrder: 1 },
        { year: 1979, title: "VisiCalc released", description: "The first killer app: VisiCalc, the spreadsheet that makes the Apple II indispensable to businesses.", type: "tech", sortOrder: 0 },
        { year: 1980, title: "Apple goes public", description: "Apple's IPO raises $101 million — the largest since Ford in 1956 — and creates more millionaires overnight than any company in history.", type: "apple", sortOrder: 0 },
        { year: 1981, title: "IBM PC introduced", description: "IBM launches the IBM Personal Computer 5150 running PC-DOS. Its open architecture spawns a clone industry that reshapes computing.", type: "tech", sortOrder: 0 },
        { year: 1983, title: "Apple Lisa introduced", description: "Apple's Lisa debuts as the first commercial personal computer with a graphical interface and mouse — priced at $9,995.", type: "apple", sortOrder: 0 },
        { year: 1984, title: "Macintosh 128K introduced", description: "The original Macintosh launches January 24th after the iconic '1984' Super Bowl ad. It ships with MacPaint and MacWrite and changes personal computing forever.", type: "apple", sortOrder: 0 },
        { year: 1984, title: "Mac 512K (Fat Mac)", description: "Apple releases the Macintosh 512K, quadrupling RAM over the original and earning the nickname 'Fat Mac'.", type: "apple", sortOrder: 1 },
        { year: 1985, title: "Steve Jobs leaves Apple", description: "Jobs resigns from Apple following a boardroom power struggle and founds NeXT Computer.", type: "apple", sortOrder: 0 },
        { year: 1985, title: "Windows 1.0 ships", description: "Microsoft ships Windows 1.0, a graphical shell for MS-DOS — roundly criticized but the beginning of a 40-year platform.", type: "tech", sortOrder: 1 },
        { year: 1986, title: "Mac Plus introduced", description: "The Mac Plus brings 1 MB RAM, SCSI, and an upgraded keyboard — becoming the longest-selling Mac model at nearly 5 years.", type: "apple", sortOrder: 0 },
        { year: 1987, title: "Mac II and SE introduced", description: "Apple introduces the modular Mac II with color support and NuBus expansion slots, alongside the compact Mac SE.", type: "apple", sortOrder: 0 },
        { year: 1987, title: "HyperCard released", description: "Apple ships HyperCard, a groundbreaking hypermedia tool that foreshadows the World Wide Web.", type: "apple", sortOrder: 1 },
        { year: 1988, title: "NeXT Computer unveiled", description: "Steve Jobs unveils the NeXT Computer — an elegant workstation with an optical drive and object-oriented OS that later becomes the foundation of macOS.", type: "tech", sortOrder: 0 },
        { year: 1989, title: "Mac IIci and Mac Portable", description: "Apple releases the Mac IIci (its most popular desktop of the era) and the Mac Portable — the first battery-powered Macintosh.", type: "apple", sortOrder: 0 },
        { year: 1990, title: "Mac LC and Classic introduced", description: "Apple targets education with the affordable Mac LC and brings back a compact classic design with the Macintosh Classic.", type: "apple", sortOrder: 0 },
        { year: 1991, title: "PowerBook 100/140/170 debut", description: "Apple's landmark PowerBook line defines the modern laptop form factor with a trackball, wrist rest, and centered keyboard.", type: "apple", sortOrder: 0 },
        { year: 1991, title: "System 7 released", description: "System 7 brings color, virtual memory, networking, and aliases to the Mac OS — a major leap for the platform.", type: "apple", sortOrder: 1 },
        { year: 1991, title: "World Wide Web goes public", description: "Tim Berners-Lee opens the World Wide Web to the public from CERN — built on a NeXT workstation.", type: "tech", sortOrder: 2 },
        { year: 1993, title: "Apple Newton MessagePad", description: "Apple introduces the Newton MessagePad, an early PDA with handwriting recognition — ambitious, controversial, and ahead of its time.", type: "apple", sortOrder: 0 },
        { year: 1993, title: "Mosaic browser released", description: "NCSA Mosaic makes the web graphical and accessible, triggering the internet boom of the 1990s.", type: "tech", sortOrder: 1 },
        { year: 1994, title: "Power Macintosh introduced", description: "Apple ships the first Power Macs using the IBM/Motorola PowerPC chip — the first of three major Mac architecture transitions.", type: "apple", sortOrder: 0 },
        { year: 1995, title: "Windows 95 launches", description: "Windows 95 ships to massive fanfare, introducing the Start menu, 32-bit multitasking, and plug-and-play hardware.", type: "tech", sortOrder: 0 },
        { year: 1996, title: "Apple acquires NeXT", description: "Apple buys NeXT for $429 million, bringing Steve Jobs back to Cupertino and the foundation of what becomes Mac OS X.", type: "apple", sortOrder: 0 },
        { year: 1997, title: "Jobs returns as CEO", description: "Steve Jobs becomes Apple's interim CEO. He axes Newton, consolidates the product line to four quadrants, and launches the Think Different campaign.", type: "apple", sortOrder: 0 },
        { year: 1998, title: "iMac G3 introduced", description: "The translucent Bondi Blue iMac G3 launches at Macworld, restoring Apple's design credibility and returning the company to profitability.", type: "apple", sortOrder: 0 },
        { year: 1999, title: "iBook G3 (Clamshell) and AirPort", description: "The colorful clamshell iBook brings Apple's design language to laptops; AirPort makes consumer Wi-Fi mainstream two years before the competition.", type: "apple", sortOrder: 0 },
        { year: 2000, title: "Power Mac G4 Cube", description: "The G4 Cube wows with its silent, handle-free, 8-inch cube design — a design triumph but a commercial disappointment.", type: "apple", sortOrder: 0 },
        { year: 2001, title: "Mac OS X 10.0 ships", description: "Mac OS X debuts with its Aqua interface and Unix core — a clean break from the Classic Mac OS and the foundation for the next 25+ years.", type: "apple", sortOrder: 0 },
        { year: 2001, title: "iPod introduced", description: "The original iPod with scroll wheel launches October 23rd, beginning Apple's transformation into a consumer electronics company.", type: "apple", sortOrder: 1 },
        { year: 2001, title: "First Apple Retail Stores open", description: "Apple opens its first two retail stores in Tysons Corner, VA and Glendale, CA on May 19th.", type: "apple", sortOrder: 2 },
        { year: 2002, title: "iMac G4 (Lamp) introduced", description: "The iMac G4's floating flat-panel display on a chrome arm becomes one of computing's most iconic design landmarks.", type: "apple", sortOrder: 0 },
        { year: 2003, title: "iTunes Store opens", description: "Apple launches the iTunes Music Store with 200,000 songs at 99 cents each, upending the music industry.", type: "apple", sortOrder: 0 },
        { year: 2003, title: "Power Mac G5 introduced", description: "The aluminum Power Mac G5 debuts with IBM's 64-bit G5 chip — Apple's most powerful desktop to date and the last PowerPC tower.", type: "apple", sortOrder: 1 },
        { year: 2004, title: "iMac G5 introduced", description: "The iMac G5 moves all components behind the display, foreshadowing the modern all-in-one form factor.", type: "apple", sortOrder: 0 },
        { year: 2005, title: "Mac mini and iPod nano debut", description: "Apple launches the Mac mini (cheapest Mac ever) and the ultra-thin iPod nano — a thousand songs in your pocket made even smaller.", type: "apple", sortOrder: 0 },
        { year: 2006, title: "Intel Mac transition complete", description: "Apple ships MacBook Pro and iMac with Intel Core Duo chips, completing the PowerPC-to-Intel transition in just 7 months.", type: "apple", sortOrder: 0 },
        { year: 2007, title: "iPhone introduced", description: "Steve Jobs unveils the original iPhone on January 9th — an iPod, a phone, and an internet communicator — redefining the mobile industry.", type: "apple", sortOrder: 0 },
        { year: 2008, title: "MacBook Air and App Store", description: "The original MacBook Air slides out of a manila envelope at Macworld; six months later the App Store launches with 500 apps.", type: "apple", sortOrder: 0 },
        { year: 2010, title: "iPad introduced", description: "The original iPad ships, creating the modern tablet market and becoming Apple's fastest-growing product line ever.", type: "apple", sortOrder: 0 },
        { year: 2011, title: "iCloud, Siri, and Steve Jobs", description: "iOS 5 brings iCloud; the iPhone 4S introduces Siri. Steve Jobs passes away October 5th at age 56, the day after the iPhone 4S announcement.", type: "apple", sortOrder: 0 },
        { year: 2012, title: "Retina MacBook Pro and iPhone 5", description: "Apple introduces the first Retina Display MacBook Pro and the taller, lighter iPhone 5 with Lightning connector.", type: "apple", sortOrder: 0 },
        { year: 2013, title: "Mac Pro (Trash Can)", description: "The radical cylindrical Mac Pro with dual GPUs launches — powerful and beautiful, but criticized for its dead-end thermal design.", type: "apple", sortOrder: 0 },
        { year: 2014, title: "Swift programming language", description: "Apple open-sources Swift, its new modern programming language designed to replace Objective-C for iOS and Mac development.", type: "apple", sortOrder: 0 },
        { year: 2015, title: "Apple Watch and 12-inch MacBook", description: "Apple Watch enters the wearables market; the new MacBook introduces a USB-C-only design and the controversial butterfly keyboard.", type: "apple", sortOrder: 0 },
        { year: 2017, title: "iMac Pro and iPhone X", description: "The iMac Pro brings workstation-class performance to an all-in-one; iPhone X ditches Touch ID for Face ID and an OLED edge-to-edge display.", type: "apple", sortOrder: 0 },
        { year: 2019, title: "Mac Pro (cheese grater) returns", description: "The tower Mac Pro returns with its iconic cheese-grater design and full modular expandability, reaching up to 1.5 TB RAM.", type: "apple", sortOrder: 0 },
        { year: 2020, title: "Apple Silicon M1", description: "Apple introduces the M1 chip, completing the Intel-to-Apple Silicon transition in record time. The M1 MacBook Air runs cool and silent with no fan.", type: "apple", sortOrder: 0 },
        { year: 2021, title: "M1 Pro, Max, and redesigned MacBook Pros", description: "Apple's M1 Pro and Max chips power redesigned MacBook Pros that bring back MagSafe, HDMI, and SD card slots — and retire the Touch Bar.", type: "apple", sortOrder: 0 },
        { year: 2022, title: "Mac Studio and M1 Ultra", description: "The Mac Studio fills the gap between Mac mini and Mac Pro; M1 Ultra fuses two M1 Max dies into the most powerful consumer chip Apple has shipped.", type: "apple", sortOrder: 0 },
        { year: 2023, title: "Apple Vision Pro announced", description: "Apple announces Vision Pro — its first new product category since Apple Watch — a spatial computing headset starting at $3,499.", type: "apple", sortOrder: 0 },
        { year: 2024, title: "Apple Intelligence and M4 Macs", description: "Apple ships on-device AI features as Apple Intelligence and transitions its Mac lineup to M4 chips.", type: "apple", sortOrder: 0 },
    ];

    const existingEvents = await (prisma as any).timelineEvent.findMany({ select: { title: true } });
    const existingTitles = new Set(existingEvents.map((e: any) => e.title));
    const newEvents = timelineEventData.filter(e => !existingTitles.has(e.title));
    if (newEvents.length > 0) {
        await (prisma as any).timelineEvent.createMany({ data: newEvents });
        console.log(`Seeded ${newEvents.length} timeline events.`);
    }

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
