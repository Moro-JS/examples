// Order Configuration - Pure Settings
export const config = {
  cache: { 
    ttl: 180  // Orders cache for 3 minutes
  },
  rateLimit: { 
    requests: 50, 
    window: 60000 
  },
  database: {
    path: './database'
  },
  permissions: ['order:read', 'order:write', 'order:admin'],
  metadata: {
    description: 'Order management and processing system',
    author: 'MoroJS Team',
    tags: ['orders', 'ecommerce', 'payments']
  }
}; 