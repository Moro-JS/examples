// Comprehensive Zod Validation Examples for Moro Framework
import 'reflect-metadata';
import { createApp, validate, body, query, params, z } from '@morojs/moro';

const app = createApp({
  cors: true,
  compression: true,
  helmet: true,
});

// Example schemas
const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).max(120).optional(),
  tags: z.array(z.string()).optional(),
});

const UserQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'email', 'age']).default('name'),
});

const UserParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

// Mock data
const users: any[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  {
    id: '223e4567-e89b-12d3-a456-426614174001',
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
  },
];

// 1. Body validation example
app.post(
  '/users',
  validate(
    {
      body: UserSchema,
    },
    (req, res) => {
      // req.body is fully typed as z.infer<typeof UserSchema>
      console.log('Creating user:', req.body);

      const newUser = {
        id: crypto.randomUUID(),
        ...req.body,
      };

      users.push(newUser);

      return {
        success: true,
        data: newUser,
        message: 'User created successfully',
      };
    }
  )
);

// 2. Query validation example
app.get(
  '/users',
  validate(
    {
      query: UserQuerySchema,
    },
    (req, res) => {
      // req.query is fully typed and has defaults applied
      console.log('Query params:', req.query);

      const { limit, offset, search, sortBy } = req.query;
      let filteredUsers = [...users];

      // Apply search filter
      if (search) {
        filteredUsers = filteredUsers.filter(
          user =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply sorting
      filteredUsers.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
        return 0;
      });

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
    }
  )
);

// 3. Path parameters validation example
app.get(
  '/users/:id',
  validate(
    {
      params: UserParamsSchema,
    },
    (req, res) => {
      // req.params.id is validated as UUID
      const user = users.find(u => u.id === req.params.id);

      if (!user) {
        res.status(404);
        return {
          success: false,
          error: 'User not found',
        };
      }

      return {
        success: true,
        data: user,
      };
    }
  )
);

// 4. Multiple validation types in one route
app.put(
  '/users/:id',
  validate(
    {
      params: UserParamsSchema,
      body: UserSchema.partial(), // Allow partial updates
      query: z.object({
        notify: z.coerce.boolean().default(false),
      }),
    },
    (req, res) => {
      const userIndex = users.findIndex(u => u.id === req.params.id);

      if (userIndex === -1) {
        res.status(404);
        return {
          success: false,
          error: 'User not found',
        };
      }

      // Update user
      users[userIndex] = { ...users[userIndex], ...req.body };

      console.log('Notification enabled:', req.query.notify);

      return {
        success: true,
        data: users[userIndex],
        message: 'User updated successfully',
      };
    }
  )
);

// 5. Complex nested validation
const CreatePostSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10),
  author: z.object({
    id: z.string().uuid(),
    name: z.string().min(2),
  }),
  tags: z.array(z.string().min(1)).min(1).max(10),
  metadata: z.object({
    category: z.enum(['tech', 'lifestyle', 'business']),
    publishAt: z.string().datetime().optional(),
    featured: z.boolean().default(false),
  }),
  settings: z
    .object({
      allowComments: z.boolean().default(true),
      visibility: z.enum(['public', 'private', 'draft']).default('draft'),
    })
    .optional(),
});

app.post(
  '/posts',
  validate(
    {
      body: CreatePostSchema,
    },
    (req, res) => {
      console.log('Creating post with complex validation:', req.body);

      return {
        success: true,
        data: {
          id: crypto.randomUUID(),
          ...req.body,
          createdAt: new Date().toISOString(),
        },
        message: 'Post created successfully',
      };
    }
  )
);

// 6. Convenience function examples (single field validation)
app.post(
  '/users-simple',
  body(UserSchema)(async (req, res) => {
    // Using the body() convenience function
    return {
      success: true,
      data: { id: crypto.randomUUID(), ...req.body },
    };
  })
);

app.get(
  '/users-simple',
  query(UserQuerySchema)(async (req, res) => {
    // Using the query() convenience function
    return {
      success: true,
      data: users.slice(
        Number(req.query.offset),
        Number(req.query.offset) + Number(req.query.limit)
      ),
    };
  })
);

// 7. Custom validation with refinements
const PasswordResetSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

app.post(
  '/reset-password',
  validate(
    {
      body: PasswordResetSchema,
    },
    (req, res) => {
      return {
        success: true,
        message: 'Password reset successfully',
      };
    }
  )
);

// 8. Transform and coerce examples
const SearchSchema = z.object({
  q: z.string().transform(val => val.toLowerCase().trim()),
  page: z.coerce.number().min(1).default(1),
  tags: z
    .string()
    .transform(val => val.split(',').map(t => t.trim()))
    .optional(),
});

app.get(
  '/search',
  validate(
    {
      query: SearchSchema,
    },
    (req, res) => {
      console.log('Transformed query:', req.query);
      // q is lowercased and trimmed
      // page is converted to number
      // tags is split into array

      return {
        success: true,
        query: req.query,
        message: 'Search completed',
      };
    }
  )
);

// Error handling example
app.get('/error-example', (req, res) => {
  return {
    message: 'Try posting invalid data to any of the endpoints above to see validation errors',
    examples: {
      invalidUser: 'POST /users with { "name": "x", "email": "invalid" }',
      invalidQuery: 'GET /users?limit=1000&sortBy=invalid',
      invalidUUID: 'GET /users/not-a-uuid',
    },
  };
});

// Start server
const port = parseInt(process.env.PORT || '3002');

app.listen(port, () => {
  console.log('Zod Validation Examples Server Started');
  console.log(`HTTP API: http://localhost:${port}`);
  console.log('');
  console.log('Try these validation examples:');
  console.log(`  POST http://localhost:${port}/users`);
  console.log(`  GET  http://localhost:${port}/users?limit=5&search=john`);
  console.log(`  GET  http://localhost:${port}/users/:id`);
  console.log(`  PUT  http://localhost:${port}/users/:id`);
  console.log(`  POST http://localhost:${port}/posts`);
  console.log(`  POST http://localhost:${port}/reset-password`);
  console.log(`  GET  http://localhost:${port}/search?q=HELLO&page=2&tags=tech,api`);
  console.log('');
  console.log('✨ All endpoints have full TypeScript type safety!');
  console.log(' Built with Zod validation and Moro Framework');
});

export default app;
