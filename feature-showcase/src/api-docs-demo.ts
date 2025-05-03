// API Documentation Demo - Automatic OpenAPI generation from Zod schemas
import 'reflect-metadata';
import { createApp, z } from '@morojs/moro';

const app = createApp({
  cors: true,
  compression: true,
  helmet: true
});

// Define comprehensive Zod schemas
const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  role: z.enum(['admin', 'user', 'moderator']).default('user'),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true)
  }).optional(),
  tags: z.array(z.string().min(1)).max(10).optional()
});

const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID format')
});

const UserQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  active: z.coerce.boolean().optional()
});

const PostSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10),
  author: z.object({
    id: z.string().uuid(),
    name: z.string().min(2)
  }),
  tags: z.array(z.string().min(1)).min(1).max(10),
  metadata: z.object({
    category: z.enum(['tech', 'lifestyle', 'business']),
    publishAt: z.string().datetime().optional(),
    featured: z.boolean().default(false)
  }),
  settings: z.object({
    allowComments: z.boolean().default(true),
    visibility: z.enum(['public', 'private', 'draft']).default('draft')
  }).optional()
});

// Mock data
const users: any[] = [
  { 
    id: '123e4567-e89b-12d3-a456-426614174000', 
    name: 'John Doe', 
    email: 'john@example.com', 
    age: 30,
    role: 'admin'
  },
  { 
    id: '223e4567-e89b-12d3-a456-426614174001', 
    name: 'Jane Smith', 
    email: 'jane@example.com', 
    age: 25,
    role: 'user'
  }
];

// 1. Comprehensive user management API with intelligent routing
app.post('/users')
   .body(UserSchema)
   .rateLimit({ requests: 20, window: 60000 })
   .describe('Create a new user with comprehensive validation')
   .tag('users', 'create')
   .handler((req: any, res: any) => {
     console.log('Creating user:', req.body);
     
     const newUser = {
       id: crypto.randomUUID(),
       ...req.body,
       createdAt: new Date().toISOString()
     };
     
     users.push(newUser);
     res.status(201);
     
     return {
       success: true,
       data: newUser,
       message: 'User created successfully'
     };
   });

// 2. Get users with advanced query validation
app.get('/users')
   .query(UserQuerySchema)
   .cache({ ttl: 60, key: 'users-list' })
   .rateLimit({ requests: 100, window: 60000 })
   .describe('Get users with advanced filtering and pagination')
   .tag('users', 'list')
   .handler((req: any, res: any) => {
     const { limit, offset, search, role, active } = req.query;
     let filteredUsers = [...users];
     
     // Apply filters
     if (role) {
       filteredUsers = filteredUsers.filter(user => user.role === role);
     }
     if (active !== undefined) {
       filteredUsers = filteredUsers.filter(user => user.active === active);
     }
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

// 3. Get user by ID with UUID validation
app.get('/users/:id')
   .params(UserParamsSchema)
   .cache({ ttl: 300, key: 'user-detail' })
   .describe('Get user by UUID')
   .tag('users', 'detail')
   .handler((req: any, res: any) => {
     const user = users.find(u => u.id === req.params.id);
     
     if (!user) {
       res.status(404);
       return {
         success: false,
         error: 'User not found',
         requestId: req.requestId
       };
     }
     
     return {
       success: true,
       data: user
     };
   });

// 4. Update user with partial validation
app.put('/users/:id')
   .params(UserParamsSchema)
   .body(UserSchema.partial())
   .auth({ roles: ['admin', 'user'] })
   .rateLimit({ requests: 50, window: 60000 })
   .describe('Update user (requires authentication)')
   .tag('users', 'update')
   .handler((req: any, res: any) => {
     const userIndex = users.findIndex(u => u.id === req.params.id);
     
     if (userIndex === -1) {
       res.status(404);
       return {
         success: false,
         error: 'User not found'
       };
     }
     
     // Update user
     users[userIndex] = { 
       ...users[userIndex], 
       ...req.body,
       updatedAt: new Date().toISOString()
     };
     
     return {
       success: true,
       data: users[userIndex],
       message: 'User updated successfully'
     };
   });

// 5. Delete user (admin only)
app.delete('/users/:id')
   .params(UserParamsSchema)
   .auth({ roles: ['admin'] })
   .rateLimit({ requests: 10, window: 60000 })
   .describe('Delete user (admin only)')
   .tag('users', 'delete', 'admin')
   .handler((req: any, res: any) => {
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
       message: 'User deleted successfully'
     };
   });

// 6. Complex nested schema for posts
app.post('/posts')
   .body(PostSchema)
   .auth({ roles: ['admin', 'moderator'] })
   .rateLimit({ requests: 30, window: 60000 })
   .describe('Create a new post with complex nested validation')
   .tag('posts', 'create')
   .handler((req: any, res: any) => {
     const newPost = {
       id: crypto.randomUUID(),
       ...req.body,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString()
     };
     
     res.status(201);
     return {
       success: true,
       data: newPost,
       message: 'Post created successfully'
     };
   });

// 7. Health check endpoint
app.get('/health')
   .describe('API health check')
   .tag('system', 'health')
   .handler((req: any, res: any) => {
     return {
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: '1.0.0',
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       features: [
         'Intelligent Routing',
         'Automatic API Documentation',
         'Zod Validation',
         'Type Safety'
       ]
     };
   });

// 8. Schema-first route example
app.route({
  method: 'GET',
  path: '/users/search',
  validation: {
    query: z.object({
      q: z.string().min(1),
      type: z.enum(['name', 'email']).default('name'),
      exact: z.coerce.boolean().default(false)
    })
  },
  cache: { ttl: 120 },
  description: 'Search users by name or email',
  tags: ['users', 'search'],
  handler: (req, res) => {
    const { q, type, exact } = req.query;
    
    const results = users.filter(user => {
      const field = user[type];
      return exact 
        ? field === q
        : field.toLowerCase().includes(q.toLowerCase());
    });
    
    return {
      success: true,
      data: results,
      query: { q, type, exact },
      message: `Found ${results.length} users`
    };
  }
});

// Enable automatic API documentation
app.enableDocs({
  title: 'Moro API Documentation Demo',
  version: '1.0.0',
  description: 'Comprehensive API documentation automatically generated from Zod schemas and intelligent routes',
  basePath: '/docs',
  servers: [
    { url: 'http://localhost:3004', description: 'Development server' },
    { url: 'https://api.example.com', description: 'Production server' }
  ],
  contact: {
    name: 'Moro Framework Team',
    url: 'https://morojs.com',
    email: 'team@morojs.com'
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT'
  },
  swaggerUI: {
    title: 'Moro API Documentation',
    enableTryItOut: true,
    enableFilter: true,
    enableDeepLinking: true
  }
});

// Add a route to get the OpenAPI spec directly
app.get('/api/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  return app.getOpenAPISpec();
});

app.get('/api/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(app.getDocsYAML());
});

// Welcome endpoint with links to documentation
app.get('/', (req, res) => {
  return {
    message: 'Welcome to Moro API Documentation Demo',
    framework: 'Moro',
    version: '1.0.0',
    documentation: {
      interactive: 'http://localhost:3004/docs',
      openapi_json: 'http://localhost:3004/api/openapi.json',
      openapi_yaml: 'http://localhost:3004/api/openapi.yaml'
    },
    features: [
      'Automatic OpenAPI 3.0 generation from Zod schemas',
      'Interactive Swagger UI documentation',
      'Full type safety with TypeScript inference',
      'Intelligent routing with automatic middleware ordering',
      'Comprehensive validation error documentation'
    ],
    endpoints: {
      users: {
        list: 'GET /users?limit=10&search=john&role=admin',
        create: 'POST /users',
        detail: 'GET /users/{id}',
        update: 'PUT /users/{id}',
        delete: 'DELETE /users/{id}',
        search: 'GET /users/search?q=john&type=name'
      },
      posts: {
        create: 'POST /posts'
      },
      system: {
        health: 'GET /health'
      }
    },
    tryExamples: [
      'curl "http://localhost:3004/users?limit=5&role=admin"',
      'curl -X POST http://localhost:3004/users -H "Content-Type: application/json" -d \'{"name": "Test User", "email": "test@example.com"}\'',
      'curl "http://localhost:3004/users/search?q=john&type=name"'
    ]
  };
});

// Start server
const port = parseInt(process.env.PORT || '3004');

app.listen(port, () => {
  console.log('API Documentation Demo Server Started');
  console.log(`HTTP API: http://localhost:${port}`);
  console.log(`Interactive Documentation: http://localhost:${port}/docs`);
  console.log(`OpenAPI JSON: http://localhost:${port}/api/openapi.json`);
  console.log(`OpenAPI YAML: http://localhost:${port}/api/openapi.yaml`);
  console.log('');
  console.log('Try these documented endpoints:');
  console.log(`  GET  http://localhost:${port}/users?limit=5&role=admin`);
  console.log(`  POST http://localhost:${port}/users`);
  console.log(`  GET  http://localhost:${port}/users/{id}`);
  console.log(`  PUT  http://localhost:${port}/users/{id}`);
  console.log(`  DELETE http://localhost:${port}/users/{id}`);
  console.log(`  GET  http://localhost:${port}/users/search?q=john&type=name`);
  console.log(`  POST http://localhost:${port}/posts`);
  console.log(`  GET  http://localhost:${port}/health`);
  console.log('');
  console.log('✨ Features demonstrated:');
  console.log('  • Automatic OpenAPI 3.0 generation from Zod schemas');
  console.log('  • Interactive Swagger UI with Try It Out functionality');
  console.log('  • Comprehensive validation documentation');
  console.log('  • Request/response examples generated automatically');
  console.log('  • Full type safety with TypeScript inference');
  console.log('  • Intelligent routing with automatic middleware ordering');
  console.log('');
  console.log(' Built with Moro Framework - Schema-First API Documentation');
});

export default app; 