import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert Prisma Decimal to number
function decimalToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    const n = value.toNumber();
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Use internal Docker network URL for server-side API calls
const API_URL = (process.env.API_URL || 'http://api:4000') + '/graphql';

export async function POST(req: Request) {
  try {
    console.log('[Chat API] Received request');
    console.log('[Chat API] API_URL:', API_URL);
    console.log('[Chat API] OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    const { messages } = await req.json();
    console.log('[Chat API] Messages:', messages?.length || 0);

    console.log('[Chat API] Creating streamText...');
    const result = streamText({
      model: openai('gpt-4o'),
    system: `You are a helpful, friendly assistant for a vintage computer collection inventory system called "InventoryDifferent". 
    
You help users query and understand their collection of vintage computers, peripherals, and accessories.

When users ask about their collection, use the available tools to search and retrieve information. 

RESPONSE STYLE:
- Be conversational and natural, like talking to a fellow vintage computer enthusiast
- Avoid structured tables or bullet points unless the user asks for a list of multiple items
- For single items, describe them in flowing sentences with personality
- Weave technical details into natural descriptions (e.g., "equipped with a 25MHz 68040 processor")
- Mention interesting details like location, condition, or unique features when relevant

VINTAGE COMPUTING KNOWLEDGE:
- You have deep knowledge of vintage Apple hardware, NeXT computers, and classic computing history
- When discussing a device, augment the inventory data with historical context, interesting facts, and significance
- Share details like: original release date, original price, notable features, cultural impact, Steve Jobs connections
- Mention what made a device special or innovative for its time
- If asked about a device's history, provide rich context beyond just the inventory data
- Connect devices to their era and explain their place in computing history

TOOL USAGE:
- For financial questions, use the get_financial_summary tool
- For searching devices, use the search_devices tool with appropriate filters
- For detailed information about a specific device, use the get_device_details tool
- Unless specifically noted, exclude sold items from results when being assked about the collction

DEVICE IDENTIFICATION:
- ALWAYS include the additionalName field when referencing devices, as there are duplicates and the additionalName differentiates them
- When mentioning a device, use both name and additionalName (e.g., "Macintosh SE (30MB HD)" not just "Macintosh SE")

MAINTENANCE AND WORK HISTORY:
- When asked about maintenance or work performed on devices, review both maintenanceTasks and notes in chronological order
- Look at the dates to understand the timeline of what has been done to a machine
- Combine information from both maintenanceTasks and notes to provide a complete history

IMPORTANT: When users ask for superlatives (most/least valuable, oldest/newest, etc.), always use the sortBy and sortOrder parameters:
- Most valuable: sortBy='estimatedValue', sortOrder='desc', limit=1
- Least valuable: sortBy='estimatedValue', sortOrder='asc', limit=1
- Oldest: sortBy='releaseYear', sortOrder='asc', limit=1
- Newest: sortBy='releaseYear', sortOrder='desc', limit=1
- Recently acquired: sortBy='dateAcquired', sortOrder='desc', limit=1
- If asked about a specific device property that doesn't support sorting, use the the list_devices tool with the appropriate filter.

Be enthusiastic about vintage computing while staying concise and helpful!`,
    messages,
    tools: {
      search_devices: tool({
        description: 'Search the vintage computer collection. Can filter by text query, status, category type, functional status, manufacturer, and tags. Can sort results by various fields.',
        parameters: z.object({
          query: z.string().optional().describe('Text to search for in device name, manufacturer, model, CPU, info, notes, and tags'),
          status: z.enum(['AVAILABLE', 'FOR_SALE', 'PENDING_SALE', 'SOLD', 'DONATED']).optional().describe('Filter by device status'),
          functionalStatus: z.enum(['YES', 'PARTIAL', 'NO']).optional().describe('Filter by whether the device is functional'),
          categoryType: z.enum(['COMPUTER', 'PERIPHERAL', 'ACCESSORY', 'OTHER']).optional().describe('Filter by category type'),
          manufacturer: z.string().optional().describe('Filter by manufacturer name (partial match)'),
          tagName: z.string().optional().describe('Filter by tag name'),
          sortBy: z.enum(['name', 'estimatedValue', 'releaseYear', 'dateAcquired']).optional().describe('Field to sort results by'),
          sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order: asc (ascending) or desc (descending). Default is asc.'),
          limit: z.number().optional().describe('Maximum number of results (default 20, max 100)'),
        }),
        execute: async (params) => {
          try {
            // Build GraphQL query with filters
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: `
                  query SearchDevices($where: DeviceWhereInput) {
                    devices(where: $where) {
                      id
                      name
                      additionalName
                      manufacturer
                      modelNumber
                      releaseYear
                      status
                      functionalStatus
                      cpu
                      ram
                      storage
                      operatingSystem
                      location
                      estimatedValue
                      listPrice
                      info
                      category {
                        name
                        type
                      }
                      tags {
                        name
                      }
                    }
                  }
                `,
                variables: {
                  where: {
                    deleted: { equals: false },
                    ...(params.status && { status: { equals: params.status } }),
                    ...(params.functionalStatus && { functionalStatus: { equals: params.functionalStatus } }),
                    ...(params.categoryType && { category: { type: { equals: params.categoryType } } }),
                  },
                },
              }),
            });

            const data = await response.json();
            let devices = data.data?.devices || [];

            // Apply text search filter
            if (params.query) {
              const query = params.query.toLowerCase();
              devices = devices.filter((device: any) => {
                const searchableText = [
                  device.name,
                  device.additionalName,
                  device.manufacturer,
                  device.modelNumber,
                  device.cpu,
                  device.ram,
                  device.storage,
                  device.operatingSystem,
                  device.info,
                  device.location,
                  ...(device.tags?.map((t: any) => t.name) || []),
                ].filter(Boolean).join(' ').toLowerCase();
                return searchableText.includes(query);
              });
            }

            // Apply manufacturer filter
            if (params.manufacturer) {
              const mfr = params.manufacturer.toLowerCase();
              devices = devices.filter((d: any) => 
                d.manufacturer?.toLowerCase().includes(mfr)
              );
            }

            // Apply tag filter
            if (params.tagName) {
              const tag = params.tagName.toLowerCase();
              devices = devices.filter((d: any) => 
                d.tags?.some((t: any) => t.name.toLowerCase().includes(tag))
              );
            }

            // Sort results
            if (params.sortBy) {
              const sortOrder = params.sortOrder || 'asc';
              devices.sort((a: any, b: any) => {
                let aVal, bVal;
                
                switch (params.sortBy) {
                  case 'estimatedValue':
                    aVal = decimalToNumber(a.estimatedValue) || 0;
                    bVal = decimalToNumber(b.estimatedValue) || 0;
                    break;
                  case 'releaseYear':
                    aVal = a.releaseYear || 0;
                    bVal = b.releaseYear || 0;
                    break;
                  case 'dateAcquired':
                    aVal = a.dateAcquired ? new Date(a.dateAcquired).getTime() : 0;
                    bVal = b.dateAcquired ? new Date(b.dateAcquired).getTime() : 0;
                    break;
                  case 'name':
                  default:
                    aVal = (a.name || '').toLowerCase();
                    bVal = (b.name || '').toLowerCase();
                    break;
                }
                
                if (sortOrder === 'desc') {
                  return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                } else {
                  return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
              });
            }

            // Limit results
            const limit = Math.min(params.limit || 20, 100);
            devices = devices.slice(0, limit);

            // Format results
            const results = devices.map((d: any) => ({
              id: d.id,
              name: d.name,
              additionalName: d.additionalName,
              manufacturer: d.manufacturer,
              modelNumber: d.modelNumber,
              releaseYear: d.releaseYear,
              status: d.status,
              functionalStatus: d.functionalStatus,
              category: d.category?.name,
              categoryType: d.category?.type,
              cpu: d.cpu,
              ram: d.ram,
              storage: d.storage,
              operatingSystem: d.operatingSystem,
              location: d.location,
              estimatedValue: decimalToNumber(d.estimatedValue),
              listPrice: decimalToNumber(d.listPrice),
              tags: d.tags?.map((t: any) => t.name) || [],
            }));

            return {
              count: results.length,
              devices: results,
            };
          } catch (error) {
            return { error: `Failed to search devices: ${error}` };
          }
        },
      }),

      get_device_details: tool({
        description: 'Get full details for a specific device by ID, including all specs, notes, maintenance tasks, and tags.',
        parameters: z.object({
          deviceId: z.number().describe('The device ID to retrieve'),
        }),
        execute: async (params) => {
          try {
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: `
                  query GetDevice($where: DeviceWhereInput) {
                    device(where: $where) {
                      id
                      name
                      additionalName
                      manufacturer
                      modelNumber
                      serialNumber
                      releaseYear
                      location
                      info
                      isFavorite
                      status
                      functionalStatus
                      lastPowerOnDate
                      hasOriginalBox
                      isAssetTagged
                      dateAcquired
                      whereAcquired
                      priceAcquired
                      estimatedValue
                      listPrice
                      soldPrice
                      soldDate
                      cpu
                      ram
                      graphics
                      storage
                      operatingSystem
                      isWifiEnabled
                      isPramBatteryRemoved
                      externalUrl
                      category {
                        id
                        name
                        type
                      }
                      tags {
                        name
                      }
                      notes {
                        content
                        date
                      }
                      maintenanceTasks {
                        label
                        dateCompleted
                        notes
                      }
                      images {
                        id
                      }
                    }
                  }
                `,
                variables: {
                  where: { id: params.deviceId },
                },
              }),
            });

            const data = await response.json();
            const device = data.data?.device;

            if (!device) {
              return { error: `Device with ID ${params.deviceId} not found` };
            }

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
              category: device.category,
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
              tags: device.tags?.map((t: any) => t.name) || [],
              notes: device.notes || [],
              maintenanceTasks: device.maintenanceTasks || [],
              imageCount: device.images?.length || 0,
            };
          } catch (error) {
            return { error: `Failed to get device details: ${error}` };
          }
        },
      }),

      list_devices: tool({
        description: 'List all devices with flexible field selection. Use this when you need specific fields not available in search_devices, or when you need to manually sort/filter by fields not supported by search_devices sorting (e.g., hasOriginalBox, isPramBatteryRemoved, etc.).',
        parameters: z.object({
          status: z.enum(['AVAILABLE', 'FOR_SALE', 'PENDING_SALE', 'SOLD', 'DONATED']).optional().describe('Filter by device status'),
          functionalStatus: z.enum(['YES', 'PARTIAL', 'NO']).optional().describe('Filter by whether the device is functional'),
          categoryType: z.enum(['COMPUTER', 'PERIPHERAL', 'ACCESSORY', 'OTHER']).optional().describe('Filter by category type'),
          fields: z.array(z.string()).optional().describe('Array of field names to include. Available: id, name, additionalName, manufacturer, modelNumber, serialNumber, releaseYear, location, info, isFavorite, status, functionalStatus, hasOriginalBox, isAssetTagged, dateAcquired, whereAcquired, priceAcquired, estimatedValue, listPrice, soldPrice, soldDate, cpu, ram, graphics, storage, operatingSystem, isWifiEnabled, isPramBatteryRemoved, lastPowerOnDate, externalUrl, category, tags, notes, maintenanceTasks'),
          limit: z.number().optional().describe('Maximum number of results (default 100)'),
        }),
        execute: async (params) => {
          try {
            // Build field list for GraphQL query
            const fields = params.fields || ['id', 'name', 'manufacturer', 'modelNumber', 'releaseYear', 'status', 'functionalStatus'];
            
            // Build GraphQL query dynamically based on requested fields
            const fieldMapping: Record<string, string> = {
              id: 'id',
              name: 'name',
              additionalName: 'additionalName',
              manufacturer: 'manufacturer',
              modelNumber: 'modelNumber',
              serialNumber: 'serialNumber',
              releaseYear: 'releaseYear',
              location: 'location',
              info: 'info',
              isFavorite: 'isFavorite',
              status: 'status',
              functionalStatus: 'functionalStatus',
              hasOriginalBox: 'hasOriginalBox',
              isAssetTagged: 'isAssetTagged',
              dateAcquired: 'dateAcquired',
              whereAcquired: 'whereAcquired',
              priceAcquired: 'priceAcquired',
              estimatedValue: 'estimatedValue',
              listPrice: 'listPrice',
              soldPrice: 'soldPrice',
              soldDate: 'soldDate',
              cpu: 'cpu',
              ram: 'ram',
              graphics: 'graphics',
              storage: 'storage',
              operatingSystem: 'operatingSystem',
              isWifiEnabled: 'isWifiEnabled',
              isPramBatteryRemoved: 'isPramBatteryRemoved',
              lastPowerOnDate: 'lastPowerOnDate',
              externalUrl: 'externalUrl',
            };

            const graphqlFields = fields
              .filter(f => fieldMapping[f])
              .map(f => fieldMapping[f])
              .join('\n                      ');

            const includeCategory = fields.includes('category');
            const includeTags = fields.includes('tags');
            const includeNotes = fields.includes('notes');
            const includeMaintenanceTasks = fields.includes('maintenanceTasks');

            const response = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: `
                  query ListDevices($where: DeviceWhereInput) {
                    devices(where: $where) {
                      ${graphqlFields}
                      ${includeCategory ? 'category { id name type }' : ''}
                      ${includeTags ? 'tags { name }' : ''}
                      ${includeNotes ? 'notes { content date }' : ''}
                      ${includeMaintenanceTasks ? 'maintenanceTasks { label dateCompleted notes }' : ''}
                    }
                  }
                `,
                variables: {
                  where: {
                    deleted: { equals: false },
                    ...(params.status && { status: { equals: params.status } }),
                    ...(params.functionalStatus && { functionalStatus: { equals: params.functionalStatus } }),
                    ...(params.categoryType && { category: { type: { equals: params.categoryType } } }),
                  },
                },
              }),
            });

            const data = await response.json();
            let devices = data.data?.devices || [];

            // Limit results
            const limit = Math.min(params.limit || 100, 200);
            devices = devices.slice(0, limit);

            // Format results - only include requested fields
            const results = devices.map((d: any) => {
              const device: any = {};
              fields.forEach(field => {
                if (field === 'category' && d.category) {
                  device.category = d.category;
                } else if (field === 'tags' && d.tags) {
                  device.tags = d.tags.map((t: any) => t.name);
                } else if (field === 'notes' && d.notes) {
                  device.notes = d.notes;
                } else if (field === 'maintenanceTasks' && d.maintenanceTasks) {
                  device.maintenanceTasks = d.maintenanceTasks;
                } else if (d[field] !== undefined) {
                  // Convert decimal fields to numbers
                  if (['priceAcquired', 'estimatedValue', 'listPrice', 'soldPrice'].includes(field)) {
                    device[field] = decimalToNumber(d[field]);
                  } else {
                    device[field] = d[field];
                  }
                }
              });
              return device;
            });

            return {
              count: results.length,
              devices: results,
            };
          } catch (error) {
            return { error: `Failed to list devices: ${error}` };
          }
        },
      }),

      get_financial_summary: tool({
        description: 'Get financial overview of the collection including total spent, total received from sales, net cash position, estimated value of owned items, and total profit.',
        parameters: z.object({}),
        execute: async () => {
          try {
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: `
                  query FinancialOverview {
                    financialOverview {
                      totalSpent
                      totalReceived
                      netCash
                      estimatedValueOwned
                      netPosition
                      totalProfit
                    }
                    systemUsage {
                      deviceCount
                    }
                  }
                `,
              }),
            });

            const data = await response.json();
            const overview = data.data?.financialOverview;
            const usage = data.data?.systemUsage;

            if (!overview) {
              return { error: 'Failed to retrieve financial overview' };
            }

            return {
              totalSpent: decimalToNumber(overview.totalSpent),
              totalReceived: decimalToNumber(overview.totalReceived),
              netCash: decimalToNumber(overview.netCash),
              estimatedValueOwned: decimalToNumber(overview.estimatedValueOwned),
              netPosition: decimalToNumber(overview.netPosition),
              totalProfit: decimalToNumber(overview.totalProfit),
              totalDevices: usage?.deviceCount || 0,
            };
          } catch (error) {
            return { error: `Failed to get financial summary: ${error}` };
          }
        },
      }),
    },
    maxSteps: 5,
    onError: (error) => {
      console.error('[Chat API] streamText error:', error);
    },
  });

  console.log('[Chat API] Returning stream response...');
  return result.toDataStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);
    console.error('[Chat API] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[Chat API] Error message:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ error: 'An error occurred processing your request', details: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
