import { AppConfig } from '@morojs/moro';

export default {
  server: {
    port: 3000,
    host: '0.0.0.0',
    environment: 'development',
  },
  logging: {
    level: 'info',
    format: 'pretty',
    enableColors: true,
    enableTimestamp: true,
  },
  modules: {
    cache: {
      enabled: true,
      defaultTtl: 300,
    },
    validation: {
      enabled: true,
      stripUnknown: true,
    },
  },
} as Partial<AppConfig>;
