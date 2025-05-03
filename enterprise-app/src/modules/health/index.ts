// Health Module - Functional Structure
import { defineModule } from '@morojs/moro';
import { routes } from './routes';
import { config } from './config';

export default defineModule({
  name: 'health',
  version: '1.0.0',
  config,
  routes
  // No sockets for health module
});

// Export types for other modules to use
export * from './types';