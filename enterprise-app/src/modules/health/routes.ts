// Health Routes - HTTP Handlers with Intelligent Routing
import { 
  getHealthStatus, 
  getSimpleHealth 
} from './actions';

export const routes = [
  {
    method: 'GET' as const,
    path: '/',
    cache: { ttl: 30 },
    rateLimit: { requests: 1000, window: 60000 },
    description: 'Basic health check',
    tags: ['health', 'system'],
    handler: async (req: any, res: any) => {
      const health = await getSimpleHealth();
      return health;
    }
  },
  {
    method: 'GET' as const,
    path: '/detailed',
    cache: { ttl: 10 }, // Shorter cache for detailed health
    rateLimit: { requests: 500, window: 60000 },
    description: 'Detailed health check with system metrics',
    tags: ['health', 'system', 'detailed'],
    handler: async (req: any, res: any) => {
      const health = await getHealthStatus();
      
      // Set appropriate status code based on health
      if (health.status === 'unhealthy') {
        res.status(503);
        return health;
      } else if (health.status === 'degraded') {
        res.status(200);
        return health;
      } else {
        return health;
      }
    }
  }
]; 