// System Schemas - Input Validation
import { z } from 'zod';

export const SystemCommandSchema = z.object({
  command: z.enum(['memory', 'uptime', 'load', 'cpu', 'all']).default('all')
}); 