// Todo Validation Schemas using Zod
import { z } from 'zod';

// Base schemas
export const TodoSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  completed: z.boolean(),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Request schemas
export const CreateTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().datetime().optional()
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime().optional()
});

// Parameter schemas
export const TodoParamsSchema = z.object({
  id: z.coerce.number().min(1)
});

export const PriorityParamsSchema = z.object({
  priority: z.enum(['low', 'medium', 'high'])
});

// Query schemas
export const TodoQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  completed: z.coerce.boolean().optional(),
  search: z.string().optional()
});

// Export types for TypeScript inference
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoRequest = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoRequest = z.infer<typeof UpdateTodoSchema>;
export type TodoParams = z.infer<typeof TodoParamsSchema>;
export type TodoQuery = z.infer<typeof TodoQuerySchema>; 