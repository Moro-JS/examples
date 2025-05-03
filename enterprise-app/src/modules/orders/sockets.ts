// Order WebSocket Handlers
import { getAllOrders, getOrderById } from './actions';

export const orderSockets = [
  {
    event: 'orders:list',
    handler: async (socket: any, data: any) => {
      try {
        // Socket handlers get database from the framework
        const database = socket.request?.database;
        
        const orders = await getAllOrders(database);
        socket.emit('orders:all', orders);
      } catch (error) {
        socket.emit('error', { 
          event: 'orders:list', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  },
  {
    event: 'orders:get',
    handler: async (socket: any, { orderId }: any) => {
      try {
        // Socket handlers get database from the framework
        const database = socket.request?.database;
        
        const order = await getOrderById(orderId, database);
        
        if (order) {
          socket.emit('order:details', order);
        } else {
          socket.emit('error', { 
            event: 'orders:get', 
            error: 'Order not found' 
          });
        }
      } catch (error) {
        socket.emit('error', { 
          event: 'orders:get', 
          error: error instanceof Error ? error.message : 'Failed to get order' 
        });
      }
    }
  }
]; 