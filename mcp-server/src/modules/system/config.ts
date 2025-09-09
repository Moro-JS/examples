// System Configuration - Pure Settings
export const config = {
  cache: {
    ttl: 60  // Cache system info for 1 minute
  },
  rateLimit: {
    requests: 30,
    window: 60000  // 30 requests per minute
  },
  database: {
    path: './database'
  },
  mcp: {
    tools: [
      'get-system-info'
    ],
    resources: [
      'system://info'
    ],
    prompts: [
      'system-analysis'
    ]
  },
  metadata: {
    description: 'System monitoring and information service',
    author: 'MoroJS Team',
    tags: ['system', 'monitoring', 'performance', 'mcp']
  }
}; 