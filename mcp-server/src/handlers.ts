import { PrismaClient } from "@prisma/client";

// Helper function to convert Prisma Decimal to number
export function decimalToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === "object" && typeof value.toNumber === "function") {
    const n = value.toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function handleSearchDevices(prisma: PrismaClient, args: any) {
  const whereClause: any = { deleted: false };

  if (args?.status) whereClause.status = args.status;
  if (args?.functionalStatus) whereClause.functionalStatus = args.functionalStatus;
  if (args?.categoryId) whereClause.categoryId = args.categoryId;
  if (args?.categoryType) whereClause.category = { type: args.categoryType };
  if (args?.manufacturer) {
    whereClause.manufacturer = { contains: args.manufacturer, mode: "insensitive" };
  }
  if (args?.tagName) {
    whereClause.tags = { some: { name: { contains: args.tagName, mode: "insensitive" } } };
  }

  const limit = Math.min(Number(args?.limit) || 50, 100);

  let devices = await prisma.device.findMany({
    where: whereClause,
    include: { category: true, tags: true, notes: true, maintenanceTasks: true },
    take: limit,
    orderBy: { name: "asc" },
  });

  if (args?.query) {
    const query = (args.query as string).toLowerCase();
    devices = devices.filter((device) => {
      const searchableText = [
        device.name, device.additionalName, device.manufacturer, device.modelNumber,
        device.serialNumber, device.cpu, device.ram, device.graphics, device.storage,
        device.operatingSystem, device.info, device.location,
        ...device.tags.map((t) => t.name),
        ...device.notes.map((n) => n.content),
      ].filter(Boolean).join(" ").toLowerCase();
      return searchableText.includes(query);
    });
  }

  const results = devices.map((d) => ({
    id: d.id,
    name: d.name,
    additionalName: d.additionalName,
    manufacturer: d.manufacturer,
    modelNumber: d.modelNumber,
    releaseYear: d.releaseYear,
    status: d.status,
    functionalStatus: d.functionalStatus,
    category: d.category.name,
    categoryType: d.category.type,
    cpu: d.cpu,
    ram: d.ram,
    storage: d.storage,
    operatingSystem: d.operatingSystem,
    location: d.location,
    estimatedValue: decimalToNumber(d.estimatedValue),
    listPrice: decimalToNumber(d.listPrice),
    tags: d.tags.map((t) => t.name),
  }));

  return { count: results.length, devices: results };
}

export async function handleGetDeviceDetails(prisma: PrismaClient, args: any) {
  if (!args?.deviceId) throw new Error("deviceId is required");

  const device = await prisma.device.findUnique({
    where: { id: args.deviceId as number },
    include: {
      category: true,
      images: true,
      notes: { orderBy: { date: "desc" } },
      maintenanceTasks: { orderBy: { dateCompleted: "desc" } },
      tags: true,
    },
  });

  if (!device) return null;

  return {
    id: device.id,
    name: device.name,
    additionalName: device.additionalName,
    manufacturer: device.manufacturer,
    modelNumber: device.modelNumber,
    serialNumber: device.serialNumber,
    releaseYear: device.releaseYear,
    location: device.location,
    info: device.info,
    isFavorite: device.isFavorite,
    status: device.status,
    functionalStatus: device.functionalStatus,
    lastPowerOnDate: device.lastPowerOnDate,
    hasOriginalBox: device.hasOriginalBox,
    isAssetTagged: device.isAssetTagged,
    category: { id: device.category.id, name: device.category.name, type: device.category.type },
    specs: {
      cpu: device.cpu, ram: device.ram, graphics: device.graphics,
      storage: device.storage, operatingSystem: device.operatingSystem,
      isWifiEnabled: device.isWifiEnabled, isPramBatteryRemoved: device.isPramBatteryRemoved,
    },
    acquisition: {
      dateAcquired: device.dateAcquired, whereAcquired: device.whereAcquired,
      priceAcquired: decimalToNumber(device.priceAcquired),
    },
    valuation: {
      estimatedValue: decimalToNumber(device.estimatedValue),
      listPrice: decimalToNumber(device.listPrice),
      soldPrice: decimalToNumber(device.soldPrice),
      soldDate: device.soldDate,
    },
    externalUrl: device.externalUrl,
    tags: device.tags.map((t) => t.name),
    notes: device.notes.map((n) => ({ date: n.date, content: n.content })),
    maintenanceTasks: device.maintenanceTasks.map((t) => ({
      label: t.label, dateCompleted: t.dateCompleted, notes: t.notes,
    })),
    imageCount: device.images.length,
  };
}

export async function handleGetFinancialSummary(prisma: PrismaClient) {
  const baseWhere = { deleted: false };

  const spentAgg = await prisma.device.aggregate({ where: baseWhere, _sum: { priceAcquired: true } });
  const receivedAgg = await prisma.device.aggregate({ where: { ...baseWhere, status: "SOLD" }, _sum: { soldPrice: true } });
  const ownedValueAgg = await prisma.device.aggregate({
    where: { ...baseWhere, status: { notIn: ["SOLD", "DONATED"] } },
    _sum: { estimatedValue: true },
  });

  const statusCounts = await prisma.device.groupBy({ by: ["status"], where: baseWhere, _count: true });

  const soldDevices = await prisma.device.findMany({
    where: { ...baseWhere, status: "SOLD", soldPrice: { not: null } },
    select: { soldPrice: true, priceAcquired: true },
  });

  const totalProfit = soldDevices.reduce((sum, d) => {
    return sum + (decimalToNumber(d.soldPrice) - decimalToNumber(d.priceAcquired));
  }, 0);

  const totalSpent = decimalToNumber(spentAgg._sum.priceAcquired);
  const totalReceived = decimalToNumber(receivedAgg._sum.soldPrice);
  const netCash = totalReceived - totalSpent;
  const estimatedValueOwned = decimalToNumber(ownedValueAgg._sum.estimatedValue);

  return {
    totalSpent,
    totalReceived,
    netCash,
    estimatedValueOwned,
    netPosition: estimatedValueOwned + netCash,
    totalProfit,
    deviceCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
  };
}

export async function handleListDevices(prisma: PrismaClient, args: any) {
  const whereClause: any = { deleted: false };

  if (args?.status) whereClause.status = args.status;
  if (args?.functionalStatus) whereClause.functionalStatus = args.functionalStatus;
  if (args?.categoryType) whereClause.category = { type: args.categoryType };

  const limit = Math.min(Number(args?.limit) || 100, 200);
  const requestedFields = args?.fields as string[] | undefined;
  const includeAllFields = !requestedFields || requestedFields.length === 0;
  const shouldIncludeNotes = includeAllFields || requestedFields?.includes("notes");
  const shouldIncludeTasks = includeAllFields || requestedFields?.includes("maintenanceTasks");

  const devices = await prisma.device.findMany({
    where: whereClause,
    include: {
      category: true,
      tags: true,
      notes: shouldIncludeNotes ? { orderBy: { date: "desc" as const } } : false,
      maintenanceTasks: shouldIncludeTasks ? { orderBy: { dateCompleted: "desc" as const } } : false,
    },
    take: limit,
    orderBy: { id: "asc" },
  });

  const results = devices.map((d) => {
    const device: any = {};
    const shouldInclude = (field: string) => includeAllFields || requestedFields!.includes(field);

    if (shouldInclude("id")) device.id = d.id;
    if (shouldInclude("name")) device.name = d.name;
    if (shouldInclude("additionalName")) device.additionalName = d.additionalName;
    if (shouldInclude("manufacturer")) device.manufacturer = d.manufacturer;
    if (shouldInclude("modelNumber")) device.modelNumber = d.modelNumber;
    if (shouldInclude("serialNumber")) device.serialNumber = d.serialNumber;
    if (shouldInclude("releaseYear")) device.releaseYear = d.releaseYear;
    if (shouldInclude("location")) device.location = d.location;
    if (shouldInclude("info")) device.info = d.info;
    if (shouldInclude("isFavorite")) device.isFavorite = d.isFavorite;
    if (shouldInclude("status")) device.status = d.status;
    if (shouldInclude("functionalStatus")) device.functionalStatus = d.functionalStatus;
    if (shouldInclude("hasOriginalBox")) device.hasOriginalBox = d.hasOriginalBox;
    if (shouldInclude("isAssetTagged")) device.isAssetTagged = d.isAssetTagged;
    if (shouldInclude("dateAcquired")) device.dateAcquired = d.dateAcquired;
    if (shouldInclude("whereAcquired")) device.whereAcquired = d.whereAcquired;
    if (shouldInclude("priceAcquired")) device.priceAcquired = decimalToNumber(d.priceAcquired);
    if (shouldInclude("estimatedValue")) device.estimatedValue = decimalToNumber(d.estimatedValue);
    if (shouldInclude("listPrice")) device.listPrice = decimalToNumber(d.listPrice);
    if (shouldInclude("soldPrice")) device.soldPrice = decimalToNumber(d.soldPrice);
    if (shouldInclude("soldDate")) device.soldDate = d.soldDate;
    if (shouldInclude("cpu")) device.cpu = d.cpu;
    if (shouldInclude("ram")) device.ram = d.ram;
    if (shouldInclude("graphics")) device.graphics = d.graphics;
    if (shouldInclude("storage")) device.storage = d.storage;
    if (shouldInclude("operatingSystem")) device.operatingSystem = d.operatingSystem;
    if (shouldInclude("isWifiEnabled")) device.isWifiEnabled = d.isWifiEnabled;
    if (shouldInclude("isPramBatteryRemoved")) device.isPramBatteryRemoved = d.isPramBatteryRemoved;
    if (shouldInclude("lastPowerOnDate")) device.lastPowerOnDate = d.lastPowerOnDate;
    if (shouldInclude("externalUrl")) device.externalUrl = d.externalUrl;
    if (shouldInclude("category")) device.category = { id: d.category.id, name: d.category.name, type: d.category.type };
    if (shouldInclude("tags")) device.tags = d.tags.map((t) => t.name);
    if (shouldInclude("notes") && (d as any).notes) device.notes = (d as any).notes.map((n: any) => ({ date: n.date, content: n.content }));
    if (shouldInclude("maintenanceTasks") && (d as any).maintenanceTasks) device.maintenanceTasks = (d as any).maintenanceTasks.map((t: any) => ({ label: t.label, dateCompleted: t.dateCompleted, notes: t.notes }));

    return device;
  });

  return { count: results.length, devices: results };
}

export async function handleReadResource(prisma: PrismaClient, uri: string) {
  switch (uri) {
    case "inventory://categories": {
      const categories = await prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { devices: { where: { deleted: false } } } } },
      });
      return categories.map((c) => ({ id: c.id, name: c.name, type: c.type, deviceCount: c._count.devices }));
    }

    case "inventory://tags": {
      const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { devices: true } } },
      });
      return tags.map((t) => ({ id: t.id, name: t.name, deviceCount: t._count.devices }));
    }

    case "inventory://stats": {
      const [deviceCount, noteCount, taskCount, imageCount, categoryCount, tagCount] = await Promise.all([
        prisma.device.count({ where: { deleted: false } }),
        prisma.note.count(),
        prisma.maintenanceTask.count(),
        prisma.image.count(),
        prisma.category.count(),
        prisma.tag.count(),
      ]);

      const statusCounts = await prisma.device.groupBy({ by: ["status"], where: { deleted: false }, _count: true });

      return {
        deviceCount, noteCount, taskCount, imageCount, categoryCount, tagCount,
        byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
      };
    }

    case "inventory://financials": {
      const baseWhere = { deleted: false };
      const spentAgg = await prisma.device.aggregate({ where: baseWhere, _sum: { priceAcquired: true } });
      const receivedAgg = await prisma.device.aggregate({ where: { ...baseWhere, status: "SOLD" }, _sum: { soldPrice: true } });
      const ownedValueAgg = await prisma.device.aggregate({ where: { ...baseWhere, status: { notIn: ["SOLD", "DONATED"] } }, _sum: { estimatedValue: true } });
      const listedValueAgg = await prisma.device.aggregate({ where: { ...baseWhere, status: "FOR_SALE" }, _sum: { listPrice: true } });

      const soldDevices = await prisma.device.findMany({
        where: { ...baseWhere, status: "SOLD", soldPrice: { not: null } },
        select: { soldPrice: true, priceAcquired: true },
      });
      const totalProfit = soldDevices.reduce((sum, d) => sum + (decimalToNumber(d.soldPrice) - decimalToNumber(d.priceAcquired)), 0);
      const totalSpent = decimalToNumber(spentAgg._sum.priceAcquired);
      const totalReceived = decimalToNumber(receivedAgg._sum.soldPrice);

      return {
        totalSpent, totalReceived, netCash: totalReceived - totalSpent,
        estimatedValueOwned: decimalToNumber(ownedValueAgg._sum.estimatedValue),
        totalListedValue: decimalToNumber(listedValueAgg._sum.listPrice),
        netPosition: decimalToNumber(ownedValueAgg._sum.estimatedValue) + (totalReceived - totalSpent),
        totalProfit,
      };
    }

    case "inventory://transactions": {
      const baseWhere = { deleted: false };
      const acquisitions = await prisma.device.findMany({
        where: { ...baseWhere, OR: [{ priceAcquired: { not: null } }, { dateAcquired: { not: null } }] },
        select: { id: true, name: true, additionalName: true, dateAcquired: true, priceAcquired: true, whereAcquired: true },
        orderBy: { dateAcquired: "desc" },
      });
      const sales = await prisma.device.findMany({
        where: { ...baseWhere, status: "SOLD" },
        select: { id: true, name: true, additionalName: true, soldDate: true, soldPrice: true, priceAcquired: true },
        orderBy: { soldDate: "desc" },
      });
      const donations = await prisma.device.findMany({
        where: { ...baseWhere, status: "DONATED" },
        select: { id: true, name: true, additionalName: true, soldDate: true, estimatedValue: true },
        orderBy: { soldDate: "desc" },
      });

      return {
        acquisitions: acquisitions.map((d) => ({ type: "ACQUISITION", deviceId: d.id, deviceName: d.name, additionalName: d.additionalName, date: d.dateAcquired, amount: decimalToNumber(d.priceAcquired), source: d.whereAcquired })),
        sales: sales.map((d) => ({ type: "SALE", deviceId: d.id, deviceName: d.name, additionalName: d.additionalName, date: d.soldDate, amount: decimalToNumber(d.soldPrice), profit: decimalToNumber(d.soldPrice) - decimalToNumber(d.priceAcquired) })),
        donations: donations.map((d) => ({ type: "DONATION", deviceId: d.id, deviceName: d.name, additionalName: d.additionalName, date: d.soldDate, estimatedValue: decimalToNumber(d.estimatedValue) })),
      };
    }

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
