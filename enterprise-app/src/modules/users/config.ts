// User Configuration - Pure Settings
export const config = {
  cache: {
    ttl: 600, // Users cache longer than todos
  },
  rateLimit: {
    requests: 100,
    window: 60000,
  },
  database: {
    path: './database',
  },
  permissions: ['user:read', 'user:write', 'user:admin'],
  metadata: {
    description: 'User management with authentication and roles',
    author: 'MoroJS Team',
    tags: ['users', 'auth', 'roles'],
  },
};
