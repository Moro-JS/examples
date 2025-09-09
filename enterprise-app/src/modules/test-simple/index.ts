// Test Simple Module - Functional Structure
import { defineModule } from '@morojs/moro';

export default defineModule({
  name: 'test-simple',
  version: '1.0.0',
  routes: [
    {
      method: 'GET',
      path: '/simple',
      handler: async (req: any, res: any) => {
        return { message: 'Simple test module working!', timestamp: new Date() };
      },
    },
  ],
});
