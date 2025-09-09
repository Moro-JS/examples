// MCP Core Module - Model Context Protocol Integration
import { config } from './config';
import { defineModule } from '@morojs/moro';

export default defineModule({
  name: 'mcp-core',
  version: '1.0.0',
  config,
});

// Re-export MCP handlers and utilities
export * from './handlers';
export * from './server';
