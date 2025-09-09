// Order Module - Functional Structure
import { config } from './config';
import { routes } from './routes';
import { orderSockets as sockets } from './sockets';
import { defineModule } from '@morojs/moro';

export default defineModule({
  name: 'orders',
  version: '1.0.0',
  config,
  routes,
  sockets,
});

// Re-export types and actions for direct usage
export * from './types';
export * from './actions';
