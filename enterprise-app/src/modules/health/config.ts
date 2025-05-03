// Health Configuration - Pure Settings
export const config = {
  cache: { 
    ttl: 30  // Health status cached for 30 seconds
  },
  rateLimit: { 
    requests: 1000,  // High rate limit for health checks
    window: 60000 
  },
  metadata: {
    description: 'System health monitoring and status checks',
    author: 'MoroJS Team',
    tags: ['health', 'monitoring', 'status']
  }
}; 