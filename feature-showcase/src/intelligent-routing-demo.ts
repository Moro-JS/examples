// Intelligent Routing Demo - Showcasing new schema-first and chainable APIs
import 'reflect-metadata';
import { createApp, z, IntelligentRoutingManager } from '@morojs/moro';

// Create the intelligent routing manager
const intelligentRoutes = new IntelligentRoutingManager();

// Example schemas
const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional()
});

const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

const UserQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional()
});

// Mock data
const users: any[] = [
  { id: '123e4567-e89b-12d3-a456-426614174000', name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Jane Smith', email: 'jane@example.com', age: 25 }
];

// Example 1: Chainable API - Clean and readable
intelligentRoutes
  .post('/users')
  .body(UserSchema)
  .rateLimit({ requests: 10, window: 60000 })
  .describe('Create a new user with validation and rate limiting')
  .tag('users', 'create')
  .handler(async (req, res) => {
    console.log('Creating user with chainable API:', req.body);
    
    const newUser = {
      id: crypto.randomUUID(),
      ...req.body
    };
    
    users.push(newUser);
    
    return {
      success: true,
      data: newUser,
      message: 'User created with intelligent routing!'
    };
  });

// Example 2: Chainable with multiple validations and custom middleware
intelligentRoutes
  .get('/users')
  .query(UserQuerySchema)
  .before(async (req, res, next) => {
    console.log('Pre-processing: Logging request');
    next();
  })
  .after(async (req, res, next) => {
    console.log('Post-processing: Request completed');
    next();
  })
  .cache({ ttl: 300, key: 'users-list' })
  .describe('Get users with pagination and search')
  .tag('users', 'list')
  .handler(async (req, res) => {
    console.log('Query params with defaults applied:', req.query);
    
    const { limit, offset, search } = req.query;
    let filteredUsers = [...users];
    
    // Apply search filter
    if (search) {
      filteredUsers = filteredUsers.filter(user => 
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
        hasMore: Number(offset) + Number(limit) < filteredUsers.length
      }
    };
  });

// Example 3: Complex route with multiple middleware phases
intelligentRoutes
  .put('/users/:id')
  .params(UserParamsSchema)
  .body(UserSchema.partial())
  .before(async (req, res, next) => {
    console.log('Before: Checking permissions');
    // Custom permission logic here
    next();
  })
  .auth({ roles: ['user', 'admin'] })  // Framework handles auth phase automatically
  .transform(async (req, res, next) => {
    console.log('Transform: Data transformation');
    // Transform data if needed
    next();
  })
  .after(async (req, res, next) => {
    console.log('After: Audit logging');
    // Audit log the update
    next();
  })
  .rateLimit({ requests: 5, window: 60000 })
  .describe('Update user with complex middleware chain')
  .tag('users', 'update')
  .handler(async (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      res.status(404);
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Update user
    users[userIndex] = { ...users[userIndex], ...req.body };
    
    return {
      success: true,
      data: users[userIndex],
      message: 'User updated with intelligent middleware ordering!'
    };
  });

// Example 4: Schema-first approach - Declarative and clean
intelligentRoutes.route({
  method: 'DELETE',
  path: '/users/:id',
  validation: {
    params: UserParamsSchema
  },
  auth: { roles: ['admin'] },
  rateLimit: { requests: 2, window: 60000 },
  description: 'Delete user (admin only)',
  tags: ['users', 'delete', 'admin'],
  handler: async (req, res) => {
    const userIndex = users.findIndex(u => u.id === req.params.id);
    
    if (userIndex === -1) {
      res.status(404);
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    const deletedUser = users.splice(userIndex, 1)[0];
    
    return {
      success: true,
      data: deletedUser,
      message: 'User deleted with schema-first approach!'
    };
  }
});

// Example 5: Simple route without any middleware
intelligentRoutes
  .get('/health')
  .describe('Health check endpoint')
  .tag('system')
  .handler(async (req, res) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      routing: 'intelligent',
      message: 'Intelligent routing system is working!'
    };
  });

// Integration with regular Moro app
const app = createApp({
  cors: true,
  compression: true,
  helmet: true
});

// Add a middleware to handle intelligent routes
app.use(async (req: any, res: any, next: () => void) => {
  // Try intelligent routing first
  const handled = await intelligentRoutes.handleIntelligentRoute(req, res);
  if (!handled) {
    next(); // Fall back to regular routes
  }
});

// Direct route for comparison
app.get('/old-style', (req, res) => {
  return {
    message: 'This is a direct route for comparison',
    style: 'direct'
  };
});

// Debug endpoint to see all intelligent routes
app.get('/debug/routes', (req, res) => {
  const routes = intelligentRoutes.getIntelligentRoutes();
  return {
    message: 'Intelligent routes registered',
    count: routes.length,
    routes: routes.map(route => ({
      method: route.schema.method,
      path: route.schema.path,
      description: route.schema.description,
      tags: route.schema.tags,
      hasValidation: !!route.schema.validation,
      hasAuth: !!route.schema.auth,
      hasRateLimit: !!route.schema.rateLimit,
      hasCache: !!route.schema.cache,
      customMiddleware: {
        before: route.schema.middleware?.before?.length || 0,
        after: route.schema.middleware?.after?.length || 0,
        transform: route.schema.middleware?.transform?.length || 0
      }
    }))
  };
});

// Start server
const port = parseInt(process.env.PORT || '3003');

app.listen(port, () => {
  console.log('Intelligent Routing Demo Server Started');
  console.log(`HTTP API: http://localhost:${port}`);
  console.log('');
  console.log('Try these intelligent routes:');
  console.log(`  POST http://localhost:${port}/users - Chainable with validation`);
  console.log(`  GET  http://localhost:${port}/users?limit=5&search=john - Chainable with query validation`);
  console.log(`  PUT  http://localhost:${port}/users/:id - Complex middleware chain`);
  console.log(`  DELETE http://localhost:${port}/users/:id - Schema-first approach`);
  console.log(`  GET  http://localhost:${port}/health - Simple route`);
  console.log(`  GET  http://localhost:${port}/debug/routes - See all registered routes`);
  console.log(`  GET  http://localhost:${port}/old-style - Old style for comparison`);
  console.log('');
  console.log('✨ Features demonstrated:');
  console.log('  • Automatic middleware ordering (no more order dependencies!)');
  console.log('  • Chainable API for complex routes');
  console.log('  • Schema-first for declarative routes');
  console.log('  • Intelligent validation with Zod');
  console.log('  • Multiple middleware phases (before, auth, validation, transform, cache, after)');
  console.log('  • Full type safety and IDE support');
  console.log('');
  console.log(' Built with Moro Framework - Intelligent Routing System');
});

export default app; 