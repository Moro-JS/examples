// Task Schemas - Input Validation
import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const UpdateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export const TaskIdSchema = z.object({
  id: z.string().uuid(),
});

export const TaskFiltersSchema = z.object({
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
});
