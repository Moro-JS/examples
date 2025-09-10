// Cloudflare Workers Runtime Example
import { createAppWorker } from '@morojs/moro';
import type { WorkersEnv, WorkersContext } from '@morojs/moro';

const app = createAppWorker();

// Define routes exactly the same way
app.get('/', (req: any, res: any) => {
  return {
    message: 'Hello from MoroJS on Cloudflare Workers!',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
    cf: req.headers['cf-ray']
      ? {
          ray: req.headers['cf-ray'],
          country: req.headers['cf-ipcountry'],
        }
      : null,
  };
});

app.get('/health', (req: any, res: any) => {
  return {
    status: 'healthy',
    runtime: 'cloudflare-workers',
    worker: true,
    edge: true,
  };
});

app.post('/api/data', (req: any, res: any) => {
  return {
    received: req.body,
    runtime: 'cloudflare-workers',
    method: req.method,
    ip: req.ip,
    country: req.headers['cf-ipcountry'],
  };
});

app.get('/api/user/:id', (req: any, res: any) => {
  return {
    userId: req.params.id,
    runtime: 'cloudflare-workers',
    query: req.query,
    location: {
      country: req.headers['cf-ipcountry'],
      region: req.headers['cf-region'],
      city: req.headers['cf-city'],
    },
  };
});

// Cloudflare Workers with environment variables
app.get('/api/env', (req: any, res: any) => {
  // Access Cloudflare Workers environment through req.env
  return {
    hasEnv: !!(req as any).env,
    runtime: 'cloudflare-workers',
    // Don't expose actual env vars for security
    envKeys: (req as any).env ? Object.keys((req as any).env) : [],
  };
});

// Export the handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: WorkersEnv, ctx: WorkersContext) {
    return app.getHandler()(request, env, ctx);
  },
};

/*
To deploy to Cloudflare Workers:

1. Install Wrangler CLI: npm install -g wrangler
2. Create wrangler.toml:

name = "morojs-worker"
main = "dist/worker.js"
compatibility_date = "2023-10-01"

[env.production]
name = "morojs-worker-prod"

3. Build and deploy:
   wrangler publish

4. For environment variables, add to wrangler.toml:
[vars]
API_KEY = "your-api-key"

[env.production.vars]
API_KEY = "your-prod-api-key"
*/
