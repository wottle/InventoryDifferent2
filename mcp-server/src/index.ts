#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { type Request, type Response, type NextFunction } from "express";
import { randomUUID, createHash } from "crypto";
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

// Factory: create a fresh MCP Server instance per connection
function createMcpServer(): Server {
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
          enum: ["COLLECTION", "FOR_SALE", "PENDING_SALE", "SOLD", "DONATED", "IN_REPAIR", "RETURNED"],
          description: "Filter by device status",
        },
        functionalStatus: {
          type: "string",
          enum: ["YES", "PARTIAL", "NO"],
          description: "Filter by whether the device is functional",
        },
        condition: {
          type: "string",
          enum: ["NEW", "LIKE_NEW", "VERY_GOOD", "GOOD", "ACCEPTABLE", "FOR_PARTS"],
          description: "Filter by cosmetic condition",
        },
        rarity: {
          type: "string",
          enum: ["COMMON", "UNCOMMON", "RARE", "VERY_RARE", "EXTREMELY_RARE"],
          description: "Filter by rarity",
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
    name: "list_all_devices",
    description:
      "Returns a compact summary of EVERY device in the collection — no pagination, no limit. Use this for whole-collection reasoning and any query involving superlatives or rankings: most/least valuable, oldest/newest, rarest, largest RAM, most recently acquired, etc. list_devices has a 100-item default limit and will silently miss devices beyond that, giving wrong answers for superlatives. ALWAYS prefer list_all_devices over list_devices when the user asks for the 'best', 'most', 'least', 'oldest', 'newest', 'most valuable', or any attribute that requires seeing the full collection to answer correctly. Also use for: 'what fills gaps in my collection?', 'what's my best machine for Mac OS 8?', 'do I have any PowerPC Macs?'. estimatedValue is included in results so you can sort client-side.",
    inputSchema: {
      type: "object" as const,
      properties: {
        inPossessionOnly: {
          type: "boolean",
          description:
            "If true (default), only return devices currently in possession (COLLECTION, FOR_SALE, PENDING_SALE, IN_REPAIR, RETURNED). Set to false to include SOLD and DONATED devices.",
        },
        categoryType: {
          type: "string",
          enum: ["COMPUTER", "PERIPHERAL", "ACCESSORY", "OTHER"],
          description:
            "Optional: filter to a specific category type (e.g. COMPUTER for spec-related queries).",
        },
      },
    },
  },
  {
    name: "list_devices",
    description:
      "List devices with flexible field selection, returning up to 100 by default (max 200). WARNING: this tool has a hard limit and will not return the full collection if there are more than 100 devices — do NOT use it for superlatives (most/least valuable, oldest, newest, etc.) or any ranking that requires seeing every device. Use list_all_devices instead for those queries. list_devices is appropriate when you need specific fields not in search_devices, or need to filter by status/functionalStatus/categoryType and inspect the returned fields.",
    inputSchema: {
      type: "object" as const,
      properties: {
        status: {
          type: "string",
          enum: ["COLLECTION", "FOR_SALE", "PENDING_SALE", "SOLD", "DONATED", "IN_REPAIR", "RETURNED"],
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
            "Array of field names to include in results. Available fields: id, name, additionalName, manufacturer, modelNumber, serialNumber, releaseYear, location, info, isFavorite, status, functionalStatus, condition, rarity, hasOriginalBox, isAssetTagged, dateAcquired, whereAcquired, priceAcquired, estimatedValue, listPrice, soldPrice, soldDate, cpu, ram, graphics, storage, operatingSystem, isWifiEnabled, isPramBatteryRemoved, lastPowerOnDate, externalUrl, category, tags, notes, maintenanceTasks",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default 100)",
        },
      },
    },
  },
  {
    name: "update_device",
    description:
      "Update a device in the collection. Use for logging power-ons, updating estimated value, marking as sold, changing status, updating functional status, or changing location.",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "number", description: "The device ID to update" },
        lastPowerOnDate: { type: "string", description: "ISO date string for when the device was last powered on (e.g., '2026-03-30T00:00:00.000Z')" },
        estimatedValue: { type: "number", description: "Updated estimated value in dollars" },
        status: { type: "string", enum: ["COLLECTION", "FOR_SALE", "PENDING_SALE", "SOLD", "DONATED", "IN_REPAIR", "RETURNED"], description: "New device status" },
        soldPrice: { type: "number", description: "Price the device was sold for" },
        soldDate: { type: "string", description: "ISO date string for when the device was sold" },
        listPrice: { type: "number", description: "Asking price for devices listed for sale" },
        functionalStatus: { type: "string", enum: ["YES", "PARTIAL", "NO"], description: "Updated functional status" },
        location: { type: "string", description: "Where the device is stored or located" },
      },
      required: ["deviceId"],
    },
  },
  {
    name: "add_note",
    description:
      "Add a note to a device. Use for recording observations, work done, provenance info, or any free-form notes about a device.",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "number", description: "The device ID to add a note to" },
        content: { type: "string", description: "The note content" },
      },
      required: ["deviceId", "content"],
    },
  },
  {
    name: "add_maintenance_task",
    description:
      "Log a completed maintenance task for a device. Use for recording repairs, recaps, cleaning, part replacements, etc.",
    inputSchema: {
      type: "object" as const,
      properties: {
        deviceId: { type: "number", description: "The device ID" },
        label: { type: "string", description: "Short description of the task (e.g., 'Recap analog board', 'Replaced PRAM battery', 'Screen cleaning')" },
        dateCompleted: { type: "string", description: "ISO date string for when the task was completed (e.g., '2026-03-30T00:00:00.000Z')" },
        notes: { type: "string", description: "Additional notes about the task" },
        cost: { type: "number", description: "Cost of the task in dollars (parts, labor, etc.)" },
      },
      required: ["deviceId", "label", "dateCompleted"],
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

        // Condition filter
        if (args?.condition) {
          whereClause.condition = args.condition;
        }

        // Rarity filter
        if (args?.rarity) {
          whereClause.rarity = args.rarity;
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
            accessories: true,
            links: true,
            location: true,
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
              (device as any).location?.name,
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
          condition: (d as any).condition ?? null,
          rarity: (d as any).rarity ?? null,
          category: d.category.name,
          categoryType: d.category.type,
          cpu: d.cpu,
          ram: d.ram,
          storage: d.storage,
          operatingSystem: d.operatingSystem,
          location: (d as any).location?.name ?? null,
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
            accessories: true,
            links: true,
            location: true,
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
          location: (device as any).location?.name ?? null,
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

      case "list_all_devices": {
        const IN_POSSESSION_STATUSES = ['COLLECTION', 'FOR_SALE', 'PENDING_SALE', 'IN_REPAIR', 'RETURNED'];

        const where: any = { deleted: false };
        if (args?.inPossessionOnly !== false) {
          where.status = { in: IN_POSSESSION_STATUSES };
        }
        if (args?.categoryType) {
          where.category = { type: args.categoryType };
        }

        const devices = await prisma.device.findMany({
          where,
          select: {
            id: true,
            name: true,
            additionalName: true,
            manufacturer: true,
            modelNumber: true,
            releaseYear: true,
            status: true,
            functionalStatus: true,
            cpu: true,
            ram: true,
            storage: true,
            operatingSystem: true,
            estimatedValue: true,
            category: { select: { name: true, type: true } },
            tags: { select: { name: true } },
          },
          orderBy: [
            { category: { sortOrder: 'asc' } },
            { releaseYear: 'asc' },
            { name: 'asc' },
          ],
        });

        const summary = {
          totalCount: devices.length,
          inPossessionOnly: args?.inPossessionOnly !== false,
          devices: devices.map(d => ({
            id: d.id,
            name: d.additionalName ? `${d.name} ${d.additionalName}` : d.name,
            manufacturer: d.manufacturer,
            model: d.modelNumber,
            year: d.releaseYear,
            status: d.status,
            functionalStatus: d.functionalStatus,
            condition: (d as any).condition ?? null,
            rarity: (d as any).rarity ?? null,
            category: d.category?.name,
            categoryType: d.category?.type,
            cpu: d.cpu,
            ram: d.ram,
            storage: d.storage,
            os: d.operatingSystem,
            estimatedValue: d.estimatedValue ? Number(d.estimatedValue) : null,
            tags: d.tags.length > 0 ? d.tags.map(t => t.name) : undefined,
          })),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 0),
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
            accessories: true,
            links: true,
            location: true,
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
          if (shouldInclude("location")) device.location = (d as any).location?.name ?? null;
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

      case "update_device": {
        if (!args?.deviceId) throw new Error("deviceId is required");

        const data: any = {};
        if (args.lastPowerOnDate !== undefined) data.lastPowerOnDate = new Date(args.lastPowerOnDate as string);
        if (args.estimatedValue !== undefined) data.estimatedValue = args.estimatedValue;
        if (args.status !== undefined) data.status = args.status;
        if (args.soldPrice !== undefined) data.soldPrice = args.soldPrice;
        if (args.soldDate !== undefined) data.soldDate = new Date(args.soldDate as string);
        if (args.listPrice !== undefined) data.listPrice = args.listPrice;
        if (args.functionalStatus !== undefined) data.functionalStatus = args.functionalStatus;

        const device: any = await prisma.device.update({
          where: { id: args.deviceId as number },
          data,
          include: { location: true },
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              device: {
                id: device.id,
                name: device.additionalName ? `${device.name} (${device.additionalName})` : device.name,
                lastPowerOnDate: device.lastPowerOnDate,
                estimatedValue: decimalToNumber(device.estimatedValue),
                status: device.status,
                soldPrice: decimalToNumber(device.soldPrice),
                soldDate: device.soldDate,
                listPrice: decimalToNumber(device.listPrice),
                functionalStatus: device.functionalStatus,
                location: (device as any).location?.name ?? null,
              },
            }, null, 2),
          }],
        };
      }

      case "add_note": {
        if (!args?.deviceId) throw new Error("deviceId is required");
        if (!args?.content) throw new Error("content is required");

        const note = await prisma.note.create({
          data: {
            deviceId: args.deviceId as number,
            content: args.content as string,
            date: new Date(),
          },
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, noteId: note.id, content: note.content, date: note.date }, null, 2),
          }],
        };
      }

      case "add_maintenance_task": {
        if (!args?.deviceId) throw new Error("deviceId is required");
        if (!args?.label) throw new Error("label is required");
        if (!args?.dateCompleted) throw new Error("dateCompleted is required");

        const task = await prisma.maintenanceTask.create({
          data: {
            deviceId: args.deviceId as number,
            label: args.label as string,
            dateCompleted: new Date(args.dateCompleted as string),
            notes: (args.notes as string | undefined) ?? null,
            cost: (args.cost as number | undefined) ?? null,
          },
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              taskId: task.id,
              label: task.label,
              dateCompleted: task.dateCompleted,
              notes: task.notes,
              cost: task.cost ? decimalToNumber(task.cost) : null,
            }, null, 2),
          }],
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

  return server;
} // end createMcpServer

// Start the server
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : null;

  if (port) {
    // HTTP/SSE mode for remote access via domain
    const app = express();
    // Do NOT apply express.json() globally — it consumes the request stream
    // before SSEServerTransport.handlePostMessage() can read it on POST /message

    const mcpToken = process.env.MCP_TOKEN;

    // Request logger — logs every incoming request
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const authHeader = req.headers.authorization;
      const authSnippet = authHeader
        ? authHeader.startsWith("Bearer ")
          ? `Bearer ***${authHeader.slice(-4)}`
          : "[non-bearer]"
        : "[none]";
      console.error(`[${new Date().toISOString()}] --> ${req.method} ${req.path} auth=${authSnippet}`);
      res.on("finish", () => {
        console.error(`[${new Date().toISOString()}] <-- ${req.method} ${req.path} ${res.statusCode} (${Date.now() - start}ms)`);
      });
      next();
    });

    // Base URL helper — trust X-Forwarded-Proto from Traefik
    function baseUrl(req: Request): string {
      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
      return `${proto}://${req.get("host")}`;
    }

    // Bearer token auth middleware
    function requireAuth(req: Request, res: Response, next: NextFunction) {
      if (!mcpToken) return next();
      const authHeader = req.headers.authorization;
      if (authHeader === `Bearer ${mcpToken}`) {
        console.error(`[auth] PASS ${req.method} ${req.path}`);
        return next();
      }
      console.error(`[auth] FAIL ${req.method} ${req.path} — header="${authHeader ?? "(missing)"}"`);
      // Return OAuth challenge so Claude Code starts the auth flow
      res.setHeader("WWW-Authenticate", `Bearer realm="${baseUrl(req)}"`);
      res.status(401).json({ error: "unauthorized", error_description: "Bearer token required" });
    }

    // ── OAuth 2.0 endpoints ──────────────────────────────────────────────────

    // In-memory store: auth code → { codeChallenge, method }
    const authCodes = new Map<string, { codeChallenge: string; method: string }>();

    // OAuth discovery
    app.get("/.well-known/oauth-authorization-server", (req: Request, res: Response) => {
      const base = baseUrl(req);
      res.json({
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        registration_endpoint: `${base}/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256"],
      });
    });

    // Dynamic client registration — open, just hands back a client_id
    app.post("/register", express.json(), (req: Request, res: Response) => {
      const body = req.body || {};
      res.status(201).json({
        client_id: "claude-code",
        redirect_uris: body.redirect_uris || [],
        grant_types: ["authorization_code"],
        token_endpoint_auth_method: "none",
      });
    });

    // Authorization page — user enters MCP token to approve access
    app.get("/authorize", (req: Request, res: Response) => {
      const { redirect_uri, state, code_challenge, code_challenge_method } = req.query;
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Inventory MCP — Authorize</title>
  <style>
    body { font-family: monospace; max-width: 420px; margin: 80px auto; padding: 20px; }
    h2 { margin-bottom: 4px; }
    p { color: #555; font-size: 14px; }
    input[type=password] { width: 100%; padding: 8px; margin: 10px 0; box-sizing: border-box; font-size: 16px; }
    button { padding: 10px 20px; font-size: 15px; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Inventory MCP</h2>
  <p>Enter your MCP token to authorize Claude Code to access your collection.</p>
  <form method="post" action="/authorize/confirm">
    <input type="hidden" name="redirect_uri" value="${redirect_uri}">
    <input type="hidden" name="state" value="${state}">
    <input type="hidden" name="code_challenge" value="${code_challenge}">
    <input type="hidden" name="code_challenge_method" value="${code_challenge_method}">
    <input type="password" name="token" placeholder="MCP Token" autofocus>
    <button type="submit">Authorize</button>
  </form>
</body>
</html>`);
    });

    // Authorization confirmation — validates token, issues auth code
    app.post(
      "/authorize/confirm",
      express.urlencoded({ extended: false }),
      (req: Request, res: Response) => {
        const { redirect_uri, state, token, code_challenge, code_challenge_method } = req.body;

        if (mcpToken && token !== mcpToken) {
          res.status(401).send("Invalid token. <a href='javascript:history.back()'>Go back</a>.");
          return;
        }

        const code = randomUUID();
        authCodes.set(code, {
          codeChallenge: code_challenge || "",
          method: code_challenge_method || "",
        });
        // Auth codes expire after 5 minutes
        setTimeout(() => authCodes.delete(code), 5 * 60 * 1000);

        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set("code", code);
        if (state) redirectUrl.searchParams.set("state", state);
        res.redirect(redirectUrl.toString());
      }
    );

    // Token exchange — validates PKCE, returns access token
    app.post(
      "/token",
      express.urlencoded({ extended: false }),
      (req: Request, res: Response) => {
        const { grant_type, code, code_verifier } = req.body;

        if (grant_type !== "authorization_code") {
          res.status(400).json({ error: "unsupported_grant_type" });
          return;
        }

        const stored = authCodes.get(code);
        if (!stored) {
          res.status(401).json({ error: "invalid_grant", error_description: "Unknown or expired code" });
          return;
        }
        authCodes.delete(code); // single use

        // Verify PKCE (S256)
        if (stored.codeChallenge && code_verifier) {
          const hash = createHash("sha256").update(code_verifier).digest("base64url");
          if (hash !== stored.codeChallenge) {
            res.status(401).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
            return;
          }
        }

        const token = mcpToken || "no-token";
        console.error(`[token] issued access_token ending in ...${token.slice(-4)}`);
        res.json({
          access_token: token,
          token_type: "Bearer",
          expires_in: 86400 * 30, // 30 days
        });
      }
    );

    // ── MCP endpoints ────────────────────────────────────────────────────────

    const transports: Record<string, SSEServerTransport> = {};

    app.get("/sse", requireAuth, async (req: Request, res: Response) => {
      console.error(`[sse] new connection from ${req.ip}`);
      try {
        const transport = new SSEServerTransport("/message", res);
        console.error(`[sse] transport created, sessionId=${transport.sessionId}`);
        transports[transport.sessionId] = transport;
        res.on("close", () => {
          console.error(`[sse] connection closed, sessionId=${transport.sessionId}`);
          delete transports[transport.sessionId];
        });
        const mcpServer = createMcpServer();
        console.error(`[sse] connecting server to transport...`);
        await mcpServer.connect(transport);
        console.error(`[sse] server connected successfully, sessionId=${transport.sessionId}`);
      } catch (err) {
        console.error(`[sse] ERROR during connect:`, err);
      }
    });

    app.post("/message", requireAuth, async (req: Request, res: Response) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];
      if (!transport) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      await transport.handlePostMessage(req, res);
    });

    app.listen(port, () => {
      console.error(`Inventory MCP server running on port ${port}${mcpToken ? " (auth enabled)" : " (no auth)"}`);
    });
  } else {
    // stdio mode for local use
    const transport = new StdioServerTransport();
    await createMcpServer().connect(transport);
    console.error("Inventory MCP server running on stdio");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
