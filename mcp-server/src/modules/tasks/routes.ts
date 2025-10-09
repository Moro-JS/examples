// Task Routes - HTTP API for debugging
// import { RouteConfig } from '@morojs/moro';
import * as actions from './actions';
import { CreateTaskSchema, UpdateTaskSchema, TaskIdSchema, TaskFiltersSchema } from './schemas';

export const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: async (req, res) => {
      return {
        message: 'Tasks API',
        description: 'Task management system with full CRUD operations',
        endpoints: {
          list: '/tasks',
          create: 'POST /tasks',
          get: '/tasks/:id',
          update: 'PUT /tasks/:id',
          delete: 'DELETE /tasks/:id',
        },
        version: '1.0.0',
      };
    },
    description: 'Tasks API information',
  },

  {
    method: 'GET',
    path: '/tasks',
    handler: async (req, res) => {
      const database = req.database || { tasks: [] };
      const filters = TaskFiltersSchema.parse(req.query);
      const tasks = await actions.getTasksWithFilters(filters, database);
      return { tasks, total: tasks.length };
    },
    description: 'Get all tasks with optional filtering',
  },

  {
    method: 'GET',
    path: '/tasks/:id',
    handler: async (req, res) => {
      const database = req.database || { tasks: [] };
      const { id } = TaskIdSchema.parse({ id: req.params.id });
      const task = await actions.getTaskById(id, database);

      if (!task) {
        res.statusCode = 404;
        return { error: 'Task not found' };
      }

      return { task };
    },
    description: 'Get a specific task by ID',
  },

  {
    method: 'POST',
    path: '/tasks',
    body: CreateTaskSchema,
    handler: async (req, res) => {
      const database = req.database || { tasks: [] };
      const events = req.events || {};
      const task = await actions.createTask(req.body, database, events);
      res.statusCode = 201;
      return { task };
    },
    description: 'Create a new task',
  },

  {
    method: 'PUT',
    path: '/tasks/:id',
    body: UpdateTaskSchema,
    handler: async (req, res) => {
      const database = req.database || { tasks: [] };
      const events = req.events || {};
      const updates = { ...req.body, id: req.params.id };
      const task = await actions.updateTask(req.params.id, updates, database, events);

      if (!task) {
        res.statusCode = 404;
        return { error: 'Task not found' };
      }

      return { task };
    },
    description: 'Update an existing task',
  },

  {
    method: 'DELETE',
    path: '/tasks/:id',
    handler: async (req, res) => {
      const database = req.database || { tasks: [] };
      const events = req.events || {};
      const deleted = await actions.deleteTask(req.params.id, database, events);

      if (!deleted) {
        res.statusCode = 404;
        return { error: 'Task not found' };
      }

      return { success: true };
    },
    description: 'Delete a task',
  },
];
