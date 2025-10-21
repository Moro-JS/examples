// Enterprise Application Example - Functional Module Structure
import { createApp } from '@morojs/moro';
import UsersModule from './modules/users';
import OrdersModule from './modules/orders';
import TodosModule from './modules/todos';
import HealthModule from './modules/health';
import TestSimpleModule from './modules/test-simple';

async function createEnterpriseApp() {
  // Use the simpler createApp function instead of MoroCore
  const app = createApp({
    cors: true,
    compression: true,
    helmet: true,
  });

  // Simulated database (in real app, use MySQLAdapter)
  const mockDatabase = {
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
    ],
    orders: [
      { id: 1, userId: 1, product: 'Laptop', amount: 999.99, status: 'completed' },
      { id: 2, userId: 2, product: 'Mouse', amount: 29.99, status: 'pending' },
    ],
    todos: [
      {
        id: 1,
        title: 'Learn MoroJS',
        description: 'Explore the new functional module architecture',
        completed: false,
        priority: 'high',
      },
      {
        id: 2,
        title: 'Build API',
        description: 'Create a REST API using the new module structure',
        completed: false,
        priority: 'medium',
      },
    ],
  };

  // Register database
  app.database(mockDatabase);

  console.log('Database registered:', !!mockDatabase);
  console.log('Mock users:', mockDatabase.users?.length || 0);

  // Add enterprise middleware FIRST
  app.use((req: any, res: any, next: () => void) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Add a WORKING test route to verify basic functionality
  app.get('/test-direct', (req, res) => {
    return {
      success: true,
      message: 'Direct route works!',
      database: !!req.database,
      timestamp: new Date().toISOString(),
    };
  });

  // Load enterprise modules using the new functional module system
  await app.loadModule(HealthModule);
  await app.loadModule(TestSimpleModule); // Test first!
  await app.loadModule(UsersModule);
  await app.loadModule(OrdersModule);
  await app.loadModule(TodosModule);

  // Add a simple test route to verify basic functionality
  app.get('/', (req, res) => {
    return {
      message: 'Enterprise API is working with NEW FUNCTIONAL MODULES!',
      timestamp: new Date().toISOString(),
      modules: ['health', 'users', 'orders', 'todos'],
      architecture: 'functional-event-driven',
    };
  });

  // Add simple health route for testing
  app.get('/health', (req, res) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      architecture: 'NEW FUNCTIONAL MODULES ACTIVE',
    };
  });

  // Add a test to see if the modules are working
  app.get('/debug/modules', (req, res) => {
    return {
      message: 'New functional architecture active!',
      modulesLoaded: ['health', 'users', 'orders', 'todos'],
      expectedRoutes: [
        '/api/v1.0.0/health/',
        '/api/v1.0.0/users/',
        '/api/v1.0.0/orders/',
        '/api/v1.0.0/todos/',
      ],
      changes: [
        'Removed decorators (@Controller, @Route, @Injectable)',
        'Added defineModule() functional API',
        'Separated routes.ts and sockets.ts',
        'Converted .model.ts to types.ts',
        'Pure actions.ts for business logic',
      ],
    };
  });

  return app;
}

async function bootstrap() {
  try {
    const app = await createEnterpriseApp();
    const config = app.getConfig();
    const port = config.server.port;

    app.listen(port, () => {
      console.log('🏢 Enterprise Application Started');
      console.log(`HTTP API: http://localhost:${port}`);
      console.log(` WebSocket: ws://localhost:${port}`);
      console.log('');
      console.log('Available APIs:');
      console.log(`  Root: http://localhost:${port}/`);
      console.log(`  Health: http://localhost:${port}/health`);
      console.log(`  Health: http://localhost:${port}/api/v1.0.0/health/`);
      console.log(`  Users:  http://localhost:${port}/api/v1.0.0/users/`);
      console.log(`  Orders: http://localhost:${port}/api/v1.0.0/orders/`);
      console.log(`  Todos:  http://localhost:${port}/api/v1.0.0/todos/`);
      console.log('');
      console.log('WebSocket Namespaces:');
      console.log(`  Users:  ws://localhost:${port}/users`);
      console.log(`  Orders: ws://localhost:${port}/orders`);
      console.log(`  Todos:  ws://localhost:${port}/todos`);
      console.log('');
      console.log('🏢 Built with Moro Framework - Enterprise Ready');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🏢 Enterprise app shutting down gracefully...');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start enterprise application:', error);
    process.exit(1);
  }
}

bootstrap();
