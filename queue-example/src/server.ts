// Message Queue Example with MoroJS
// Demonstrates queue functionality with different adapters and job processing

import { createApp } from '@morojs/moro';

const app = createApp();

// Register queues with memory adapter (for development)
// In production, use bull (Redis), rabbitmq, sqs, or kafka

// Example 1: Basic email queue
app.queueInit('emails', {
  adapter: 'memory',
  concurrency: 5,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Example 2: High-priority critical queue
app.queueInit('critical', {
  adapter: 'memory',
  concurrency: 20,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Example 3: Background processing queue
app.queueInit('background', {
  adapter: 'memory',
  concurrency: 10,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Process email jobs
app.processQueue('emails', async job => {
  const { to, subject, body } = job.data;

  console.log(`📧 Processing email job ${job.id}: ${subject}`);

  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`✅ Email sent to ${to}`);

  return {
    sent: true,
    to,
    subject,
    timestamp: Date.now(),
  };
});

// Process critical jobs
app.processQueue('critical', async job => {
  const { task, priority } = job.data;

  console.log(`🚨 Processing critical job ${job.id}: ${task}`);

  // Simulate critical task processing
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`✅ Critical task completed: ${task}`);

  return {
    completed: true,
    task,
    priority,
    timestamp: Date.now(),
  };
});

// Process background jobs with progress tracking
app.processQueue('background', async job => {
  const { task, steps } = job.data;

  console.log(`🔄 Processing background job ${job.id}: ${task}`);

  // Report progress
  await job.updateProgress(0);

  for (let i = 0; i < steps; i++) {
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update progress
    const progress = Math.round(((i + 1) / steps) * 100);
    await job.updateProgress(progress);

    console.log(`  Progress: ${progress}%`);
  }

  console.log(`✅ Background task completed: ${task}`);

  return {
    completed: true,
    task,
    steps,
    timestamp: Date.now(),
  };
});

// HTTP Routes

// Add email job
app.post('/api/queue/email').handler(async (req, res) => {
  const { to, subject, body } = req.body;

  const job = await app.addToQueue('emails', {
    to,
    subject,
    body,
  });

  return {
    success: true,
    jobId: job.id,
    status: 'queued',
    queue: 'emails',
  };
});

// Add critical job
app.post('/api/queue/critical').handler(async (req, res) => {
  const { task, priority = 1 } = req.body;

  const job = await app.addToQueue(
    'critical',
    { task, priority },
    {
      priority, // Lower number = higher priority
      attempts: 3,
    }
  );

  return {
    success: true,
    jobId: job.id,
    status: 'queued',
    queue: 'critical',
    priority,
  };
});

// Add background job
app.post('/api/queue/background').handler(async (req, res) => {
  const { task, steps = 5 } = req.body;

  const job = await app.addToQueue('background', {
    task,
    steps,
  });

  return {
    success: true,
    jobId: job.id,
    status: 'queued',
    queue: 'background',
  };
});

// Add bulk jobs
app.post('/api/queue/bulk').handler(async (req, res) => {
  const { queue, jobs } = req.body;

  const addedJobs = await app.addBulkToQueue(
    queue,
    jobs.map((jobData: any) => ({ data: jobData }))
  );

  return {
    success: true,
    count: addedJobs.length,
    jobIds: addedJobs.map((job: any) => job.id),
  };
});

// Get job status
app.get('/api/queue/jobs/:queue/:id').handler(async (req, res) => {
  const { queue, id } = req.params;

  const job = await app.getQueueJob(queue, id);

  if (!job) {
    res.statusCode = 404;
    return { error: 'Job not found' };
  }

  return {
    id: job.id,
    status: job.status,
    progress: job.progress || 0,
    attempts: job.attempts || 0,
    data: job.data,
    result: job.result,
    error: job.failedReason,
    createdAt: job.createdAt,
    processedAt: job.processedAt,
    finishedAt: job.finishedAt,
  };
});

// Get queue metrics
app.get('/api/queue/metrics/:queue').handler(async (req, res) => {
  const { queue } = req.params;

  const metrics = await app.getQueueMetrics(queue);

  return {
    queue,
    metrics: {
      waiting: metrics.waiting || 0,
      active: metrics.active || 0,
      completed: metrics.completed || 0,
      failed: metrics.failed || 0,
      delayed: metrics.delayed || 0,
    },
  };
});

// Get queue status
app.get('/api/queue/status/:queue').handler(async (req, res) => {
  const { queue } = req.params;

  const status = await app.getQueueStatus(queue);

  return {
    queue,
    status: {
      isPaused: status.isPaused || false,
      activeWorkers: status.activeWorkers || 0,
      processingRate: status.processingRate || 0,
    },
  };
});

// Pause queue
app.post('/api/queue/:queue/pause').handler(async (req, res) => {
  const { queue } = req.params;

  await app.pauseQueue(queue);

  return {
    success: true,
    message: `Queue ${queue} paused`,
  };
});

// Resume queue
app.post('/api/queue/:queue/resume').handler(async (req, res) => {
  const { queue } = req.params;

  await app.resumeQueue(queue);

  return {
    success: true,
    message: `Queue ${queue} resumed`,
  };
});

// Retry failed job
app.post('/api/queue/:queue/jobs/:id/retry').handler(async (req, res) => {
  const { queue, id } = req.params;

  await app.retryQueueJob(queue, id);

  return {
    success: true,
    message: `Job ${id} retried`,
  };
});

// Health check
app.get('/health', (req, res) => {
  return {
    status: 'healthy',
    queues: ['emails', 'critical', 'background'],
    timestamp: new Date().toISOString(),
  };
});

// Example: Using Bull adapter (Redis-based)
/*
app.queueInit('emails', {
  adapter: 'bull',
  connection: {
    host: 'localhost',
    port: 6379,
    password: 'redis-password',
  },
  concurrency: 10,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
*/

// Example: Using RabbitMQ adapter
/*
app.queueInit('tasks', {
  adapter: 'rabbitmq',
  connection: {
    host: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
  },
  concurrency: 20,
});
*/

// Example: Using AWS SQS adapter
/*
app.queueInit('events', {
  adapter: 'sqs',
  connection: {
    region: 'us-east-1',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue',
  },
  concurrency: 10,
});
*/

// Example: Using Kafka adapter
/*
app.queueInit('streams', {
  adapter: 'kafka',
  connection: {
    brokers: ['localhost:9092'],
    groupId: 'my-consumer-group',
  },
  concurrency: 50,
});
*/

// Example: Scheduled job
/*
app.addToQueue(
  'emails',
  { to: 'user@example.com', subject: 'Daily Report' },
  {
    repeat: {
      cron: '0 9 * * *', // Every day at 9 AM
    },
  }
);
*/

// Example: Delayed job
/*
app.addToQueue(
  'emails',
  { to: 'user@example.com', subject: 'Reminder' },
  {
    delay: 3600000, // 1 hour delay
  }
);
*/

// Start server
app.listen(3000, () => {
  console.log('\n🚀 Queue Example Server Running');
  console.log('═══════════════════════════════════════');
  console.log('Server: http://localhost:3000');
  console.log('Health: http://localhost:3000/health');
  console.log('\nQueues:');
  console.log('  - emails (concurrency: 5)');
  console.log('  - critical (concurrency: 20)');
  console.log('  - background (concurrency: 10)');
  console.log('\nAPI Endpoints:');
  console.log('  POST /api/queue/email');
  console.log('  POST /api/queue/critical');
  console.log('  POST /api/queue/background');
  console.log('  POST /api/queue/bulk');
  console.log('  GET  /api/queue/jobs/:queue/:id');
  console.log('  GET  /api/queue/metrics/:queue');
  console.log('  GET  /api/queue/status/:queue');
  console.log('  POST /api/queue/:queue/pause');
  console.log('  POST /api/queue/:queue/resume');
  console.log('  POST /api/queue/:queue/jobs/:id/retry');
  console.log('═══════════════════════════════════════\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹ Shutting down gracefully...');
  await app.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹ Shutting down gracefully...');
  await app.close();
  process.exit(0);
});
