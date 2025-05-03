// Node.js Runtime Example - Existing code works unchanged
import { createApp } from '../../MoroJS/src';

const app = createApp();

// All existing routes work exactly the same
app.get('/', (req, res) => {
  return {
    message: 'Hello from MoroJS on Node.js!',
    runtime: 'node',
    timestamp: new Date().toISOString()
  };
});

app.get('/health', (req, res) => {
  return {
    status: 'healthy',
    runtime: 'node',
    uptime: process.uptime()
  };
});

app.post('/data', (req, res) => {
  return {
    received: req.body,
    runtime: 'node',
    method: req.method
  };
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Node.js server running on port ${port}`);
});

// Alternative explicit Node.js runtime (optional)
// import { createAppNode } from '@morojs/moro';
// const app = createAppNode();
// ... rest of the code is identical 