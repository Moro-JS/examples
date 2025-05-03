// Clean Architecture Demo - Proper Separation of Concerns
import { createApp, builtInMiddleware } from '@morojs/moro';

const app = createApp();

// Clean built-in cache middleware with adapter auto-loading
app.use(builtInMiddleware.cache({
  adapter: process.env.REDIS_URL ? 'redis' : 'memory',
  adapterOptions: process.env.REDIS_URL ? {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  } : undefined,
  
  strategies: {
    '^/api/users/': {
      key: (req) => `user:${req.params.id}:${req.headers['accept-language'] || 'en'}`,
      ttl: 1800,
      condition: (req, res) => req.method === 'GET'
    },
    '^/api/posts/': {
      key: (req) => `post:${req.path}:${JSON.stringify(req.query)}`,
      ttl: 600
    }
  },
  
  defaultTtl: 3600,
  keyPrefix: 'demo:',
  maxAge: 3600,
  vary: ['Accept-Language']
}));

// Clean built-in CDN middleware with adapter auto-loading
if (process.env.CLOUDFLARE_API_TOKEN) {
  app.use(builtInMiddleware.cdn({
    adapter: 'cloudflare',
    adapterOptions: {
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      zoneId: process.env.CLOUDFLARE_ZONE_ID
    },
    autoInvalidate: true,
    invalidationPatterns: ['^/api/admin/']
  }));
}

// Other built-in middleware
app.use(builtInMiddleware.cookie({ secret: 'demo-secret' }));
app.use(builtInMiddleware.csrf({ secret: 'csrf-secret' }));
app.use(builtInMiddleware.csp({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"]
  }
}));

// Demo routes
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  
  const user = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    language: req.headers['accept-language'] || 'en',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: user,
    cached: false,
    architecture: 'clean-separation'
  });
});

app.get('/api/posts', (req, res) => {
  const posts = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `Post ${i + 1}`,
    content: 'This is a sample post content.',
    author: `Author ${i + 1}`,
    createdAt: new Date().toISOString()
  }));
  
  res.json({
    success: true,
    data: posts,
    query: req.query,
    cached: false,
    architecture: 'clean-separation'
  });
});

app.post('/api/admin/clear-cache', async (req, res) => {
  // This route will auto-invalidate CDN if configured
  res.json({
    success: true,
    message: 'Admin action completed',
    timestamp: new Date().toISOString(),
    cdnInvalidated: !!process.env.CLOUDFLARE_API_TOKEN
  });
});

app.get('/architecture', (req, res) => {
  res.json({
    success: true,
    architecture: {
      types: 'Properly separated in /types/ folder',
      adapters: 'Pluggable implementations in /adapters/ folder',
      middleware: 'Clean built-in middleware with adapter auto-loading',
      benefits: [
        'Clean separation of concerns',
        'Auto-loading adapters by string name',
        'Memory cache as sensible default',
        'User-defined configuration',
        'Enterprise-ready scaling'
      ]
    },
    usage: {
      cache: {
        memory: "adapter: 'memory'",
        redis: "adapter: 'redis'",
        file: "adapter: 'file'",
        custom: "adapter: new CustomAdapter()"
      },
      cdn: {
        cloudflare: "adapter: 'cloudflare'",
        cloudfront: "adapter: 'cloudfront'",
        azure: "adapter: 'azure'",
        custom: "adapter: new CustomCDNAdapter()"
      }
    },
    structure: {
      '/types/cache.ts': 'Cache interfaces and types',
      '/types/cdn.ts': 'CDN interfaces and types',
      '/adapters/cache/': 'Cache storage implementations',
      '/adapters/cdn/': 'CDN provider implementations',
      '/built-in/cache.ts': 'Clean cache middleware',
      '/built-in/cdn.ts': 'Clean CDN middleware'
    }
  });
});

const PORT = parseInt(process.env.PORT || '3009');
app.listen(PORT, undefined, () => {
  console.log(`Clean Architecture Demo running on http://localhost:${PORT}`);
  console.log(`
Clean Architecture Features:

Types & Interfaces:
  /types/cache.ts - CacheAdapter, CacheOptions, CacheStrategy
  /types/cdn.ts   - CDNAdapter, CDNOptions, CDNStats

Pluggable Adapters:
  /adapters/cache/ - memory, redis, file + factory function
  /adapters/cdn/   - cloudflare, cloudfront, azure + factory function

Built-in Middleware:
  builtInMiddleware.cache() - Uses cache adapters
  builtInMiddleware.cdn()   - Uses CDN adapters

Auto-loading:
  adapter: 'redis'      - Automatically creates RedisCacheAdapter
  adapter: 'cloudflare' - Automatically creates CloudflareCDNAdapter

Sensible Defaults:
  No adapter specified? Falls back to memory cache
  No CDN configured? CDN features gracefully disabled

Test Endpoints:
  GET  /api/users/:id      - Cached user data (personalized by language)
  GET  /api/posts          - Cached posts with query params
  POST /api/admin/clear-cache - Admin action with CDN auto-invalidation
  GET  /architecture       - Architecture overview

Current Configuration:
  Cache: ${process.env.REDIS_URL ? 'Redis' : 'Memory (default)'}
  CDN:   ${process.env.CLOUDFLARE_API_TOKEN ? 'Cloudflare' : 'None (graceful degradation)'}
  `);
});

export default app; 