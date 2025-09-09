// System Routes - HTTP API for debugging
// import { RouteConfig } from '@morojs/moro';
import * as actions from './actions';
import { SystemCommandSchema } from './schemas';

export const routes: any[] = [
  {
    method: 'GET',
    path: '/',
    handler: async (req, res) => {
      const database = req.database || {};
      const { command } = SystemCommandSchema.parse(req.query);

      switch (command) {
        case 'memory':
          return { data: await actions.getMemoryInfo(database) };
        case 'uptime':
          return { data: await actions.getUptimeInfo(database) };
        case 'load':
          return { data: await actions.getLoadAverageInfo(database) };
        case 'cpu':
          return { data: await actions.getCpuInfo(database) };
        case 'all':
        default:
          return { data: await actions.getSystemInfo(database) };
      }
    },
    description: 'Get system information',
  },

  {
    method: 'GET',
    path: '/memory',
    handler: async (req, res) => {
      const database = req.database || {};
      return { memory: await actions.getMemoryInfo(database) };
    },
    description: 'Get detailed memory information',
  },

  {
    method: 'GET',
    path: '/cpu',
    handler: async (req, res) => {
      const database = req.database || {};
      return { cpu: await actions.getCpuInfo(database) };
    },
    description: 'Get CPU information',
  },
];
