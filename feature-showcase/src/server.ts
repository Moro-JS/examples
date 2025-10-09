// Feature Showcase using Moro Framework
// Comprehensive demonstration of all framework capabilities
import 'reflect-metadata';
import { createApp, validate, body, z } from '@morojs/moro';
import { addLoggingDemoRoutes } from './advanced-logging-demo';

// Create the app
const app = createApp({
  cors: true,
  compression: true,
  helmet: true,
  websocket: {
    enabled: true,
  },
});

// Simple hello world
app.get('/', (req, res) => {
  return {
    message: 'Welcome to Moro Framework Feature Showcase!',
    framework: 'Moro',
    version: '1.0.0',
    endpoints: [
      'GET / (direct route)',
      'GET /users (intelligent routing - chainable)',
      'POST /users (intelligent routing - chainable)',
      'POST /users-direct (direct routing)',
      'GET /users-schema (schema-first routing)',
      'GET /health (intelligent routing)',
    ],
    loggingDemo: [
      'GET /demo/logging - Main logging demonstration',
      'GET /demo/logging/error - Error logging demo',
      'GET /demo/logging/performance - Performance timing demo',
      'GET /demo/logging/components - Component-specific logging demo',
    ],
    demos: [
      'database-demo.ts - Database adapters showcase',
      'clean-architecture-demo.ts - Clean architecture patterns',
      'enterprise-cache-demo.ts - Advanced caching strategies',
      'advanced-logging-demo.ts - Enterprise logging system',
    ],
    documentation: {
      interactive_swagger: 'http://localhost:3001/docs',
      simple_docs: 'http://localhost:3001/docs/simple',
      openapi_json: 'http://localhost:3001/api/openapi.json',
    },
  };
});

// Health check - converted to intelligent routing
app
  .get('/health')
  .describe('Health check endpoint')
  .tag('system', 'health')
  .handler((req: any, res: any) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      routing: 'intelligent',
    };
  });

// Users endpoints
const users: any[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
];

// Get users with intelligent routing and query validation
app
  .get('/users')
  .query(
    z.object({
      limit: z.coerce.number().min(1).max(100).default(10),
      offset: z.coerce.number().min(0).default(0),
      search: z.string().optional(),
    })
  )
  .cache({ ttl: 60, key: 'users-list' })
  .describe('Get users with pagination and search')
  .tag('users', 'list')
  .handler((req, res) => {
    const { limit, offset, search } = req.query;
    let filteredUsers = [...users];

    // Apply search filter
    if (search) {
      filteredUsers = filteredUsers.filter(
        user =>
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(Number(offset), Number(offset) + Number(limit));

    return {
      success: true,
      data: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        limit,
        offset,
        hasMore: Number(offset) + Number(limit) < filteredUsers.length,
      },
    };
  });

// Create user with validation and rate limiting
// NEW: Intelligent routing with chainable API (automatic middleware ordering!)
app
  .post('/users')
  .body(
    z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
    })
  )
  .rateLimit({ requests: 10, window: 60000 })
  .describe('Create a new user with intelligent routing')
  .tag('users', 'create')
  .handler((req: any, res: any) => {
    // req.body is fully typed and validated!
    const newUser = {
      id: users.length + 1,
      ...req.body,
    };

    users.push(newUser);
    res.status(201);

    return {
      success: true,
      data: newUser,
      message: 'User created with intelligent routing!',
    };
  });

// Additional modern routing examples with the new configuration system
const CreateUserSchemaV2 = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(13).optional(), // Optional age field
  preferences: z
    .object({
      newsletter: z.boolean().default(false),
      theme: z.enum(['light', 'dark']).default('light'),
    })
    .optional(),
});

// Modern route with configuration-driven settings
app
  .post('/users-config')
  .body(CreateUserSchemaV2)
  .rateLimit({
    requests: app.getConfig().modules.rateLimit.defaultRequests,
    window: app.getConfig().modules.rateLimit.defaultWindow,
  })
  .cache({ ttl: app.getConfig().modules.cache.defaultTtl })
  .describe('Create user with enhanced validation and configuration-driven settings')
  .tag('users', 'config')
  .handler((req: any, res: any) => {
    const config = app.getConfig();
    const newUser = {
      id: users.length + 1,
      ...req.body,
      createdAt: new Date().toISOString(),
      environment: config.server.environment,
    };

    users.push(newUser);
    res.status(201);

    return {
      success: true,
      data: newUser,
      message: 'User created with modern routing and configuration!',
      configuration: {
        environment: config.server.environment,
        cacheEnabled: config.modules.cache.enabled,
        rateLimitApplied: `${config.modules.rateLimit.defaultRequests}/${config.modules.rateLimit.defaultWindow}ms`,
      },
    };
  });

// NEW: Schema-first approach - declarative and clean
app.route({
  method: 'GET',
  path: '/users-schema',
  validation: {
    query: z.object({
      limit: z.coerce.number().min(1).max(100).default(10),
      search: z.string().optional(),
    }),
  },
  rateLimit: { requests: 100, window: 60000 },
  description: 'Get users with schema-first approach',
  tags: ['users', 'list'],
  handler: (req, res) => {
    console.log('Schema-first route with typed query:', req.query);

    let filteredUsers = [...users];
    if (req.query.search) {
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(req.query.search.toLowerCase())
      );
    }

    return {
      success: true,
      data: filteredUsers.slice(0, Number(req.query.limit)),
      message: 'Users fetched with schema-first routing!',
    };
  },
});

// Enable automatic API documentation
app.enableDocs({
  title: 'API Documentation',
  version: '1.0.0',
  description: 'Complete API reference with request/response schemas and examples',
  basePath: '/docs',
  servers: [{ url: 'http://localhost:3001', description: 'Development server' }],
  contact: {
    name: 'API Support',
    email: 'support@example.com',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
  swaggerUI: {
    title: 'API Documentation',
    enableTryItOut: false, // Disable "Try it out" buttons for production
    enableFilter: true,
    enableDeepLinking: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 28px; color: #333; }
      .swagger-ui .info .description { color: #666; font-size: 14px; }
      .swagger-ui .scheme-container { display: none; }
    `,
  },
});

// Add routes to access OpenAPI spec directly
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return app.getOpenAPISpec();
});

// Add simple docs fallback route
app.get('/docs/simple', (req, res) => {
  const routes = (app as any).intelligentRouting.getIntelligentRoutes();

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Simple API Documentation</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    .endpoint { background: #f8f9fa; padding: 15px; margin: 15px 0; border-left: 4px solid #007bff; }
    .method { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; margin-right: 10px; }
    .method.GET { background: #28a745; }
    .method.POST { background: #ffc107; color: #000; }
    .method.PUT { background: #17a2b8; }
    .method.DELETE { background: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Simple API Documentation</h1>
    <p>Generated from Moro intelligent routes with Zod validation</p>

    <h2>Documentation Links:</h2>
    <ul>
      <li><a href="/docs">Interactive Swagger UI</a></li>
      <li><a href="/api/openapi.json">OpenAPI JSON Spec</a></li>
    </ul>

    <h2>API Endpoints:</h2>

    ${routes
      .map(
        (route: any) => `
      <div class="endpoint">
        <div>
          <span class="method ${route.schema.method}">${route.schema.method}</span>
          <code>${route.schema.path}</code>
        </div>
        ${route.schema.description ? `<p><strong>Description:</strong> ${route.schema.description}</p>` : ''}
        ${route.schema.tags ? `<p><strong>Tags:</strong> ${route.schema.tags.join(', ')}</p>` : ''}
        ${route.schema.validation ? '<p><strong>Validation:</strong> Zod schema validation enabled</p>' : ''}
        ${route.schema.auth ? '<p><strong>Auth:</strong> Authentication required</p>' : ''}
        ${route.schema.rateLimit ? `<p><strong>Rate Limit:</strong> ${route.schema.rateLimit.requests} req/${Math.round(route.schema.rateLimit.window / 1000)}s</p>` : ''}
      </div>
    `
      )
      .join('')}

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
      <p>Built with Moro Framework - Intelligent Routing + Type-Safe Validation</p>
    </div>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// WebSocket chat
app.websocket('/chat', {
  join: (socket, data) => {
    socket.join('chat-room');
    socket.to('chat-room').emit('user-joined', {
      message: `${data.username} joined the chat`,
    });
    return { success: true, message: 'Joined chat room' };
  },

  message: (socket, data) => {
    socket.to('chat-room').emit('message', {
      username: data.username,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  },
});

// Configuration endpoint to show current settings
app.get('/config', (req, res) => {
  const config = app.getConfig();
  return {
    success: true,
    data: {
      environment: config.server.environment,
      server: {
        port: config.server.port,
        host: config.server.host,
        maxConnections: config.server.maxConnections,
      },
      modules: {
        cache: {
          enabled: config.modules.cache.enabled,
          defaultTtl: config.modules.cache.defaultTtl,
          maxSize: config.modules.cache.maxSize,
          strategy: config.modules.cache.strategy,
        },
        rateLimit: {
          enabled: config.modules.rateLimit.enabled,
          defaultRequests: config.modules.rateLimit.defaultRequests,
          defaultWindow: config.modules.rateLimit.defaultWindow,
        },
      },
      security: {
        cors: config.security.cors,
        helmet: config.security.helmet,
      },
      logging: {
        level: config.logging.level,
        format: config.logging.format,
        enableColors: config.logging.enableColors,
      },
    },
    message: 'Current application configuration',
  };
});

// Add logging demonstration routes
addLoggingDemoRoutes(app);

// Start server using configuration
const config = app.getConfig();
const port = config.server.port;

app.listen(port, config.server.host, () => {
  console.log('Simple API Example Server Started');
  console.log(`HTTP API: http://${config.server.host}:${port}`);
  console.log(` WebSocket Chat: ws://${config.server.host}:${port}/chat`);
  console.log(`Environment: ${config.server.environment}`);
  console.log('');
  console.log('Try these endpoints:');
  console.log(`  GET  http://localhost:${port}/`);
  console.log(`  GET  http://localhost:${port}/users`);
  console.log(`  POST http://localhost:${port}/users (intelligent routing - chainable)`);
  console.log(`  POST http://localhost:${port}/users-config (configuration-driven)`);
  console.log(`  GET  http://localhost:${port}/users-schema?search=john (schema-first)`);
  console.log(`  GET  http://localhost:${port}/config (view configuration)`);
  console.log(`  GET  http://localhost:${port}/health`);
  console.log('');
  console.log('API Documentation:');
  console.log(`  Interactive Swagger UI: http://localhost:${port}/docs`);
  console.log(`  Simple Documentation: http://localhost:${port}/docs/simple`);
  console.log(`  OpenAPI JSON:         http://localhost:${port}/api/openapi.json`);
  console.log('');
  console.log('New Features:');
  console.log('  • Intelligent middleware ordering (no more order dependencies!)');
  console.log('  • Chainable API: app.post("/path").body(schema).rateLimit().handler()');
  console.log('  • Schema-first: app.route({ method, path, validation, handler })');
  console.log('  • Automatic API documentation from Zod schemas');
  console.log('  • Multiple routing styles: direct, chainable, and schema-first');
  console.log('');
  console.log('Built with ♥ using Moro Framework');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});
