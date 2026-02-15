#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Helper function to convert Prisma Decimal to number
function decimalToNumber(value: any): number {
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

// Create MCP server
const server = new Server(
  {
    name: "inventory-collection",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: "search_devices",
    description:
      "Search the vintage computer collection. Can filter by text query, status, category, functional status, manufacturer, and tags. Returns device details including specs, status, and financial info.",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description:
            "Text to search for in device name, manufacturer, model, CPU, info, notes, and tags",
        },
        status: {
          type: "string",
          enum: ["AVAILABLE", "FOR_SALE", "PENDING_SALE", "SOLD", "DONATED"],
          description: "Filter by device status",
        },
        functionalStatus: {
          type: "string",
          enum: ["YES", "PARTIAL", "NO"],
          description: "Filter by whether the device is functional",
        },
        categoryId: {
          type: "number",
          description: "Filter by category ID",
        },
        categoryType: {
          type: "string",
          enum: ["COMPUTER", "PERIPHERAL", "ACCESSORY", "OTHER"],
          description: "Filter by category type",
        },
        manufacturer: {
          type: "string",
          description: "Filter by manufacturer name (partial match)",
        },
        tagName: {
          type: "string",
          description: "Filter by tag name",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default 50)",
        },
      },
    },
  },
  {
    name: "get_device_details",
    description:
      "Get full details for a specific device by ID, including all specs, images, notes, maintenance tasks, and tags.",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: {
          type: "number",
          description: "The device ID to retrieve",
        },
      },
      required: ["deviceId"],
    },
  },
  {
    name: "get_financial_summary",
    description:
      "Get financial overview of the collection including total spent, total received from sales, net cash position, estimated value of owned items, and total profit.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "list_devices",
    description:
      "List all devices with flexible field selection. Use this when you need to retrieve specific fields that aren't available in search_devices, or when you need to manually sort/filter results by fields not supported by search_devices sorting.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["AVAILABLE", "FOR_SALE", "PENDING_SALE", "SOLD", "DONATED"],
          description: "Filter by device status",
        },
        functionalStatus: {
          type: "string",
          enum: ["YES", "PARTIAL", "NO"],
          description: "Filter by whether the device is functional",
        },
        categoryType: {
          type: "string",
          enum: ["COMPUTER", "PERIPHERAL", "ACCESSORY", "OTHER"],
          description: "Filter by category type",
        },
        fields: {
          type: "array",
          items: { type: "string" },
          description:
            "Array of field names to include in results. Available fields: id, name, additionalName, manufacturer, modelNumber, serialNumber, releaseYear, location, info, isFavorite, status, functionalStatus, hasOriginalBox, isAssetTagged, dateAcquired, whereAcquired, priceAcquired, estimatedValue, listPrice, soldPrice, soldDate, cpu, ram, graphics, storage, operatingSystem, isWifiEnabled, isPramBatteryRemoved, lastPowerOnDate, externalUrl, category, tags, notes, maintenanceTasks",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default 100)",
        },
      },
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_devices": {
        const whereClause: any = { deleted: false };

        // Status filter
        if (args?.status) {
          whereClause.status = args.status;
        }

        // Functional status filter
        if (args?.functionalStatus) {
          whereClause.functionalStatus = args.functionalStatus;
        }

        // Category ID filter
        if (args?.categoryId) {
          whereClause.categoryId = args.categoryId;
        }

        // Category type filter
        if (args?.categoryType) {
          whereClause.category = { type: args.categoryType };
        }

        // Manufacturer filter (case-insensitive contains)
        if (args?.manufacturer) {
          whereClause.manufacturer = {
            contains: args.manufacturer,
            mode: "insensitive",
          };
        }

        // Tag filter
        if (args?.tagName) {
          whereClause.tags = {
            some: {
              name: {
                contains: args.tagName,
                mode: "insensitive",
              },
            },
          };
        }

        const limit = Math.min(Number(args?.limit) || 50, 100);

        let devices = await prisma.device.findMany({
          where: whereClause,
          include: {
            category: true,
            tags: true,
            notes: true,
            maintenanceTasks: true,
          },
          take: limit,
          orderBy: { name: "asc" },
        });

        // Text search filter (post-query for flexibility)
        if (args?.query) {
          const query = (args.query as string).toLowerCase();
          devices = devices.filter((device) => {
            const searchableText = [
              device.name,
              device.additionalName,
              device.manufacturer,
              device.modelNumber,
              device.serialNumber,
              device.cpu,
              device.ram,
              device.graphics,
              device.storage,
              device.operatingSystem,
              device.info,
              device.location,
              ...device.tags.map((t) => t.name),
              ...device.notes.map((n) => n.content),
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return searchableText.includes(query);
          });
        }

        // Format results
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: results.length,
                  devices: results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_device_details": {
        if (!args?.deviceId) {
          throw new Error("deviceId is required");
        }

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

        if (!device) {
          return {
            content: [
              {
                type: "text",
                text: `Device with ID ${args.deviceId} not found`,
              },
            ],
          };
        }

        const result = {
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
          category: {
            id: device.category.id,
            name: device.category.name,
            type: device.category.type,
          },
          specs: {
            cpu: device.cpu,
            ram: device.ram,
            graphics: device.graphics,
            storage: device.storage,
            operatingSystem: device.operatingSystem,
            isWifiEnabled: device.isWifiEnabled,
            isPramBatteryRemoved: device.isPramBatteryRemoved,
          },
          acquisition: {
            dateAcquired: device.dateAcquired,
            whereAcquired: device.whereAcquired,
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
          notes: device.notes.map((n) => ({
            date: n.date,
            content: n.content,
          })),
          maintenanceTasks: device.maintenanceTasks.map((t) => ({
            label: t.label,
            dateCompleted: t.dateCompleted,
            notes: t.notes,
          })),
          imageCount: device.images.length,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_financial_summary": {
        const baseWhere = { deleted: false };

        // Total spent on acquisitions
        const spentAgg = await prisma.device.aggregate({
          where: baseWhere,
          _sum: { priceAcquired: true },
        });

        // Total received from sales
        const receivedAgg = await prisma.device.aggregate({
          where: {
            ...baseWhere,
            status: "SOLD",
          },
          _sum: { soldPrice: true },
        });

        // Estimated value of owned items
        const ownedValueAgg = await prisma.device.aggregate({
          where: {
            ...baseWhere,
            status: { notIn: ["SOLD", "DONATED"] },
          },
          _sum: { estimatedValue: true },
        });

        // Count by status
        const statusCounts = await prisma.device.groupBy({
          by: ["status"],
          where: baseWhere,
          _count: true,
        });

        // Calculate profit from sold items
        const soldDevices = await prisma.device.findMany({
          where: {
            ...baseWhere,
            status: "SOLD",
            soldPrice: { not: null },
          },
          select: {
            soldPrice: true,
            priceAcquired: true,
          },
        });

        const totalProfit = soldDevices.reduce((sum, d) => {
          const soldPrice = decimalToNumber(d.soldPrice);
          const priceAcquired = decimalToNumber(d.priceAcquired);
          return sum + (soldPrice - priceAcquired);
        }, 0);

        const totalSpent = decimalToNumber(spentAgg._sum.priceAcquired);
        const totalReceived = decimalToNumber(receivedAgg._sum.soldPrice);
        const netCash = totalReceived - totalSpent;
        const estimatedValueOwned = decimalToNumber(
          ownedValueAgg._sum.estimatedValue
        );
        const netPosition = estimatedValueOwned + netCash;

        const result = {
          totalSpent,
          totalReceived,
          netCash,
          estimatedValueOwned,
          netPosition,
          totalProfit,
          deviceCounts: Object.fromEntries(
            statusCounts.map((s) => [s.status, s._count])
          ),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_devices": {
        const whereClause: any = { deleted: false };

        // Status filter
        if (args?.status) {
          whereClause.status = args.status;
        }

        // Functional status filter
        if (args?.functionalStatus) {
          whereClause.functionalStatus = args.functionalStatus;
        }

        // Category type filter
        if (args?.categoryType) {
          whereClause.category = { type: args.categoryType };
        }

        const limit = Math.min(Number(args?.limit) || 100, 200);

        // Determine which fields to include
        const requestedFields = args?.fields as string[] | undefined;
        const includeAllFields = !requestedFields || requestedFields.length === 0;
        
        // Determine what to include in the query
        const shouldIncludeNotes = includeAllFields || requestedFields?.includes("notes");
        const shouldIncludeTasks = includeAllFields || requestedFields?.includes("maintenanceTasks");

        // Fetch all devices with related data
        const devices = await prisma.device.findMany({
          where: whereClause,
          include: {
            category: true,
            tags: true,
            notes: shouldIncludeNotes ? { orderBy: { date: "desc" } } : false,
            maintenanceTasks: shouldIncludeTasks ? { orderBy: { dateCompleted: "desc" } } : false,
          },
          take: limit,
          orderBy: { id: "asc" },
        });

        // Map devices to requested fields
        const results = devices.map((d) => {
          const device: any = {};

          const shouldInclude = (field: string) =>
            includeAllFields || requestedFields.includes(field);

          if (shouldInclude("id")) device.id = d.id;
          if (shouldInclude("name")) device.name = d.name;
          if (shouldInclude("additionalName"))
            device.additionalName = d.additionalName;
          if (shouldInclude("manufacturer"))
            device.manufacturer = d.manufacturer;
          if (shouldInclude("modelNumber")) device.modelNumber = d.modelNumber;
          if (shouldInclude("serialNumber"))
            device.serialNumber = d.serialNumber;
          if (shouldInclude("releaseYear")) device.releaseYear = d.releaseYear;
          if (shouldInclude("location")) device.location = d.location;
          if (shouldInclude("info")) device.info = d.info;
          if (shouldInclude("isFavorite")) device.isFavorite = d.isFavorite;
          if (shouldInclude("status")) device.status = d.status;
          if (shouldInclude("functionalStatus"))
            device.functionalStatus = d.functionalStatus;
          if (shouldInclude("hasOriginalBox"))
            device.hasOriginalBox = d.hasOriginalBox;
          if (shouldInclude("isAssetTagged"))
            device.isAssetTagged = d.isAssetTagged;
          if (shouldInclude("dateAcquired"))
            device.dateAcquired = d.dateAcquired;
          if (shouldInclude("whereAcquired"))
            device.whereAcquired = d.whereAcquired;
          if (shouldInclude("priceAcquired"))
            device.priceAcquired = decimalToNumber(d.priceAcquired);
          if (shouldInclude("estimatedValue"))
            device.estimatedValue = decimalToNumber(d.estimatedValue);
          if (shouldInclude("listPrice"))
            device.listPrice = decimalToNumber(d.listPrice);
          if (shouldInclude("soldPrice"))
            device.soldPrice = decimalToNumber(d.soldPrice);
          if (shouldInclude("soldDate")) device.soldDate = d.soldDate;
          if (shouldInclude("cpu")) device.cpu = d.cpu;
          if (shouldInclude("ram")) device.ram = d.ram;
          if (shouldInclude("graphics")) device.graphics = d.graphics;
          if (shouldInclude("storage")) device.storage = d.storage;
          if (shouldInclude("operatingSystem"))
            device.operatingSystem = d.operatingSystem;
          if (shouldInclude("isWifiEnabled"))
            device.isWifiEnabled = d.isWifiEnabled;
          if (shouldInclude("isPramBatteryRemoved"))
            device.isPramBatteryRemoved = d.isPramBatteryRemoved;
          if (shouldInclude("lastPowerOnDate"))
            device.lastPowerOnDate = d.lastPowerOnDate;
          if (shouldInclude("externalUrl")) device.externalUrl = d.externalUrl;
          if (shouldInclude("category")) {
            device.category = {
              id: d.category.id,
              name: d.category.name,
              type: d.category.type,
            };
          }
          if (shouldInclude("tags")) {
            device.tags = d.tags.map((t) => t.name);
          }
          if (shouldInclude("notes") && d.notes) {
            device.notes = d.notes.map((n) => ({
              date: n.date,
              content: n.content,
            }));
          }
          if (shouldInclude("maintenanceTasks") && d.maintenanceTasks) {
            device.maintenanceTasks = d.maintenanceTasks.map((t) => ({
              label: t.label,
              dateCompleted: t.dateCompleted,
              notes: t.notes,
            }));
          }

          return device;
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: results.length,
                  devices: results,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// Resource definitions
const RESOURCES = [
  {
    uri: "inventory://categories",
    name: "Categories",
    description: "List of all device categories",
    mimeType: "application/json",
  },
  {
    uri: "inventory://tags",
    name: "Tags",
    description: "List of all tags used in the collection",
    mimeType: "application/json",
  },
  {
    uri: "inventory://stats",
    name: "Collection Statistics",
    description:
      "Overview statistics of the collection including counts and storage usage",
    mimeType: "application/json",
  },
  {
    uri: "inventory://financials",
    name: "Financial Overview",
    description:
      "Financial summary including spending, revenue, and estimated values",
    mimeType: "application/json",
  },
  {
    uri: "inventory://transactions",
    name: "Financial Transactions",
    description: "List of all acquisitions, sales, and donations",
    mimeType: "application/json",
  },
];

// List resources handler
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: RESOURCES };
});

// Read resource handler
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    switch (uri) {
      case "inventory://categories": {
        const categories = await prisma.category.findMany({
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            _count: {
              select: { devices: { where: { deleted: false } } },
            },
          },
        });

        const result = categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          deviceCount: c._count.devices,
        }));

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "inventory://tags": {
        const tags = await prisma.tag.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { devices: true },
            },
          },
        });

        const result = tags.map((t) => ({
          id: t.id,
          name: t.name,
          deviceCount: t._count.devices,
        }));

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "inventory://stats": {
        const [
          deviceCount,
          noteCount,
          taskCount,
          imageCount,
          categoryCount,
          tagCount,
        ] = await Promise.all([
          prisma.device.count({ where: { deleted: false } }),
          prisma.note.count(),
          prisma.maintenanceTask.count(),
          prisma.image.count(),
          prisma.category.count(),
          prisma.tag.count(),
        ]);

        // Count by status
        const statusCounts = await prisma.device.groupBy({
          by: ["status"],
          where: { deleted: false },
          _count: true,
        });

        // Count by category type
        const categoryTypeCounts = await prisma.device.groupBy({
          by: ["categoryId"],
          where: { deleted: false },
          _count: true,
        });

        const result = {
          deviceCount,
          noteCount,
          taskCount,
          imageCount,
          categoryCount,
          tagCount,
          byStatus: Object.fromEntries(
            statusCounts.map((s) => [s.status, s._count])
          ),
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "inventory://financials": {
        const baseWhere = { deleted: false };

        const spentAgg = await prisma.device.aggregate({
          where: baseWhere,
          _sum: { priceAcquired: true },
        });

        const receivedAgg = await prisma.device.aggregate({
          where: { ...baseWhere, status: "SOLD" },
          _sum: { soldPrice: true },
        });

        const ownedValueAgg = await prisma.device.aggregate({
          where: { ...baseWhere, status: { notIn: ["SOLD", "DONATED"] } },
          _sum: { estimatedValue: true },
        });

        const listedValueAgg = await prisma.device.aggregate({
          where: { ...baseWhere, status: "FOR_SALE" },
          _sum: { listPrice: true },
        });

        const soldDevices = await prisma.device.findMany({
          where: { ...baseWhere, status: "SOLD", soldPrice: { not: null } },
          select: { soldPrice: true, priceAcquired: true },
        });

        const totalProfit = soldDevices.reduce((sum, d) => {
          return (
            sum + (decimalToNumber(d.soldPrice) - decimalToNumber(d.priceAcquired))
          );
        }, 0);

        const totalSpent = decimalToNumber(spentAgg._sum.priceAcquired);
        const totalReceived = decimalToNumber(receivedAgg._sum.soldPrice);

        const result = {
          totalSpent,
          totalReceived,
          netCash: totalReceived - totalSpent,
          estimatedValueOwned: decimalToNumber(ownedValueAgg._sum.estimatedValue),
          totalListedValue: decimalToNumber(listedValueAgg._sum.listPrice),
          netPosition:
            decimalToNumber(ownedValueAgg._sum.estimatedValue) +
            (totalReceived - totalSpent),
          totalProfit,
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "inventory://transactions": {
        const baseWhere = { deleted: false };

        const acquisitions = await prisma.device.findMany({
          where: {
            ...baseWhere,
            OR: [
              { priceAcquired: { not: null } },
              { dateAcquired: { not: null } },
            ],
          },
          select: {
            id: true,
            name: true,
            additionalName: true,
            dateAcquired: true,
            priceAcquired: true,
            whereAcquired: true,
          },
          orderBy: { dateAcquired: "desc" },
        });

        const sales = await prisma.device.findMany({
          where: { ...baseWhere, status: "SOLD" },
          select: {
            id: true,
            name: true,
            additionalName: true,
            soldDate: true,
            soldPrice: true,
            priceAcquired: true,
          },
          orderBy: { soldDate: "desc" },
        });

        const donations = await prisma.device.findMany({
          where: { ...baseWhere, status: "DONATED" },
          select: {
            id: true,
            name: true,
            additionalName: true,
            soldDate: true,
            estimatedValue: true,
          },
          orderBy: { soldDate: "desc" },
        });

        const result = {
          acquisitions: acquisitions.map((d) => ({
            type: "ACQUISITION",
            deviceId: d.id,
            deviceName: d.name,
            additionalName: d.additionalName,
            date: d.dateAcquired,
            amount: decimalToNumber(d.priceAcquired),
            source: d.whereAcquired,
          })),
          sales: sales.map((d) => ({
            type: "SALE",
            deviceId: d.id,
            deviceName: d.name,
            additionalName: d.additionalName,
            date: d.soldDate,
            amount: decimalToNumber(d.soldPrice),
            profit:
              decimalToNumber(d.soldPrice) - decimalToNumber(d.priceAcquired),
          })),
          donations: donations.map((d) => ({
            type: "DONATION",
            deviceId: d.id,
            deviceName: d.name,
            additionalName: d.additionalName,
            date: d.soldDate,
            estimatedValue: decimalToNumber(d.estimatedValue),
          })),
        };

        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read resource ${uri}: ${message}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Inventory MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
