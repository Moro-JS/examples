// Weather Schemas - Input Validation
import { z } from 'zod';

export const WeatherQuerySchema = z.object({
  location: z.string().min(1).max(100),
  units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  includeForecast: z.boolean().default(true)
});

export const LocationSearchSchema = z.object({
  query: z.string().min(1).max(100)
}); 