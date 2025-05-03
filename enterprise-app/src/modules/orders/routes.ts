// Order Routes - HTTP Handlers
import { 
  getAllOrders, 
  getOrderById, 
  getOrdersByUserId,
  createOrder, 
  updateOrder,
  getOrdersByStatus
} from './actions';

export const routes = [
  {
    method: 'GET' as const,
    path: '/',
    handler: async (req: any, res: any) => {
      const database = req.database || { orders: [
        { id: 1, userId: 1, items: [{ productId: 1, productName: 'Laptop', quantity: 1, price: 999 }], total: 999, status: 'completed' },
        { id: 2, userId: 2, items: [{ productId: 2, productName: 'Mouse', quantity: 1, price: 29 }], total: 29, status: 'pending' }
      ]};
      
      const orders = await getAllOrders(database);
      res.json({ 
        success: true, 
        data: orders,
        total: orders.length
      });
    },
    rateLimit: { requests: 100, window: 60000 }
  },
  {
    method: 'GET' as const,
    path: '/:id',
    handler: async (req: any, res: any) => {
      const database = req.database || { orders: [] };
      const id = parseInt(req.params.id);
      const order = await getOrderById(id, database);
      
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      
      res.json({ success: true, data: order });
    }
  },
  {
    method: 'GET' as const,
    path: '/user/:userId',
    handler: async (req: any, res: any) => {
      const database = req.database || { orders: [] };
      const userId = parseInt(req.params.userId);
      const orders = await getOrdersByUserId(userId, database);
      res.json({ 
        success: true, 
        data: orders,
        total: orders.length
      });
    }
  },
  {
    method: 'POST' as const,
    path: '/',
    handler: async (req: any, res: any) => {
      const database = req.database || { orders: [] };
      const events = req.events || { emit: async () => {} };
      
      const order = await createOrder(req.body, database, events);
      
      res.status(201).json({ success: true, data: order });
    },
    rateLimit: { requests: 20, window: 60000 }
  },
  {
    method: 'PUT' as const,
    path: '/:id/status',
    handler: async (req: any, res: any) => {
      const database = req.database || { orders: [] };
      const events = req.events || { emit: async () => {} };
      
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const order = await updateOrder(id, { status }, database, events);
      
      if (!order) {
        res.status(404).json({ success: false, error: 'Order not found' });
        return;
      }
      
      res.json({ success: true, data: order });
    }
  },
  {
    method: 'GET' as const,
    path: '/status/:status',
    handler: async (req: any, res: any) => {
      const database = req.database || { orders: [] };
      const { status } = req.params;
      const orders = await getOrdersByStatus(status, database);
      res.json({ 
        success: true, 
        data: orders,
        total: orders.length
      });
    }
  }
]; 