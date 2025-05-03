// Order Actions - Pure Business Logic
import { Order, CreateOrderRequest, UpdateOrderRequest } from './types';

// Pure business logic functions that receive dependencies as parameters
export async function getAllOrders(database: any): Promise<Order[]> {
  return database.orders || [];
}

export async function getOrderById(id: number, database: any): Promise<Order | null> {
  const orders = database.orders || [];
  return orders.find((order: Order) => order.id === id) || null;
}

export async function getOrdersByUserId(userId: number, database: any): Promise<Order[]> {
  const orders = database.orders || [];
  return orders.filter((order: Order) => order.userId === userId);
}

export async function createOrder(orderData: CreateOrderRequest, database: any, events: any): Promise<Order> {
  const orders = database.orders || [];
  
  // Calculate total from items (simplified - in real app would fetch product prices)
  const total = orderData.items.reduce((sum, item) => sum + (item.quantity * 100), 0); // Mock $1 per item
  
  const newOrder: Order = {
    id: Math.max(...orders.map((o: Order) => o.id), 0) + 1,
    userId: orderData.userId,
    items: orderData.items.map(item => ({
      productId: item.productId,
      productName: `Product ${item.productId}`,
      quantity: item.quantity,
      price: 100 // Mock price
    })),
    total,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  orders.push(newOrder);
  
  // Intentional event emission
  await events.emit('order.created', { order: newOrder });
  
  return newOrder;
}

export async function updateOrder(id: number, updateData: UpdateOrderRequest, database: any, events: any): Promise<Order | null> {
  const orders = database.orders || [];
  const orderIndex = orders.findIndex((order: Order) => order.id === id);
  
  if (orderIndex === -1) {
    return null;
  }

  const updates: any = {};
  if (updateData.status !== undefined) updates.status = updateData.status;
  if (updateData.items !== undefined) updates.items = updateData.items;
  
  if (Object.keys(updates).length === 0) {
    return orders[orderIndex];
  }
  
  updates.updatedAt = new Date();
  orders[orderIndex] = { ...orders[orderIndex], ...updates };
  
  // Intentional event emission
  await events.emit('order.updated', { order: orders[orderIndex], changes: updates });
  
  return orders[orderIndex];
}

export async function deleteOrder(id: number, database: any, events: any): Promise<boolean> {
  const orders = database.orders || [];
  const orderIndex = orders.findIndex((order: Order) => order.id === id);
  
  if (orderIndex === -1) {
    return false;
  }

  const order = orders[orderIndex];
  orders.splice(orderIndex, 1);
  
  // Intentional event emission
  await events.emit('order.deleted', { orderId: id, order });
  
  return true;
}

export async function getOrdersByStatus(status: string, database: any): Promise<Order[]> {
  const orders = database.orders || [];
  return orders.filter((order: Order) => order.status === status);
} 