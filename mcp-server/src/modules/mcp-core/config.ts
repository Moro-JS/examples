// MCP Core Configuration - Protocol Settings
export const config = {
  server: {
    name: 'moro-mcp-server',
    version: '1.0.0',
  },
  capabilities: {
    resources: true,
    tools: true,
    prompts: true,
  },
  transport: {
    stdio: true,
    http: true,
  },
  metadata: {
    description: 'Model Context Protocol server built with MoroJS',
    author: 'MoroJS Team',
    tags: ['mcp', 'ai', 'protocol', 'morojs'],
  },
};
