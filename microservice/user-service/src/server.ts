// User Service - Microservice Example
// Handles user management and authentication

import { createApp, z } from '@morojs/moro';
import { ServiceRegistry } from '@morojs/moro';

const app = createApp();

// Service Discovery Setup
const serviceRegistry = new ServiceRegistry({
  type: (process.env.DISCOVERY_TYPE as any) || 'memory',
  consulUrl: process.env.CONSUL_URL || 'http://consul:8500',
  kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
  healthCheckInterval: 30000, // 30 seconds
  tags: ['user-management', 'authentication', 'v1'],
});

// Register this service
const serviceInfo = {
  name: 'user-service',
  host: process.env.SERVICE_HOST || 'localhost',
  port: parseInt(process.env.PORT || '3010'),
  health: '/health',
  version: '1.0.0',
  tags: ['user-management', 'authentication'],
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    startTime: new Date().toISOString(),
  },
};

// In-memory user store (in production, use a database)
const users = new Map([
  [
    1,
    { id: 1, name: 'Alice Johnson', email: 'alice@company.com', role: 'admin', status: 'active' },
  ],
  [2, { id: 2, name: 'Bob Smith', email: 'bob@company.com', role: 'user', status: 'active' }],
  [
    3,
    { id: 3, name: 'Carol Davis', email: 'carol@company.com', role: 'manager', status: 'active' },
  ],
]);

let nextUserId = 4;

// Service health check (enhanced for microservices) - intelligent routing
app
  .get('/health')
  .describe('Microservice health check')
  .tag('health', 'microservice')
  .handler((req: any, res: any) => {
    const healthStatus = {
      service: 'user-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || 'development',
      dependencies: {
        database: 'healthy', // In production, check actual database
        eventBus: 'healthy',
      },
      metrics: {
        totalUsers: users.size,
        activeUsers: Array.from(users.values()).filter(u => u.status === 'active').length,
      },
    };

    // Set appropriate status code
    res.statusCode = 200;
    return healthStatus;
  });

// Service info endpoint (enhanced with discovery info)
app.get('/', (req, res) => {
  return {
    service: 'User Management Service',
    version: '1.0.0',
    description: 'Handles user management and authentication',
    endpoints: [
      'GET /',
      'GET /health',
      'GET /users',
      'GET /users/:id',
      'POST /users',
      'PUT /users/:id',
      'DELETE /users/:id',
      'POST /users/:id/activate',
      'POST /users/:id/deactivate',
      'GET /services', // Service discovery endpoint
    ],
    serviceDiscovery: {
      type: serviceRegistry.constructor.name,
      registered: true,
      tags: serviceInfo.tags,
    },
    dependencies: [],
    port: serviceInfo.port,
    containerized: !!process.env.KUBERNETES_SERVICE_HOST,
  };
});

// Service discovery endpoint
app.get('/services', async (req, res) => {
  try {
    const allServices = serviceRegistry.getAllServices();

    return {
      success: true,
      services: allServices,
      registry: {
        type: 'memory', // or consul/kubernetes based on config
        healthChecks: true,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    res.statusCode = 500;
    return {
      success: false,
      error: 'Failed to retrieve services',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Get all users
app.get('/users', (req, res) => {
  const userList = Array.from(users.values());

  // Filter by status if provided
  const status = req.query.status as string;
  const filteredUsers = status ? userList.filter(u => u.status === status) : userList;

  return {
    success: true,
    data: filteredUsers,
    total: filteredUsers.length,
    service: 'user-service',
    timestamp: new Date().toISOString(),
  };
});

// Get user by ID
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);

  if (!user) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'User not found',
      service: 'user-service',
    };
  }

  return {
    success: true,
    data: user,
    service: 'user-service',
  };
});

// Create new user
app.post('/users', async (req, res) => {
  const { name, email, role = 'user' } = req.body || {};

  if (!name || !email) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Name and email are required',
      service: 'user-service',
    };
  }

  // Check if email already exists
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    res.statusCode = 409;
    return {
      success: false,
      error: 'Email already exists',
      service: 'user-service',
    };
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    role,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  users.set(newUser.id, newUser);

  // Emit user created event for other services
  const { events } = req;
  await events.emit('user.created', {
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    service: 'user-service',
  });

  res.statusCode = 201;
  return {
    success: true,
    data: newUser,
    message: 'User created successfully',
    service: 'user-service',
  };
});

// Update user
app.put('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);

  if (!user) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'User not found',
      service: 'user-service',
    };
  }

  const { name, email, role } = req.body || {};
  const updatedUser = {
    ...user,
    ...(name && { name }),
    ...(email && { email }),
    ...(role && { role }),
    updatedAt: new Date().toISOString(),
  };

  users.set(userId, updatedUser);

  // Emit user updated event
  const { events } = req;
  await events.emit('user.updated', {
    userId: updatedUser.id,
    changes: { name, email, role },
    service: 'user-service',
  });

  return {
    success: true,
    data: updatedUser,
    message: 'User updated successfully',
    service: 'user-service',
  };
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);

  if (!user) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'User not found',
      service: 'user-service',
    };
  }

  users.delete(userId);

  // Emit user deleted event
  const { events } = req;
  await events.emit('user.deleted', {
    userId: userId,
    email: user.email,
    service: 'user-service',
  });

  return {
    success: true,
    message: 'User deleted successfully',
    service: 'user-service',
  };
});

// Activate user
app.post('/users/:id/activate', async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);

  if (!user) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'User not found',
      service: 'user-service',
    };
  }

  user.status = 'active';
  users.set(userId, user);

  // Emit user activated event
  const { events } = req;
  await events.emit('user.activated', {
    userId: userId,
    email: user.email,
    service: 'user-service',
  });

  return {
    success: true,
    data: user,
    message: 'User activated successfully',
    service: 'user-service',
  };
});

// Deactivate user
app.post('/users/:id/deactivate', async (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.get(userId);

  if (!user) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'User not found',
      service: 'user-service',
    };
  }

  user.status = 'inactive';
  users.set(userId, user);

  // Emit user deactivated event
  const { events } = req;
  await events.emit('user.deactivated', {
    userId: userId,
    email: user.email,
    service: 'user-service',
  });

  return {
    success: true,
    data: user,
    message: 'User deactivated successfully',
    service: 'user-service',
  };
});

// Start the service
async function startService() {
  try {
    // Register with service discovery
    await serviceRegistry.register(serviceInfo);

    // Start the HTTP server
    app.listen(serviceInfo.port);

    console.log(`
👤 User Service (Microservice-Ready)
====================================
Port: ${serviceInfo.port}
Environment: ${process.env.NODE_ENV || 'development'}
Service Discovery: ${process.env.DISCOVERY_TYPE || 'memory'}
Health Check: http://${serviceInfo.host}:${serviceInfo.port}/health
Endpoints: 10
Features: CRUD operations, status management, event emission
Inter-service: Emits user lifecycle events
Containerized: ${!!process.env.KUBERNETES_SERVICE_HOST}
`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      await serviceRegistry.deregister('user-service');
      serviceRegistry.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      await serviceRegistry.deregister('user-service');
      serviceRegistry.destroy();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start user service:', error);
    process.exit(1);
  }
}

// Start the service
startService();
