// Vercel Edge Runtime Example
import { createAppEdge } from '../../MoroJS/src';

const app = createAppEdge();

// Define routes exactly the same way
app.get('/', (req, res) => {
  return {
    message: 'Hello from MoroJS on Vercel Edge!',
    runtime: 'vercel-edge',
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'unknown',
  };
});

app.get('/api/health', (req, res) => {
  return {
    status: 'healthy',
    runtime: 'vercel-edge',
    edge: true,
  };
});

app.post('/api/data', (req, res) => {
  return {
    received: req.body,
    runtime: 'vercel-edge',
    method: req.method,
    headers: req.headers,
  };
});

app.get('/api/user/:id', (req, res) => {
  return {
    userId: req.params.id,
    runtime: 'vercel-edge',
    query: req.query,
  };
});

// Export the handler for Vercel Edge
export default app.getHandler();

// For local development/testing, you can also use:
// export const handler = app.getHandler();

/* 
To deploy to Vercel Edge:

1. Create api/[...slug].ts in your project
2. Copy this code
3. Configure vercel.json:
{
  "functions": {
    "api/[...slug].ts": {
      "runtime": "edge"
    }
  }
}
*/
