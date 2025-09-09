// User Routes - HTTP Handlers with Intelligent Routing
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUserByEmail,
} from './actions';
import {
  UserQuerySchema,
  UserParamsSchema,
  CreateUserSchema,
  UpdateUserSchema,
  LoginSchema,
  RoleParamsSchema,
} from './schemas';

export const routes = [
  {
    method: 'GET' as const,
    path: '/',
    validation: {
      query: UserQuerySchema,
    },
    cache: { ttl: 60 },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Get all users with pagination and filtering',
    tags: ['users', 'list'],
    handler: async (req: any, res: any) => {
      const database = req.database || {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', active: true },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', active: true },
        ],
      };

      const users = await getAllUsers(database);

      // Apply query filtering
      let filteredUsers = users;
      if (req.query.role) {
        filteredUsers = filteredUsers.filter((user: any) => user.role === req.query.role);
      }
      if (req.query.active !== undefined) {
        filteredUsers = filteredUsers.filter((user: any) => user.active === req.query.active);
      }
      if (req.query.search) {
        filteredUsers = filteredUsers.filter(
          (user: any) =>
            user.name.toLowerCase().includes(req.query.search.toLowerCase()) ||
            user.email.toLowerCase().includes(req.query.search.toLowerCase())
        );
      }

      // Apply pagination
      const { limit, offset } = req.query;
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
    },
  },
  {
    method: 'GET' as const,
    path: '/:id',
    validation: {
      params: UserParamsSchema,
    },
    cache: { ttl: 300 },
    rateLimit: { requests: 200, window: 60000 },
    description: 'Get user by ID',
    tags: ['users', 'detail'],
    handler: async (req: any, res: any) => {
      const database = req.database || { users: [] };
      const id = req.params.id; // Already validated and coerced to number
      const user = await getUserById(id, database);

      if (!user) {
        res.status(404);
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: user };
    },
  },
  {
    method: 'POST' as const,
    path: '/',
    validation: {
      body: CreateUserSchema,
    },
    rateLimit: { requests: 20, window: 60000 },
    description: 'Create a new user',
    tags: ['users', 'create'],
    handler: async (req: any, res: any) => {
      const database = req.database || { users: [] };
      const events = req.events || { emit: async () => {} };

      const user = await createUser(req.body, database, events);

      res.status(201);
      return { success: true, data: user };
    },
  },
  {
    method: 'PUT' as const,
    path: '/:id',
    validation: {
      params: UserParamsSchema,
      body: UpdateUserSchema,
    },
    rateLimit: { requests: 50, window: 60000 },
    description: 'Update user by ID',
    tags: ['users', 'update'],
    handler: async (req: any, res: any) => {
      const database = req.database || { users: [] };
      const events = req.events || { emit: async () => {} };

      const id = req.params.id; // Already validated and coerced to number
      const user = await updateUser(id, req.body, database, events);

      if (!user) {
        res.status(404);
        return { success: false, error: 'User not found' };
      }

      return { success: true, data: user };
    },
  },
  {
    method: 'DELETE' as const,
    path: '/:id',
    validation: {
      params: UserParamsSchema,
    },
    rateLimit: { requests: 10, window: 60000 },
    description: 'Delete user by ID',
    tags: ['users', 'delete'],
    handler: async (req: any, res: any) => {
      const database = req.database || { users: [] };
      const events = req.events || { emit: async () => {} };

      const id = req.params.id; // Already validated and coerced to number
      const success = await deleteUser(id, database, events);

      if (!success) {
        res.status(404);
        return { success: false, error: 'User not found' };
      }

      return { success: true, message: 'User deleted successfully' };
    },
  },
  {
    method: 'GET' as const,
    path: '/role/:role',
    validation: {
      params: RoleParamsSchema,
    },
    cache: { ttl: 120 },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Get users by role',
    tags: ['users', 'filter', 'role'],
    handler: async (req: any, res: any) => {
      const database = req.database || { users: [] };
      const { role } = req.params; // Already validated
      const users = await getUsersByRole(role, database);
      return { success: true, data: users };
    },
  },
  {
    method: 'POST' as const,
    path: '/auth/login',
    validation: {
      body: LoginSchema,
    },
    rateLimit: { requests: 5, window: 60000 },
    description: 'Authenticate user login',
    tags: ['users', 'auth', 'login'],
    handler: async (req: any, res: any) => {
      const database = req.database || { users: [] };
      const { email, password } = req.body; // Already validated

      // Simple authentication logic (in production, use proper password hashing)
      const user = await getUserByEmail(email, database);

      if (!user || password !== 'password123') {
        // Mock password check
        res.status(401);
        return { success: false, error: 'Invalid credentials' };
      }

      return {
        success: true,
        data: {
          user,
          token: 'mock-jwt-token-' + Date.now(),
        },
        message: 'Login successful',
      };
    },
  },
];
