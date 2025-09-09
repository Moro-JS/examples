// MCP Server Utilities - Protocol Server Management
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './config';

export async function createMCPServer() {
  return new Server(
    {
      name: config.server.name,
      version: config.server.version,
    },
    {
      capabilities: {
        resources: config.capabilities.resources ? {} : undefined,
        tools: config.capabilities.tools ? {} : undefined,
        prompts: config.capabilities.prompts ? {} : undefined,
      },
    }
  );
}

export async function connectStdioTransport(mcpServer: Server) {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  return transport;
}
