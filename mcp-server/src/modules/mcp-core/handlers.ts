// MCP Protocol Handlers - Integration with Business Modules
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import module actions
import * as taskActions from '../tasks/actions';
import * as weatherActions from '../weather/actions';
import * as systemActions from '../system/actions';

export function setupMCPHandlers(mcpServer: Server, context: { database: any; events: any }) {
  const { database, events } = context;

  // TOOLS HANDLERS
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        // Task Tools
        {
          name: 'create-task',
          description: 'Create a new task with title, description, and priority',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              description: { type: 'string', description: 'Task description (optional)' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Task priority' }
            },
            required: ['title']
          }
        },
        {
          name: 'list-tasks',
          description: 'List all tasks or filter by completion status or priority',
          inputSchema: {
            type: 'object',
            properties: {
              completed: { type: 'boolean', description: 'Filter by completion status (optional)' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Filter by priority (optional)' }
            }
          }
        },
        {
          name: 'update-task',
          description: 'Update an existing task by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Task ID' },
              title: { type: 'string', description: 'New title (optional)' },
              description: { type: 'string', description: 'New description (optional)' },
              completed: { type: 'boolean', description: 'Completion status (optional)' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'New priority (optional)' }
            },
            required: ['id']
          }
        },
        {
          name: 'delete-task',
          description: 'Delete a task by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Task ID to delete' }
            },
            required: ['id']
          }
        },
        // Weather Tools
        {
          name: 'get-weather',
          description: 'Get current weather and forecast for a location',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'City name or location' },
              units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature units' },
              includeForecast: { type: 'boolean', description: 'Include 5-day forecast' }
            },
            required: ['location']
          }
        },
        // System Tools
        {
          name: 'get-system-info',
          description: 'Get system information including memory, CPU, and load',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', enum: ['memory', 'uptime', 'load', 'cpu', 'all'], description: 'Type of info to retrieve' }
            }
          }
        }
      ]
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    if (!args) {
      throw new Error('Tool arguments are required');
    }

    try {
      switch (name) {
        // Task Tools
        case 'create-task':
          const newTask = await taskActions.createTask({
            title: args.title as string,
            description: (args.description as string) || '',
            priority: (args.priority as 'low' | 'medium' | 'high') || 'medium'
          }, database, events);
          return {
            content: [{ type: 'text', text: `Created task: ${newTask.title} (ID: ${newTask.id})` }]
          };

        case 'list-tasks':
          const filters = {
            completed: args.completed as boolean | undefined,
            priority: args.priority as 'low' | 'medium' | 'high' | undefined,
            limit: (args.limit as number) || 10
          };
          const tasks = await taskActions.getTasksWithFilters(filters, database);
          return {
            content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }]
          };

        case 'update-task':
          const updatedTask = await taskActions.updateTask(args.id as string, {
            title: args.title as string | undefined,
            description: args.description as string | undefined,
            completed: args.completed as boolean | undefined,
            priority: args.priority as 'low' | 'medium' | 'high' | undefined
          }, database, events);
          return {
            content: [{
              type: 'text',
              text: updatedTask ? `Updated task: ${updatedTask.title}` : `Task with ID ${args.id as string} not found`
            }]
          };

        case 'delete-task':
          const deleted = await taskActions.deleteTask(args.id as string, database, events);
          return {
            content: [{
              type: 'text',
              text: deleted ? `Deleted task with ID: ${args.id as string}` : `Task with ID ${args.id as string} not found`
            }]
          };

        // Weather Tools
        case 'get-weather':
          const weather = await weatherActions.getWeather({
            location: args.location as string,
            units: (args.units as 'celsius' | 'fahrenheit') || 'celsius',
            includeForecast: (args.includeForecast as boolean) !== false
          }, database);
          return {
            content: [{
              type: 'text',
              text: weather ? JSON.stringify(weather, null, 2) : `Weather data not available for: ${args.location as string}`
            }]
          };

        // System Tools
        case 'get-system-info':
          let systemInfo;
          switch ((args.command as string) || 'all') {
            case 'memory':
              systemInfo = await systemActions.getMemoryInfo(database);
              break;
            case 'uptime':
              systemInfo = await systemActions.getUptimeInfo(database);
              break;
            case 'load':
              systemInfo = await systemActions.getLoadAverageInfo(database);
              break;
            case 'cpu':
              systemInfo = await systemActions.getCpuInfo(database);
              break;
            case 'all':
            default:
              systemInfo = await systemActions.getSystemInfo(database);
              break;
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(systemInfo, null, 2) }]
          };

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  });

  // RESOURCES HANDLERS
  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        // Task Resources
        {
          uri: 'tasks://all',
          name: 'All Tasks',
          description: 'Complete list of all tasks in the system',
          mimeType: 'application/json'
        },
        {
          uri: 'tasks://pending',
          name: 'Pending Tasks',
          description: 'List of uncompleted tasks',
          mimeType: 'application/json'
        },
        {
          uri: 'tasks://completed',
          name: 'Completed Tasks',
          description: 'List of completed tasks',
          mimeType: 'application/json'
        },
        // Weather Resources
        {
          uri: 'weather://locations',
          name: 'Available Weather Locations',
          description: 'List of cities with available weather data',
          mimeType: 'application/json'
        },
        // System Resources
        {
          uri: 'system://info',
          name: 'System Information',
          description: 'Current system status and information',
          mimeType: 'application/json'
        }
      ]
    };
  });

  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      switch (uri) {
        // Task Resources
        case 'tasks://all':
          const allTasks = await taskActions.getAllTasks(database);
          return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(allTasks, null, 2) }]
          };

        case 'tasks://pending':
          const pendingTasks = await taskActions.getPendingTasks(database);
          return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(pendingTasks, null, 2) }]
          };

        case 'tasks://completed':
          const completedTasks = await taskActions.getCompletedTasks(database);
          return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(completedTasks, null, 2) }]
          };

        // Weather Resources
        case 'weather://locations':
          const locations = await weatherActions.getAvailableLocations(database);
          return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(locations, null, 2) }]
          };

        // System Resources
        case 'system://info':
          const sysInfo = await systemActions.getSystemInfo(database);
          return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(sysInfo, null, 2) }]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Error reading resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  // PROMPTS HANDLERS
  mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'task-summary',
          description: 'Generate a summary of tasks by priority and completion status',
          arguments: [
            {
              name: 'focus',
              description: 'Focus area: "priority", "completion", or "overview"',
              required: false
            }
          ]
        },
        {
          name: 'weather-advice',
          description: 'Get travel and clothing advice based on weather conditions',
          arguments: [
            {
              name: 'location',
              description: 'City or location name',
              required: true
            },
            {
              name: 'activity',
              description: 'Planned activity (e.g., "work", "outdoor", "travel")',
              required: false
            }
          ]
        },
        {
          name: 'system-analysis',
          description: 'Analyze system performance and provide recommendations',
          arguments: [
            {
              name: 'focus',
              description: 'Analysis focus: "performance", "memory", or "general"',
              required: false
            }
          ]
        }
      ]
    };
  });

  mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'task-summary':
          const focus = args?.focus || 'overview';
          const allTasks = await taskActions.getAllTasks(database);
          const taskData = {
            total: allTasks.length,
            completed: (await taskActions.getCompletedTasks(database)).length,
            pending: (await taskActions.getPendingTasks(database)).length,
            priorities: {
              high: (await taskActions.getTasksByPriority('high', database)).length,
              medium: (await taskActions.getTasksByPriority('medium', database)).length,
              low: (await taskActions.getTasksByPriority('low', database)).length
            }
          };

          return {
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: `Please analyze the following task data with focus on "${focus}":\n\n${JSON.stringify(taskData, null, 2)}\n\nProvide insights and recommendations for task management.`
              }
            }]
          };

        case 'weather-advice':
          const location = args?.location;
          const activity = args?.activity || 'general';
          
          if (!location) {
            throw new Error('Location is required for weather advice');
          }

          const weather = await weatherActions.getWeather({ location }, database);
          
          return {
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: `Based on the weather data for ${location} and planned activity "${activity}":\n\n${JSON.stringify(weather, null, 2)}\n\nProvide practical advice for clothing, activities, and any weather-related precautions.`
              }
            }]
          };

        case 'system-analysis':
          const analysisFocus = args?.focus || 'general';
          const systemInfo = await systemActions.getSystemInfo(database);
          
          return {
            messages: [{
              role: 'user',
              content: {
                type: 'text',
                text: `Analyze the following system information with focus on "${analysisFocus}":\n\n${JSON.stringify(systemInfo, null, 2)}\n\nProvide performance insights, potential issues, and optimization recommendations.`
              }
            }]
          };

        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    } catch (error) {
      throw new Error(`Error generating prompt ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
} 