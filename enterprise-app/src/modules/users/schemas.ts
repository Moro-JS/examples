// User Validation Schemas using Zod
import { z } from 'zod';

// Base schemas
export const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']),
  active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

// Request schemas
export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'moderator']).default('user'),
  password: z.string().min(8).max(128),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  active: z.boolean().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Parameter schemas
export const UserParamsSchema = z.object({
  id: z.coerce.number().min(1),
});

export const RoleParamsSchema = z.object({
  role: z.enum(['admin', 'user', 'moderator']),
});

// Query schemas
export const UserQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  role: z.enum(['admin', 'user', 'moderator']).optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

// Export types for TypeScript inference
export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type UserParams = z.infer<typeof UserParamsSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
