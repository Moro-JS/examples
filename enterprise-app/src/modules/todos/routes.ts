// Todo Routes - HTTP Handlers with Intelligent Routing
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  getTodosByPriority,
  getCompletedTodos,
  getPendingTodos,
} from './actions';
import {
  TodoQuerySchema,
  TodoParamsSchema,
  CreateTodoSchema,
  UpdateTodoSchema,
  PriorityParamsSchema,
} from './schemas';

export const routes = [
  {
    method: 'GET' as const,
    path: '/',
    validation: {
      query: TodoQuerySchema,
    },
    cache: { ttl: 60 },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Get all todos with pagination and filtering',
    tags: ['todos', 'list'],
    handler: async (req: any, res: any) => {
      const database = req.database || {
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

      const todos = await getAllTodos(database);

      // Apply query filtering
      let filteredTodos = todos;
      if (req.query.priority) {
        filteredTodos = filteredTodos.filter((todo: any) => todo.priority === req.query.priority);
      }
      if (req.query.completed !== undefined) {
        filteredTodos = filteredTodos.filter((todo: any) => todo.completed === req.query.completed);
      }
      if (req.query.search) {
        filteredTodos = filteredTodos.filter(
          (todo: any) =>
            todo.title.toLowerCase().includes(req.query.search.toLowerCase()) ||
            todo.description?.toLowerCase().includes(req.query.search.toLowerCase())
        );
      }

      // Apply pagination
      const { limit, offset } = req.query;
      const paginatedTodos = filteredTodos.slice(Number(offset), Number(offset) + Number(limit));

      return {
        success: true,
        data: paginatedTodos,
        pagination: {
          total: filteredTodos.length,
          limit,
          offset,
          hasMore: Number(offset) + Number(limit) < filteredTodos.length,
        },
      };
    },
  },
  {
    method: 'GET' as const,
    path: '/:id',
    validation: {
      params: TodoParamsSchema,
    },
    cache: { ttl: 300 },
    rateLimit: { requests: 200, window: 60000 },
    description: 'Get todo by ID',
    tags: ['todos', 'detail'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const id = req.params.id; // Already validated and coerced to number
      const todo = await getTodoById(id, database);

      if (!todo) {
        res.status(404);
        return { success: false, error: 'Todo not found' };
      }

      return { success: true, data: todo };
    },
  },
  {
    method: 'POST' as const,
    path: '/',
    validation: {
      body: CreateTodoSchema,
    },
    rateLimit: { requests: 50, window: 60000 },
    description: 'Create a new todo',
    tags: ['todos', 'create'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const events = req.events || { emit: async () => {} };

      const todo = await createTodo(req.body, database, events);

      res.status(201);
      return { success: true, data: todo };
    },
  },
  {
    method: 'PUT' as const,
    path: '/:id',
    validation: {
      params: TodoParamsSchema,
      body: UpdateTodoSchema,
    },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Update todo by ID',
    tags: ['todos', 'update'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const events = req.events || { emit: async () => {} };

      const id = req.params.id; // Already validated and coerced to number
      const todo = await updateTodo(id, req.body, database, events);

      if (!todo) {
        res.status(404);
        return { success: false, error: 'Todo not found' };
      }

      return { success: true, data: todo };
    },
  },
  {
    method: 'DELETE' as const,
    path: '/:id',
    validation: {
      params: TodoParamsSchema,
    },
    rateLimit: { requests: 50, window: 60000 },
    description: 'Delete todo by ID',
    tags: ['todos', 'delete'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const events = req.events || { emit: async () => {} };

      const id = req.params.id; // Already validated and coerced to number
      const success = await deleteTodo(id, database, events);

      if (!success) {
        res.status(404);
        return { success: false, error: 'Todo not found' };
      }

      return { success: true, message: 'Todo deleted successfully' };
    },
  },
  {
    method: 'GET' as const,
    path: '/filter/priority/:priority',
    validation: {
      params: PriorityParamsSchema,
    },
    cache: { ttl: 120 },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Get todos by priority level',
    tags: ['todos', 'filter', 'priority'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const { priority } = req.params; // Already validated
      const todos = await getTodosByPriority(priority, database);
      return { success: true, data: todos };
    },
  },
  {
    method: 'GET' as const,
    path: '/filter/completed',
    cache: { ttl: 120 },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Get completed todos',
    tags: ['todos', 'filter', 'completed'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const todos = await getCompletedTodos(database);
      return { success: true, data: todos };
    },
  },
  {
    method: 'GET' as const,
    path: '/filter/pending',
    cache: { ttl: 120 },
    rateLimit: { requests: 100, window: 60000 },
    description: 'Get pending todos',
    tags: ['todos', 'filter', 'pending'],
    handler: async (req: any, res: any) => {
      const database = req.database || { todos: [] };
      const todos = await getPendingTodos(database);
      return { success: true, data: todos };
    },
  },
];
