
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
    const body = await req.json();
    const authHeader = req.headers.get('authorization') || '';

    // Accept either a messages array (conversation history) or a bare message string
    const messages: { role: 'user' | 'assistant'; content: string }[] =
      body.messages ?? [{ role: 'user', content: body.message }];

    if (!messages.length || !messages[messages.length - 1]?.content) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await generateText({
      model: anthropic('claude-sonnet-4-6'),
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
- For detailed information about a specific device (including purchase price, notes, maintenance history), use get_device_details with the device ID from search results
- Unless specifically noted, exclude sold items from results when being asked about the collection

DEVICE IDENTIFICATION:
- ALWAYS include the additionalName field when referencing devices, as there are duplicates and the additionalName differentiates them
- When mentioning a device, use both name and additionalName (e.g., "Macintosh SE (30MB HD)" not just "Macintosh SE")

IMPORTANT: When users ask for superlatives (most/least valuable, oldest/newest, etc.), always use the sortBy and sortOrder parameters:
- Most valuable: sortBy='estimatedValue', sortOrder='desc', limit=1
- Least valuable: sortBy='estimatedValue', sortOrder='asc', limit=1
- Oldest: sortBy='releaseYear', sortOrder='asc', limit=1
- Newest: sortBy='releaseYear', sortOrder='desc', limit=1
- Recently acquired: sortBy='dateAcquired', sortOrder='desc', limit=1

MAKING CHANGES:
- You can update devices, add notes, and log maintenance logs using the write tools
- Always search for the device first to confirm the correct ID before making changes
- For high-impact changes (marking as SOLD, changing estimated value), briefly state what you're about to do, then call the tool
- After making a change, confirm what was updated (e.g., "Done! Logged today as the last power-on date for your Mac 512k")
- For "I just sold X for $Y": set status=SOLD, soldPrice=Y, soldDate=today's ISO date
- For "I powered on X today": set lastPowerOnDate=today's ISO date
- For maintenance logs: use a descriptive label (e.g., "Recap analog board", "Replaced PRAM battery")
- Today's date in ISO format: ${new Date().toISOString()}

Be enthusiastic about vintage computing while staying concise and helpful!`,
      messages,
      tools: {
        search_devices: tool({
          description: 'Search the vintage computer collection. Can filter by text query, status, category type, functional status, manufacturer, and tags. Can sort results by various fields.',
          parameters: z.object({
            query: z.string().optional().describe('Text to search for in device name, manufacturer, model, CPU, info, notes, and tags'),
            status: z.enum(['COLLECTION', 'FOR_SALE', 'PENDING_SALE', 'SOLD', 'DONATED']).optional().describe('Filter by device status'),
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
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authHeader && { 'Authorization': authHeader }),
                },
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
                        location {
                          id
                          name
                        }
                        estimatedValue
                        listPrice
                        soldPrice
                        priceAcquired
                        whereAcquired
                        dateAcquired
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

              // Apply filters and sorting (same logic as streaming endpoint)
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
                    device.location?.name,
                    ...(device.tags?.map((t: any) => t.name) || []),
                  ].filter(Boolean).join(' ').toLowerCase();
                  return searchableText.includes(query);
                });
              }

              if (params.manufacturer) {
                const mfr = params.manufacturer.toLowerCase();
                devices = devices.filter((d: any) => 
                  d.manufacturer?.toLowerCase().includes(mfr)
                );
              }

              if (params.tagName) {
                const tag = params.tagName.toLowerCase();
                devices = devices.filter((d: any) => 
                  d.tags?.some((t: any) => t.name.toLowerCase().includes(tag))
                );
              }

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

              const limit = Math.min(params.limit || 20, 100);
              devices = devices.slice(0, limit);

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
                location: d.location?.name ?? null,
                estimatedValue: decimalToNumber(d.estimatedValue),
                listPrice: decimalToNumber(d.listPrice),
                soldPrice: decimalToNumber(d.soldPrice),
                priceAcquired: decimalToNumber(d.priceAcquired),
                whereAcquired: d.whereAcquired,
                dateAcquired: d.dateAcquired,
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
          description: 'Get full details for a specific device by ID, including all specs, notes, maintenance logs, and financial info.',
          parameters: z.object({
            deviceId: z.number().describe('The device ID to retrieve'),
          }),
          execute: async (params) => {
            try {
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authHeader && { 'Authorization': authHeader }),
                },
                body: JSON.stringify({
                  query: `
                    query GetDevice($where: DeviceWhereInput) {
                      device(where: $where) {
                        id name additionalName manufacturer modelNumber serialNumber
                        releaseYear location { id name } info isFavorite status functionalStatus
                        lastPowerOnDate hasOriginalBox isAssetTagged
                        dateAcquired whereAcquired priceAcquired
                        estimatedValue listPrice soldPrice soldDate
                        cpu ram graphics storage operatingSystem
                        isWifiEnabled isPramBatteryRemoved externalUrl
                        category { id name type }
                        tags { name }
                        notes { content date }
                        maintenanceTasks { label dateCompleted notes cost }
                        images { id }
                      }
                    }
                  `,
                  variables: { where: { id: params.deviceId } },
                }),
              });

              const data = await response.json();
              const device = data.data?.device;
              if (!device) return { error: `Device ${params.deviceId} not found` };

              return {
                id: device.id,
                name: device.name,
                additionalName: device.additionalName,
                manufacturer: device.manufacturer,
                modelNumber: device.modelNumber,
                serialNumber: device.serialNumber,
                releaseYear: device.releaseYear,
                location: device.location?.name ?? null,
                info: device.info,
                isFavorite: device.isFavorite,
                status: device.status,
                functionalStatus: device.functionalStatus,
                lastPowerOnDate: device.lastPowerOnDate,
                hasOriginalBox: device.hasOriginalBox,
                isAssetTagged: device.isAssetTagged,
                category: device.category,
                specs: {
                  cpu: device.cpu, ram: device.ram, graphics: device.graphics,
                  storage: device.storage, operatingSystem: device.operatingSystem,
                  isWifiEnabled: device.isWifiEnabled, isPramBatteryRemoved: device.isPramBatteryRemoved,
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

        get_financial_summary: tool({
          description: 'Get financial overview of the collection including total spent, total received from sales, net cash position, estimated value of owned items, and total profit.',
          parameters: z.object({}),
          execute: async () => {
            try {
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authHeader && { 'Authorization': authHeader }),
                },
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

        update_device: tool({
          description: 'Update a device in the collection. Use for logging power-ons, updating estimated value, marking as sold, changing status, updating functional status, or changing location.',
          parameters: z.object({
            deviceId: z.number().describe('The device ID to update'),
            lastPowerOnDate: z.string().optional().describe('ISO date string for when the device was last powered on (e.g., "2026-03-30T00:00:00.000Z")'),
            estimatedValue: z.number().optional().describe('Updated estimated value in dollars'),
            status: z.enum(['COLLECTION', 'FOR_SALE', 'PENDING_SALE', 'SOLD', 'DONATED', 'IN_REPAIR', 'RETURNED']).optional().describe('New device status'),
            soldPrice: z.number().optional().describe('Price the device was sold for'),
            soldDate: z.string().optional().describe('ISO date string for when the device was sold'),
            listPrice: z.number().optional().describe('Asking price for devices listed for sale'),
            functionalStatus: z.enum(['YES', 'PARTIAL', 'NO']).optional().describe('Updated functional status'),
          }),
          execute: async (params) => {
            try {
              const input: any = { id: params.deviceId };
              if (params.lastPowerOnDate !== undefined) input.lastPowerOnDate = params.lastPowerOnDate;
              if (params.estimatedValue !== undefined) input.estimatedValue = params.estimatedValue;
              if (params.status !== undefined) input.status = params.status;
              if (params.soldPrice !== undefined) input.soldPrice = params.soldPrice;
              if (params.soldDate !== undefined) input.soldDate = params.soldDate;
              if (params.listPrice !== undefined) input.listPrice = params.listPrice;
              if (params.functionalStatus !== undefined) input.functionalStatus = params.functionalStatus;

              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authHeader && { 'Authorization': authHeader }),
                },
                body: JSON.stringify({
                  query: `
                    mutation UpdateDevice($input: DeviceUpdateInput!) {
                      updateDevice(input: $input) {
                        id name additionalName lastPowerOnDate estimatedValue
                        status soldPrice soldDate listPrice functionalStatus
                        location { id name }
                      }
                    }
                  `,
                  variables: { input },
                }),
              });

              const data = await response.json();
              if (data.errors) {
                return { error: `Failed to update device: ${data.errors[0]?.message}` };
              }
              const device = data.data?.updateDevice;
              if (!device) return { error: 'Update failed — no device returned' };

              return {
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
                  location: device.location?.name ?? null,
                },
              };
            } catch (error) {
              return { error: `Failed to update device: ${error}` };
            }
          },
        }),

        add_note: tool({
          description: 'Add a note to a device. Use for recording observations, work done, provenance info, or any free-form notes about a device.',
          parameters: z.object({
            deviceId: z.number().describe('The device ID to add a note to'),
            content: z.string().describe('The note content'),
          }),
          execute: async (params) => {
            try {
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authHeader && { 'Authorization': authHeader }),
                },
                body: JSON.stringify({
                  query: `
                    mutation CreateNote($input: NoteCreateInput!) {
                      createNote(input: $input) { id content date }
                    }
                  `,
                  variables: {
                    input: {
                      deviceId: params.deviceId,
                      content: params.content,
                      date: new Date().toISOString(),
                    },
                  },
                }),
              });

              const data = await response.json();
              if (data.errors) {
                return { error: `Failed to add note: ${data.errors[0]?.message}` };
              }
              const note = data.data?.createNote;
              if (!note) return { error: 'Add note failed — no note returned' };

              return { success: true, noteId: note.id, content: note.content, date: note.date };
            } catch (error) {
              return { error: `Failed to add note: ${error}` };
            }
          },
        }),

        add_maintenance_task: tool({
          description: 'Log a completed maintenance task for a device. Use for recording repairs, recaps, cleaning, part replacements, etc.',
          parameters: z.object({
            deviceId: z.number().describe('The device ID'),
            label: z.string().describe('Short description of the task (e.g., "Recap analog board", "Replaced PRAM battery", "Screen cleaning")'),
            dateCompleted: z.string().describe('ISO date string for when the task was completed (e.g., "2026-03-30T00:00:00.000Z")'),
            notes: z.string().optional().describe('Additional notes about the task'),
            cost: z.number().optional().describe('Cost of the task in dollars (parts, labor, etc.)'),
          }),
          execute: async (params) => {
            try {
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(authHeader && { 'Authorization': authHeader }),
                },
                body: JSON.stringify({
                  query: `
                    mutation CreateMaintenanceTask($input: MaintenanceTaskCreateInput!) {
                      createMaintenanceTask(input: $input) { id label dateCompleted notes cost }
                    }
                  `,
                  variables: {
                    input: {
                      deviceId: params.deviceId,
                      label: params.label,
                      dateCompleted: params.dateCompleted,
                      ...(params.notes !== undefined && { notes: params.notes }),
                      ...(params.cost !== undefined && { cost: params.cost }),
                    },
                  },
                }),
              });

              const data = await response.json();
              if (data.errors) {
                return { error: `Failed to add maintenance task: ${data.errors[0]?.message}` };
              }
              const task = data.data?.createMaintenanceTask;
              if (!task) return { error: 'Add maintenance task failed — no task returned' };

              return {
                success: true,
                taskId: task.id,
                label: task.label,
                dateCompleted: task.dateCompleted,
                notes: task.notes,
                cost: task.cost ? decimalToNumber(task.cost) : null,
              };
            } catch (error) {
              return { error: `Failed to add maintenance task: ${error}` };
            }
          },
        }),
      },
      maxSteps: 8,
    });

    return new Response(JSON.stringify({ response: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Chat Simple API] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred processing your request', 
      details: error instanceof Error ? error.message : String(error) 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
