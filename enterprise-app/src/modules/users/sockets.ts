// User WebSocket Handlers
import { getAllUsers, updateUser } from './actions';

export const userSockets = [
  {
    event: 'users:list',
    handler: async (socket: any, data: any) => {
      try {
        // Socket handlers get database and events from the framework
        const database = socket.request?.database;
        const events = socket.request?.events;

        const users = await getAllUsers(database);
        socket.emit('users:all', users);
      } catch (error) {
        socket.emit('error', {
          event: 'users:list',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  },
  {
    event: 'users:update_profile',
    handler: async (socket: any, { id, updateData }: any) => {
      try {
        // Socket handlers get database and events from the framework
        const database = socket.request?.database;
        const events = socket.request?.events;

        const user = await updateUser(id, updateData, database, events);

        if (user) {
          socket.emit('user:profile_updated', user);
          socket.to('users').emit('user:profile_updated', user);
        } else {
          socket.emit('error', {
            event: 'users:update_profile',
            error: 'User not found',
          });
        }
      } catch (error) {
        socket.emit('error', {
          event: 'users:update_profile',
          error: error instanceof Error ? error.message : 'Update failed',
        });
      }
    },
  },
];
