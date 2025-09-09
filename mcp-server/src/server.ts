#!/usr/bin/env node

// MCP Server with MoroJS - Enterprise Module Structure
import { createApp } from '@morojs/moro';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Import modules
import TasksModule from './modules/tasks';
import WeatherModule from './modules/weather';
import SystemModule from './modules/system';
import MCPCoreModule from './modules/mcp-core';

// Import MCP handlers
import { setupMCPHandlers } from './modules/mcp-core/handlers';

/**
 * Enterprise MCP Server built with MoroJS
 *
 * This implementation demonstrates:
 * - Modular architecture following enterprise patterns
 * - Clean separation between MCP protocol and business logic
 * - Dual transport support (stdio for AI agents, HTTP for debugging)
 * - Type-safe operations with comprehensive error handling
 */

async function createMCPServer() {
  // Create MoroJS app with enterprise configuration
  const app = createApp({
    cors: true,
    compression: true,
    helmet: true,
  });

  // Mock database for demonstration
  const mockDatabase = {
    tasks: [],
    weather: {},
    system: {},
  };

  // Register database and event system
  app.database(mockDatabase);

  // Enterprise middleware for logging
  app.use((req: any, res: any, next: () => void) => {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Load enterprise modules
  await app.loadModule(TasksModule);
  await app.loadModule(WeatherModule);
  await app.loadModule(SystemModule);
  await app.loadModule(MCPCoreModule);

  // Root endpoint
  app.get('/', (req, res) => {
    return {
      message: 'MoroJS MCP Server',
      description: 'Model Context Protocol server built with enterprise MoroJS architecture',
      version: '1.0.0',
      architecture: 'modular-enterprise',
      capabilities: ['tools', 'resources', 'prompts'],
      modules: ['tasks', 'weather', 'system', 'mcp-core'],
      endpoints: {
        tasks: '/api/v1.0.0/tasks/',
        weather: '/api/v1.0.0/weather/',
        system: '/api/v1.0.0/system/',
      },
      modes: {
        mcp: 'Default - Use with AI agents (Claude Desktop, etc.)',
        http: 'Debug mode - Use "npm run dev http" for HTTP debugging',
      },
    };
  });

  return app;
}

async function createMCPProtocolServer(context: { database: any; events: any }) {
  // Create MCP protocol server
  const mcpServer = new Server(
    {
      name: 'moro-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  // Setup MCP handlers with module integration
  setupMCPHandlers(mcpServer, context);

  return mcpServer;
}

async function startMCPMode() {
  console.error('Starting MoroJS MCP Server in MCP mode...');

  // Create context
  const context = {
    database: { tasks: [], weather: {}, system: {} },
    events: { emit: async (event: string, data: any) => console.error(`Event: ${event}`, data) },
  };

  // Create and start MCP server
  const mcpServer = await createMCPProtocolServer(context);
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  console.error('MCP Server connected via stdio transport');
  console.error('Server ready for AI agent connections');
}

async function startHTTPMode(port: number = 3010) {
  console.log('Starting MoroJS MCP Server in HTTP debug mode...');

  const app = await createMCPServer();

  app.listen(port, () => {
    console.log(`HTTP Debug Server running on http://localhost:${port}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  Root: http://localhost:${port}/`);
    console.log(`  Tasks: http://localhost:${port}/api/v1.0.0/tasks/`);
    console.log(`  Weather: http://localhost:${port}/api/v1.0.0/weather/`);
    console.log(`  System: http://localhost:${port}/api/v1.0.0/system/`);
    console.log('');
    console.log('Built with MoroJS Enterprise Architecture');
  });
}

// Main execution
async function main() {
  const mode = process.argv[2] || 'mcp';

  if (mode === 'http' || mode === 'debug') {
    // HTTP mode for debugging
    await startHTTPMode(3010);
  } else {
    // MCP mode (default) for AI agent integration
    await startMCPMode();
  }
}

// Error handling
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
