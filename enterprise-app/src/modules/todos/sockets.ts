// Todo WebSocket Handlers
import { getAllTodos, getTodoById, createTodo, updateTodo, deleteTodo } from './actions';

export const todoSockets = [
  {
    event: 'todos:list',
    handler: async (socket: any, data: any) => {
      try {
        // Socket handlers get database from the framework
        const database = socket.request?.database;
        
        const todos = await getAllTodos(database);
        socket.emit('todos:all', todos);
      } catch (error) {
        socket.emit('error', { 
          event: 'todos:list', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  },
  {
    event: 'todos:create',
    handler: async (socket: any, data: any) => {
      try {
        // Socket handlers get database and events from the framework
        const database = socket.request?.database;
        const events = socket.request?.events;
        
        const todo = await createTodo(data, database, events);
        socket.emit('todo:created', todo);
        socket.to('todos').emit('todo:created', todo);
      } catch (error) {
        socket.emit('error', { 
          event: 'todos:create', 
          error: error instanceof Error ? error.message : 'Creation failed' 
        });
      }
    }
  },
  {
    event: 'todos:update',
    handler: async (socket: any, { id, updateData }: any) => {
      try {
        // Socket handlers get database and events from the framework
        const database = socket.request?.database;
        const events = socket.request?.events;
        
        const todo = await updateTodo(id, updateData, database, events);
        
        if (todo) {
          socket.emit('todo:updated', todo);
          socket.to('todos').emit('todo:updated', todo);
        } else {
          socket.emit('error', { 
            event: 'todos:update', 
            error: 'Todo not found' 
          });
        }
      } catch (error) {
        socket.emit('error', { 
          event: 'todos:update', 
          error: error instanceof Error ? error.message : 'Update failed' 
        });
      }
    }
  },
  {
    event: 'todos:delete',
    handler: async (socket: any, { id }: any) => {
      try {
        // Socket handlers get database and events from the framework
        const database = socket.request?.database;
        const events = socket.request?.events;
        
        const success = await deleteTodo(id, database, events);
        
        if (success) {
          socket.emit('todo:deleted', { id });
          socket.to('todos').emit('todo:deleted', { id });
        } else {
          socket.emit('error', { 
            event: 'todos:delete', 
            error: 'Todo not found' 
          });
        }
      } catch (error) {
        socket.emit('error', { 
          event: 'todos:delete', 
          error: error instanceof Error ? error.message : 'Deletion failed' 
        });
      }
    }
  },
  {
    event: 'todos:toggle',
    handler: async (socket: any, { id }: any) => {
      try {
        // Socket handlers get database and events from the framework
        const database = socket.request?.database;
        const events = socket.request?.events;
        
        const existing = await getTodoById(id, database);
        if (!existing) {
          socket.emit('error', { 
            event: 'todos:toggle', 
            error: 'Todo not found' 
          });
          return;
        }

        const todo = await updateTodo(id, {
          completed: !existing.completed
        }, database, events);
        
        if (todo) {
          socket.emit('todo:toggled', todo);
          socket.to('todos').emit('todo:toggled', todo);
        }
      } catch (error) {
        socket.emit('error', { 
          event: 'todos:toggle', 
          error: error instanceof Error ? error.message : 'Toggle failed' 
        });
      }
    }
  }
]; 