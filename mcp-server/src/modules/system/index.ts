// System Module - Functional Structure
import { config } from './config';
import { routes } from './routes';
import { defineModule } from '@morojs/moro';

export default defineModule({
  name: 'system',
  version: '1.0.0',
  config,
  routes,
});

// Re-export types and actions for direct usage
export * from './types';
export * from './actions';
export * from './schemas';
