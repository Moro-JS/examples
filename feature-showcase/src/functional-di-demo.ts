// Functional DI Container Demo - Advanced Dependency Injection with HOFs
import { createApp } from '@morojs/moro';
import { 
  FunctionalContainer, 
  withLogging, 
  withCaching, 
  withRetry, 
  withTimeout,
  ServiceScope,
  ServiceLifecycle 
} from '../../../moro/src/core/utilities/container';
import { createFrameworkLogger } from '../../../moro/src/core/logger';

const app = createApp();
const logger = createFrameworkLogger('DI-Demo');

// Enhanced DI Container instance
const container = new FunctionalContainer();

// Example services with different patterns
interface IUserRepository {
  findById(id: string): Promise<User>;
  findAll(): Promise<User[]>;
  create(user: Omit<User, 'id'>): Promise<User>;
}

interface IEmailService {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

interface IAnalyticsService {
  track(event: string, properties: Record<string, any>): void;
}

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface DatabaseConnection {
  query(sql: string): Promise<any[]>;
  close(): Promise<void>;
  isHealthy(): boolean;
}

// Mock implementations
class MockUserRepository implements IUserRepository {
  private users: User[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date() },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }
  ];

  constructor(private db: DatabaseConnection, private analytics: IAnalyticsService) {
    logger.info('UserRepository initialized with dependencies');
  }

  async findById(id: string): Promise<User> {
    this.analytics.track('user.findById', { id });
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB call
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error(`User ${id} not found`);
    return user;
  }

  async findAll(): Promise<User[]> {
    this.analytics.track('user.findAll', {});
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...this.users];
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date()
    };
    this.users.push(user);
    this.analytics.track('user.created', { id: user.id });
    return user;
  }
}

class MockEmailService implements IEmailService {
  constructor(private config: { apiKey: string; from: string }) {
    logger.info('EmailService initialized with config');
  }

  async send(to: string, subject: string, body: string): Promise<boolean> {
    logger.info(`Sending email to ${to}: ${subject}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API call
    return true;
  }
}

class MockAnalyticsService implements IAnalyticsService {
  private events: Array<{ event: string; properties: Record<string, any>; timestamp: Date }> = [];

  track(event: string, properties: Record<string, any>): void {
    this.events.push({ event, properties, timestamp: new Date() });
    logger.debug(`Analytics: ${event}`, 'Analytics', properties);
  }

  getEvents() {
    return [...this.events];
  }
}

class MockDatabaseConnection implements DatabaseConnection {
  private connected = false;

  async connect(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connected = true;
    logger.info('Database connected');
  }

  async query(sql: string): Promise<any[]> {
    if (!this.connected) throw new Error('Database not connected');
    logger.debug(`Executing query: ${sql}`);
    return [];
  }

  async close(): Promise<void> {
    this.connected = false;
    logger.info('Database connection closed');
  }

  isHealthy(): boolean {
    return this.connected;
  }
}

// Advanced service composition with HOFs
function withErrorBoundary<T>(fallbackValue: T) {
  return (factory: any) => async (deps: any, ctx: any) => {
    try {
      return await factory(deps, ctx);
    } catch (error) {
      logger.error('Service creation failed, using fallback', 'ErrorBoundary', { error });
      return fallbackValue;
    }
  };
}

function withMetrics(metricsService: any) {
  return (factory: any) => async (deps: any, ctx: any) => {
    const start = Date.now();
    try {
      const result = await factory(deps, ctx);
      metricsService.timing('service.creation.success', Date.now() - start);
      return result;
    } catch (error) {
      metricsService.timing('service.creation.error', Date.now() - start);
      throw error;
    }
  };
}

// Service registration with functional composition
async function setupContainer() {
  // Basic services with lifecycle management
  container
    .register<DatabaseConnection>('database')
    .singleton()
    .factory(async () => {
      const db = new MockDatabaseConnection();
      await db.connect();
      return db;
    })
    .onInit(() => logger.info('Database service initialized'))
    .onDispose(async () => {
      const db = await container.resolve<DatabaseConnection>('database');
      await db.close();
    })
    .healthCheck(async () => {
      const db = await container.resolve<DatabaseConnection>('database');
      return db.isHealthy();
    })
    .tags('infrastructure', 'database')
    .build();

  // Configuration service
  container
    .register<{ apiKey: string; from: string }>('emailConfig')
    .singleton()
    .factory(() => ({
      apiKey: process.env.EMAIL_API_KEY || 'demo-key',
      from: process.env.EMAIL_FROM || 'noreply@example.com'
    }))
    .tags('config')
    .build();

  // Analytics service without caching (caching interferes with method calls)
  container
    .register<IAnalyticsService>('analytics')
    .singleton()
    .factory(() => new MockAnalyticsService())
    .tags('analytics', 'tracking')
    .build();

  // Email service with retry and timeout HOFs
  container
    .register<IEmailService>('emailService')
    .singleton()
    .dependsOn('emailConfig')
    .factory(async (deps) => new MockEmailService(deps.emailConfig))
    .compose(
      withLogging(logger),
      withRetry(3, 1000),
      withTimeout(5000)
    )
    .fallback(() => ({
      send: async () => {
        logger.warn('Using fallback email service');
        return false;
      }
    }))
    .tags('communication', 'email')
    .build();

  // User repository with full dependency injection
  container
    .register<IUserRepository>('userRepository')
    .singleton()
    .dependsOn('database', 'analytics')
    .factory(async (deps) => {
      const database = deps.database as DatabaseConnection;
      const analytics = deps.analytics as IAnalyticsService;
      return new MockUserRepository(database, analytics);
    })
    .compose(withLogging(logger))
    .tags('repository', 'users')
    .build();

  // Request-scoped user service
  container
    .register<{ userId: string; repository: IUserRepository }>('userService')
    .requestScoped()
    .dependsOn('userRepository')
    .factory(async (deps, ctx) => ({
      userId: ctx?.metadata.userId || 'anonymous',
      repository: deps.userRepository
    }))
    .tags('service', 'users')
    .build();

  // Transient notification service
  container
    .register<{ send: (message: string) => Promise<void> }>('notificationService')
    .transient()
    .dependsOn('emailService')
    .optionalDependsOn('smsService') // Optional dependency
    .factory(async (deps) => ({
      send: async (message: string) => {
        await deps.emailService.send('user@example.com', 'Notification', message);
        if (deps.smsService) {
          // SMS service is optional
          await deps.smsService.send('Notification: ' + message);
        }
      }
    }))
    .tags('notification', 'communication')
    .build();
}

// Global interceptors for cross-cutting concerns
container.addInterceptor(async (serviceName, dependencies, context, next) => {
  logger.debug(`Creating service: ${serviceName}`, 'Interceptor', { 
    deps: Object.keys(dependencies),
    context: context.requestId 
  });
  
  const start = Date.now();
  try {
    const result = await next();
    logger.debug(`Service created: ${serviceName} (${Date.now() - start}ms)`, 'Interceptor');
    return result;
  } catch (error) {
    logger.error(`Service creation failed: ${serviceName}`, 'Interceptor', { error });
    throw error;
  }
});

// API Routes demonstrating DI usage
app.get('/users', async (req, res) => {
  try {
    const userRepository = await container.resolve<IUserRepository>('userRepository');
    const users = await userRepository.findAll();
    
    res.json({
      success: true,
      data: users,
      serviceInfo: container.getServiceInfo()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});


app.get('/users/:id', async (req, res) => {
  try {
    const context = {
      requestId: req.headers['x-request-id'] as string || Date.now().toString(),
      moduleId: 'users',
      metadata: { userId: req.params.id },
      timestamp: Date.now()
    };

    const userService = await container.resolve<{ userId: string; repository: IUserRepository }>('userService', context);
    const user = await userService.repository.findById(req.params.id);
    
    res.json({
      success: true,
      data: user,
      context: context.requestId
    });
  } catch (error) {
    res.status(404).json({ success: false, error: (error as Error).message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const userRepository = await container.resolve<IUserRepository>('userRepository');
    const user = await userRepository.create(req.body);
    
    // Send notification
    const notificationService = await container.resolve<{ send: (message: string) => Promise<void> }>('notificationService');
    await notificationService.send(`New user created: ${user.name}`);
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/container/health', async (req, res) => {
  try {
    const health = await container.healthCheck();
    const serviceInfo = container.getServiceInfo();
    
    res.json({
      success: true,
      health,
      services: serviceInfo,
      summary: {
        total: Object.keys(serviceInfo).length,
        healthy: Object.values(health).filter(Boolean).length,
        unhealthy: Object.values(health).filter(h => !h).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/container/analytics', async (req, res) => {
  try {
    const analytics = await container.resolve<MockAnalyticsService>('analytics');
    const events = analytics.getEvents();
    
    res.json({
      success: true,
      analytics: {
        totalEvents: events.length,
        recentEvents: events.slice(-10),
        eventTypes: [...new Set(events.map(e => e.event))]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.delete('/container/request/:requestId', (req, res) => {
  try {
    container.clearRequestScope(req.params.requestId);
    res.json({
      success: true,
      message: `Request scope ${req.params.requestId} cleared`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Startup
async function startDemo() {
  try {
    await setupContainer();
    
    const PORT = parseInt(process.env.PORT || '3009');
    app.listen(PORT, () => {
      logger.info(`Functional DI Demo running on http://localhost:${PORT}`);
      console.log(`
Enhanced Functional Dependency Injection Demo

Features Demonstrated:
  Higher-Order Functions (withLogging, withCaching, withRetry, withTimeout)
  Full Type Safety with TypeScript generics
  Lifecycle Management (init, dispose, health checks)
  Multiple Service Scopes (singleton, transient, request, module)
  Functional Composition and Interceptors
  Optional Dependencies and Fallbacks
  Service Introspection and Monitoring

Service Scopes:
  Singleton: database, emailService, userRepository, analytics
  Transient: notificationService (new instance each time)
  Request: userService (one per request context)

Test Endpoints:
  GET  /users                     - List all users (demonstrates repository injection)
  GET  /users/:id                 - Get user by ID (demonstrates request-scoped services)
  POST /users                     - Create user (demonstrates notification service)
  GET  /container/health          - Service health checks and introspection
  GET  /container/analytics       - Analytics events tracking
  DELETE /container/request/:id   - Clear request scope manually

HOF Composition Examples:
  withLogging() - Automatic service creation logging
  withCaching() - Service instance caching with TTL
  withRetry() - Automatic retry with exponential backoff
   withTimeout() - Service creation timeout protection
   withErrorBoundary() - Graceful error handling with fallbacks

Try these:
  curl http://localhost:${PORT}/users
  curl http://localhost:${PORT}/container/health
  curl -X POST http://localhost:${PORT}/users -H "Content-Type: application/json" -d '{"name":"Bob","email":"bob@example.com"}'
      `);
    });
  } catch (error) {
    logger.error('Failed to start DI demo', 'Startup', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down DI demo...');
  await container.dispose();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down DI demo...');
  await container.dispose();
  process.exit(0);
});

startDemo();

export default app; 