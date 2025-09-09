// Todo Configuration - Pure Settings
export const config = {
  cache: {
    ttl: 300,
  },
  rateLimit: {
    requests: 100,
    window: 60000,
  },
  database: {
    path: './database',
  },
  permissions: ['todo:read', 'todo:write'],
  metadata: {
    description: 'Todo management with real-time updates',
    author: 'MoroJS Team',
    tags: ['productivity', 'tasks', 'real-time'],
  },
};
