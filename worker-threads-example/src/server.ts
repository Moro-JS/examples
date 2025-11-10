// Example: How Automatic Worker Thread Usage Could Work
// This shows the concept of intelligent, automatic worker thread usage

import { createApp } from '@morojs/moro';

const app = createApp();

// Example 1: JWT operations with automatic worker thread scaling
app.get('/auth/verify/:token', async (req, res) => {
  const token = req.params.token;

  // Under normal load: synchronous (fast path)
  // Under high load: automatically uses worker threads
  const result = await app.jwtWorker.verify(token, 'secret');

  res.json(result);
});

// Example 2: Heavy computation with automatic offloading
app.post('/api/process-data', async (req, res) => {
  const data = req.body;

  // Small data: process synchronously
  // Large data: automatically uses worker threads
  if (data.length > 1000) {
    const result = await app.computeWorker.heavy(data);
    res.json(result);
  } else {
    // Process normally
    const result = data.map((item: number) => item * 2);
    res.json(result);
  }
});

// Example 3: Configurable auto-scaling
const appWithWorkers = createApp({
  workers: {
    count: 4, // Use 4 worker threads
    maxQueueSize: 1000,
    // Future: autoScale: true - automatically adjust based on load
  },
});

// What automatic worker thread usage could look like:

class SmartWorkerManager {
  private requestCount = 0;
  private lastCheck = Date.now();

  async executeSmart(operation: string, data: any, threshold: number = 100) {
    this.requestCount++;

    // Check load every second
    if (Date.now() - this.lastCheck > 1000) {
      const loadRate = this.requestCount;

      if (loadRate > threshold) {
        // High load - use worker threads
        return this.executeOnWorker(operation, data);
      }

      this.requestCount = 0;
      this.lastCheck = Date.now();
    }

    // Normal load - execute synchronously
    return this.executeSynchronously(operation, data);
  }

  private executeOnWorker(operation: string, data: any) {
    // Use worker threads for high load
    return app.executeOnWorker({
      id: `${operation}-${Date.now()}`,
      type: operation,
      data,
      priority: 'normal',
    });
  }

  private executeSynchronously(operation: string, data: any) {
    // Direct execution for normal load
    switch (operation) {
      case 'jwt:verify':
        return require('jsonwebtoken').verify(data.token, data.secret);
      case 'crypto:hash':
        return require('crypto').createHash('sha256').update(data.input).digest('hex');
      default:
        return data;
    }
  }
}

// Usage:
const smartWorker = new SmartWorkerManager();

// This automatically chooses the right execution method based on load
// const result1 = await smartWorker.executeSmart('jwt:verify', { token, secret });
// const result2 = await smartWorker.executeSmart('crypto:hash', { input: 'data' });

// The framework could expose this as:
// app.smartExecute('jwt:verify', data); // Automatically chooses sync vs worker

app.listen(3000, () => {
  console.log('Worker threads example server running on http://localhost:3000');
  console.log('\nAvailable endpoints:');
  console.log('  GET  /auth/verify/:token');
  console.log('  POST /api/process-data');
});
