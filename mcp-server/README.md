# MCP Server with MoroJS

A comprehensive example of building a Model Context Protocol (MCP) server using the MoroJS framework with enterprise-grade modular architecture. This example demonstrates how to create AI-accessible tools, resources, and prompts using modern TypeScript and proven architectural patterns.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for AI models to interact with external tools and data sources. Think of it as "the USB-C of AI" - it provides a universal interface for AI agents to:

- **Execute Tools**: Call functions with parameters (like API endpoints)
- **Access Resources**: Read data from various sources (like databases or files)
- **Use Prompts**: Get templated instructions for specific tasks

## Quick Start

```bash
# Install dependencies
npm install

# Run in MCP mode (for AI agents)
npm run build
npm start

# Run in HTTP debug mode
npm run dev http
```

## Features Demonstrated

This example showcases enterprise-grade MCP integration:

### **MCP Tools** (Executable Functions)
- **Task Management**: Create, read, update, delete tasks
- **Weather Information**: Get weather data for various cities
- **System Monitoring**: Retrieve system performance metrics

### **MCP Resources** (Data Sources)
- **Task Lists**: All tasks, pending tasks, completed tasks
- **Weather Locations**: Available weather data cities
- **System Info**: Current system status and metrics

### **MCP Prompts** (AI Templates)
- **Task Analysis**: Generate insights about task management
- **Weather Advice**: Get clothing and activity recommendations
- **System Analysis**: Performance optimization suggestions

### **Enterprise Architecture**
- **Modular Design**: Clean separation of business domains
- **Type Safety**: Full TypeScript with Zod validation
- **Dual Transport**: stdio for AI agents, HTTP for debugging
- **Event-Driven**: Inter-module communication patterns

## Available Tools

### Task Management
```javascript
// Create a new task
{
  "name": "create-task",
  "arguments": {
    "title": "Learn MCP Protocol",
    "description": "Understand how AI agents work",
    "priority": "high"
  }
}

// List all tasks (with optional filtering)
{
  "name": "list-tasks",
  "arguments": {
    "completed": false,
    "priority": "high"
  }
}

// Update existing task
{
  "name": "update-task", 
  "arguments": {
    "id": "task-uuid",
    "completed": true
  }
}
```

### Weather Information
```javascript
// Get weather for a city
{
  "name": "get-weather",
  "arguments": {
    "location": "New York",
    "units": "celsius",
    "includeforecast": true
  }
}
```

### System Monitoring
```javascript
// Get system information
{
  "name": "get-system-info",
  "arguments": {
    "command": "memory" // or "uptime", "load", "all"
  }
}
```

## Available Resources

Access read-only data through these URIs:

- `tasks://all` - All tasks in the system
- `tasks://pending` - Uncompleted tasks only
- `tasks://completed` - Completed tasks only
- `weather://locations` - Available weather cities
- `system://info` - Current system status

## Available Prompts

Get AI-optimized prompts for:

- `task-summary` - Analyze task management patterns
- `weather-advice` - Get weather-based recommendations
- `system-analysis` - System performance insights

## Usage Modes

### 1. MCP Mode (AI Agent Integration)

```bash
npm run build
npm start
```

This starts the server with stdio transport, ready for AI agents like:
- Claude Desktop
- Cursor IDE
- Any MCP-compatible client

### 2. HTTP Debug Mode

```bash
npm run dev http
```

Starts an HTTP server at `http://localhost:3010` with debug endpoints:
- `GET /` - Server information
- `GET /api/tools` - List all tasks
- `GET /api/weather/:location` - Get weather data
- `GET /api/system` - Get system information

## Testing with Claude Desktop

1. **Build the server**:
   ```bash
   npm run build
   ```

2. **Configure Claude Desktop** by editing `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "moro-mcp-server": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-server/dist/server.js"]
       }
     }
   }
   ```

3. **Restart Claude Desktop** and look for the hammer icon indicating available tools

4. **Test with prompts** like:
   - "Create a high-priority task for learning TypeScript"
   - "What's the weather like in Tokyo?"
   - "Show me my pending tasks"
   - "What advice do you have for visiting London based on the weather?"

## Testing with MCP Inspector

Use the official MCP Inspector for debugging:

```bash
npm run test:mcp
```

This opens a web interface where you can:
- View available tools, resources, and prompts
- Test tool calls with custom parameters
- Inspect raw MCP messages
- Debug connection issues

## Architecture

```
┌─────────────────────────────────────────────────────┐
│               Enterprise MCP Server                 │
├─────────────────┬───────────────────────────────────┤
│   MCP Core      │          HTTP Server              │
│  (AI Agents)    │         (Debug/Test)              │
├─────────────────┼───────────────────────────────────┤
│                 │                                   │
│ ┌─────────────┐ │  ┌─────────────────────────────┐  │
│ │MCP Protocol │ │  │    Module Routes            │  │
│ │ Handlers    │ │  │  /api/v1.0.0/tasks/        │  │
│ │ ┌─────────┐ │ │  │  /api/v1.0.0/weather/      │  │
│ │ │ Tools   │ │ │  │  /api/v1.0.0/system/       │  │
│ │ │Resources│ │ │  └─────────────────────────────┘  │
│ │ │ Prompts │ │ │                                   │
│ │ └─────────┘ │ │                                   │
│ └─────────────┘ │                                   │
└─────────────────┴───────────────────────────────────┘
            │
            ▼
    ┌─────────────────────────────────────────┐
    │           Business Modules              │
    ├─────────────┬─────────────┬─────────────┤
    │   Tasks     │   Weather   │   System    │
    │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
    │ │actions  │ │ │actions  │ │ │actions  │ │
    │ │routes   │ │ │routes   │ │ │routes   │ │
    │ │schemas  │ │ │schemas  │ │ │schemas  │ │
    │ │types    │ │ │types    │ │ │types    │ │
    │ │config   │ │ │config   │ │ │config   │ │
    │ └─────────┘ │ └─────────┘ │ └─────────┘ │
    └─────────────┴─────────────┴─────────────┘
```

## Key MoroJS Features Demonstrated

1. **Modular Architecture**: Clean separation of concerns with services
2. **Type Safety**: Full TypeScript support with Zod validation
3. **Dual Transport**: Both stdio (MCP) and HTTP serving
4. **Error Handling**: Comprehensive error management
5. **Scalable Patterns**: Enterprise-ready code organization

## Project Structure

```
mcp-server/
├── src/
│   ├── modules/           # Enterprise business modules
│   │   ├── tasks/         # Task management module
│   │   │   ├── actions.ts    # Pure business logic
│   │   │   ├── routes.ts     # HTTP endpoints
│   │   │   ├── schemas.ts    # Validation schemas
│   │   │   ├── types.ts      # Type definitions
│   │   │   ├── config.ts     # Module configuration
│   │   │   └── index.ts      # Module export
│   │   ├── weather/       # Weather information module
│   │   ├── system/        # System monitoring module
│   │   └── mcp-core/      # MCP protocol integration
│   │       ├── handlers.ts   # MCP request handlers
│   │       ├── config.ts     # MCP configuration
│   │       └── index.ts      # MCP module export
│   └── server.ts          # Main application entry point
├── dist/                  # Compiled JavaScript output
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts

- `npm run dev` - Development mode with watch
- `npm run dev http` - HTTP debug mode
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled server (MCP mode)
- `npm run test:mcp` - Test with MCP Inspector

## Extending the Server

### Adding New Tools

1. **Create the tool definition** in `setupMCPHandlers()`:
   ```javascript
   {
     name: 'my-new-tool',
     description: 'Description of what it does',
     inputSchema: {
       type: 'object',
       properties: {
         param1: { type: 'string', description: 'Parameter description' }
       },
       required: ['param1']
     }
   }
   ```

2. **Add the tool handler** in the `CallToolRequestSchema` handler:
   ```javascript
   case 'my-new-tool':
     // Your implementation here
     return {
       content: [{ type: 'text', text: 'Result' }]
     };
   ```

### Adding New Resources

1. **Add resource definition** in `ListResourcesRequestSchema` handler
2. **Add resource reader** in `ReadResourceRequestSchema` handler

### Adding New Prompts

1. **Add prompt definition** in `ListPromptsRequestSchema` handler
2. **Add prompt generator** in `GetPromptRequestSchema` handler

## Benefits of This Approach

### For AI Development
- **Standardized Interface**: Works with any MCP-compatible AI client
- **Type Safety**: Prevents runtime errors with TypeScript + Zod
- **Discoverable**: AI agents can explore available capabilities automatically

### For Development
- **Debuggable**: HTTP mode allows easy testing without AI clients
- **Scalable**: Clean architecture supports complex business logic
- **Maintainable**: Clear separation between MCP protocol and business logic

### For Production
- **Enterprise Ready**: Built with MoroJS production patterns
- **Error Handling**: Comprehensive error management and logging
- **Monitoring**: System information tools for operational insight

## Integration Examples

### With Claude Desktop
Perfect for enhancing Claude with custom tools and data access.

### With Cursor IDE  
Extend your development environment with project-specific tools.

### With Custom AI Agents
Build specialized AI assistants with domain-specific capabilities.

## Learning Path

1. **Start Here**: Run the example and test with HTTP mode
2. **Explore Tools**: Try each tool via the debug endpoints
3. **Test with AI**: Set up Claude Desktop integration
4. **Extend**: Add your own tools, resources, or prompts
5. **Deploy**: Use in production with proper error handling

## Contributing

This example is part of the MoroJS Examples collection. Contributions are welcome!

- Report issues with the MCP integration
- Suggest new tool examples
- Improve documentation
- Add test cases

## Related Examples

- [Simple API](../simple-api/) - Basic MoroJS patterns
- [Enterprise App](../enterprise-app/) - Advanced architecture
- [Real-time Chat](../real-time-chat/) - WebSocket integration
- [Microservices](../microservice/) - Distributed systems

## External Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Claude Desktop MCP Setup](https://claude.ai/chat)
- [MoroJS Documentation](https://github.com/morojs/moro)

---

**Built with MoroJS and the Model Context Protocol** 