// Enterprise Event System Example
// Demonstrates secure, scalable, observable event-driven architecture

import { createApp, z } from '@morojs/moro';
import { EventPayload } from 'moro/src/types/events';

const app = createApp();

// Global framework events - observe system lifecycle
app.events.on('framework:initialized', ({ data }: EventPayload) => {
  console.log('Framework initialized with options:', data.options);
});

app.events.on('module:loaded', ({ data }: EventPayload) => {
  console.log(`Module loaded: ${data.moduleId}@${data.version}`);
});

app.events.on('middleware:registered', ({ data }: EventPayload) => {
  console.log(`Middleware registered: ${data.type}`);
});

app.events.on('database:connected', ({ data }: EventPayload) => {
  console.log(` Database connected: ${data.adapter}`);
});

// Monitor event metrics in real-time
setInterval(() => {
  const metrics = app.events.getMetrics();
  console.log('Event Metrics:', {
    totalEvents: metrics.totalEvents,
    averageLatency: `${metrics.averageLatency.toFixed(2)}ms`,
    errorRate: `${metrics.errorRate.toFixed(2)}%`,
    topEvents: Object.entries(metrics.eventsByType)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3),
  });
}, 10000); // Every 10 seconds

// Enable audit logging for compliance
app.events.enableAuditLog();

// Welcome endpoint - intelligent routing
app
  .get('/')
  .describe('Enterprise events demo welcome page')
  .tag('demo', 'events')
  .handler((req: any, res: any) => {
    return {
      message: 'Welcome to Enterprise Event System Demo',
      framework: 'Moro',
      version: '1.0.0',
      features: [
        'Isolated module event buses',
        'Global system events',
        'Real-time metrics & monitoring',
        'Audit logging for compliance',
        'Type-safe event payloads',
        'Automatic namespacing',
      ],
      endpoints: [
        'GET /',
        'GET /users',
        'GET /orders',
        'GET /notifications',
        'GET /error-example',
        'GET /security-demo',
        'GET /metrics',
        'GET /audit-log',
      ],
    };
  });

// Example module with isolated event bus
app.get('/users', async (req, res) => {
  // Each module gets its own isolated event bus
  const { events } = req;

  // Module events are automatically namespaced
  await events.emit('user.list.requested', {
    userId: req.headers['user-id'],
    filters: req.query,
  });

  const users = [
    { id: 1, name: 'Alice Johnson', role: 'admin', email: 'alice@company.com' },
    { id: 2, name: 'Bob Smith', role: 'user', email: 'bob@company.com' },
    { id: 3, name: 'Carol Davis', role: 'manager', email: 'carol@company.com' },
  ];

  await events.emit('user.list.retrieved', {
    count: users.length,
    users,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    users,
    eventsEmitted: ['user.list.requested', 'user.list.retrieved'],
  };
});

// Inter-module communication through global events
app.get('/orders', async (req, res) => {
  const { events } = req;

  // This module can listen to user events
  events.on('user.updated', ({ data, context }: EventPayload) => {
    console.log(`Order module notified of user update:`, {
      userId: data.userId,
      timestamp: context.timestamp,
      source: context.source,
    });
  });

  const orders = [
    { id: 1, userId: 1, total: 99.99, status: 'shipped', items: ['Laptop'] },
    { id: 2, userId: 2, total: 149.99, status: 'pending', items: ['Phone', 'Case'] },
    { id: 3, userId: 1, total: 249.99, status: 'delivered', items: ['Monitor'] },
  ];

  await events.emit('orders.retrieved', {
    orders,
    totalValue: orders.reduce((sum, order) => sum + order.total, 0),
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    orders,
    eventsEmitted: ['orders.retrieved'],
  };
});

// Notification system using events
app.get('/notifications', async (req, res) => {
  const { events } = req;

  // Listen for various system events to create notifications
  const notifications: Array<{ type: string; message: string; timestamp: string }> = [];

  // Simulate listening to events
  events.on('user.created', ({ data }: EventPayload) => {
    notifications.push({
      type: 'user_registration',
      message: `New user ${data.name} registered`,
      timestamp: new Date().toISOString(),
    });
  });

  events.on('order.placed', ({ data }: EventPayload) => {
    notifications.push({
      type: 'new_order',
      message: `Order #${data.orderId} placed for $${data.total}`,
      timestamp: new Date().toISOString(),
    });
  });

  // Emit some test events
  await events.emit('user.created', { name: 'David Wilson', email: 'david@company.com' });
  await events.emit('order.placed', { orderId: 1001, total: 299.99, userId: 1 });

  return {
    success: true,
    notifications,
    message: 'Event-driven notification system demo',
    eventsEmitted: ['user.created', 'order.placed'],
  };
});

// Error handling with event context
app.get('/error-example', async (req, res) => {
  const { events } = req;

  try {
    // Simulate an error
    throw new Error('Database connection timeout');
  } catch (error) {
    // Log the error with full context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await events.emit('error.handled', {
      error: errorMessage,
      endpoint: '/error-example',
      requestId: req.headers['x-request-id'] || 'req_' + Date.now(),
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      severity: 'high',
    });

    return {
      success: false,
      error: 'Internal server error',
      requestId: req.headers['x-request-id'] || 'req_' + Date.now(),
      eventsEmitted: ['error.handled'],
    };
  }
});

// Security: Module isolation demonstration
app.get('/security-demo', async (req, res) => {
  const { events } = req;

  // This module can only emit its own namespaced events
  await events.emit('payment.processed', {
    amount: 100,
    currency: 'USD',
    transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
  });

  await events.emit('security.audit', {
    action: 'payment_processed',
    user: req.headers['user-id'] || 'anonymous',
    timestamp: new Date().toISOString(),
  });

  // Events are automatically namespaced for security
  return {
    success: true,
    message: 'Events are automatically namespaced for security',
    namespace: 'module:security-demo',
    eventsEmitted: ['payment.processed', 'security.audit'],
  };
});

// Event bus metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = app.events.getMetrics();

  return {
    success: true,
    metrics: {
      totalEvents: metrics.totalEvents,
      averageLatency: `${metrics.averageLatency.toFixed(2)}ms`,
      errorRate: `${metrics.errorRate.toFixed(2)}%`,
      eventsByType: metrics.eventsByType,
      eventsByModule: metrics.eventsByModule,
    },
    eventTypes: Object.keys(metrics.eventsByType).length,
    modules: Object.keys(metrics.eventsByModule).length,
  };
});

// Audit log endpoint
app.get('/audit-log', (req, res) => {
  const auditLog = app.events.getAuditLog();
  const limit = parseInt(req.query.limit as string) || 20;

  return {
    success: true,
    auditLog: auditLog.slice(-limit), // Last N events
    total: auditLog.length,
    compliance: {
      enabled: true,
      retention: '90 days',
      encryption: 'AES-256',
    },
  };
});

console.log(`
🎭 Enterprise Event System Demo
================================

Framework Features:
•  Isolated module event buses
• 🌐 Global system events
• Real-time metrics & monitoring  
• Audit logging for compliance
• Type-safe event payloads
• 🏷 Automatic namespacing

Try these endpoints:
• GET / - Welcome and overview
• GET /users - See module events
• GET /orders - Inter-module communication
• GET /notifications - Event-driven notifications
• GET /error-example - Error event handling
• GET /security-demo - Security isolation
• GET /metrics - Event system metrics
• GET /audit-log - Compliance audit log

Watch the console for real-time event activity!
`);

app.listen(3003);
