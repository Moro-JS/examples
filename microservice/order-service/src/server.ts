// Order Service - Microservice Example
// Handles order management and coordinates with other services

import { createApp } from '@morojs/moro';
import { ServiceRegistry } from '@morojs/moro';

const app = createApp();

// Service Discovery Setup
const serviceRegistry = new ServiceRegistry({
  type: (process.env.DISCOVERY_TYPE as any) || 'memory',
  consulUrl: process.env.CONSUL_URL || 'http://consul:8500',
  kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
  healthCheckInterval: 30000,
  tags: ['order-management', 'fulfillment', 'v1'],
});

// Register this service
const serviceInfo = {
  name: 'order-service',
  host: process.env.SERVICE_HOST || 'localhost',
  port: parseInt(process.env.PORT || '3012'),
  health: '/health',
  version: '1.0.0',
  tags: ['order-management', 'fulfillment'],
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    startTime: new Date().toISOString(),
    dependencies: ['user-service', 'payment-service'],
  },
};

// Service URLs for inter-service communication
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3010';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3011';

// In-memory order store (in production, use a database)
const orders = new Map();
let nextOrderId = 1000;

// Order statuses
const ORDER_STATUSES = {
  PENDING: 'pending',
  PAYMENT_PROCESSING: 'payment_processing',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Mock inventory
const inventory = new Map([
  ['laptop', { id: 'laptop', name: 'Gaming Laptop', price: 1299.99, stock: 5 }],
  ['phone', { id: 'phone', name: 'Smartphone', price: 699.99, stock: 10 }],
  ['monitor', { id: 'monitor', name: '4K Monitor', price: 399.99, stock: 8 }],
  ['keyboard', { id: 'keyboard', name: 'Mechanical Keyboard', price: 129.99, stock: 15 }],
  ['mouse', { id: 'mouse', name: 'Gaming Mouse', price: 79.99, stock: 20 }],
]);

// Service health check
app.get('/health', async (req, res) => {
  // Check dependency health
  const dependencies: any = {};

  try {
    const userServiceResponse = await fetch(`${USER_SERVICE_URL}/health`, {
      timeout: 5000,
    } as any);
    dependencies.userService = userServiceResponse.ok ? 'healthy' : 'unhealthy';
  } catch {
    dependencies.userService = 'unreachable';
  }

  try {
    const paymentServiceResponse = await fetch(`${PAYMENT_SERVICE_URL}/health`, {
      timeout: 5000,
    } as any);
    dependencies.paymentService = paymentServiceResponse.ok ? 'healthy' : 'unhealthy';
  } catch {
    dependencies.paymentService = 'unreachable';
  }

  const isHealthy = Object.values(dependencies).every(status => status === 'healthy');

  const healthStatus = {
    service: 'order-service',
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    environment: process.env.NODE_ENV || 'development',
    dependencies,
    metrics: {
      totalOrders: orders.size,
      pendingOrders: Array.from(orders.values()).filter(
        (o: any) => o.status === ORDER_STATUSES.PENDING
      ).length,
      completedOrders: Array.from(orders.values()).filter(
        (o: any) => o.status === ORDER_STATUSES.DELIVERED
      ).length,
    },
  };

  res.statusCode = isHealthy ? 200 : 503;
  return healthStatus;
});

// Service info endpoint
app.get('/', (req, res) => {
  return {
    service: 'Order Management Service',
    version: '1.0.0',
    description: 'Handles order management and coordinates with other services',
    endpoints: [
      'GET /',
      'GET /health',
      'GET /orders',
      'GET /orders/:id',
      'POST /orders',
      'PUT /orders/:id/status',
      'GET /inventory',
      'POST /orders/:id/cancel',
      'GET /services',
    ],
    dependencies: [
      { service: 'user-service', url: USER_SERVICE_URL },
      { service: 'payment-service', url: PAYMENT_SERVICE_URL },
    ],
    serviceDiscovery: {
      type: serviceRegistry.constructor.name,
      registered: true,
      tags: serviceInfo.tags,
    },
    port: serviceInfo.port,
  };
});

// Get inventory
app.get('/inventory', (req, res) => {
  const inventoryList = Array.from(inventory.values());

  return {
    success: true,
    data: inventoryList,
    total: inventoryList.length,
    service: 'order-service',
    timestamp: new Date().toISOString(),
  };
});

// Get all orders
app.get('/orders', (req, res) => {
  const orderList = Array.from(orders.values());
  const status = req.query.status as string;
  const userId = req.query.userId as string;

  let filteredOrders = orderList;
  if (status) {
    filteredOrders = filteredOrders.filter((o: any) => o.status === status);
  }
  if (userId) {
    filteredOrders = filteredOrders.filter((o: any) => o.userId === parseInt(userId));
  }

  return {
    success: true,
    data: filteredOrders,
    total: filteredOrders.length,
    filters: { status, userId },
    service: 'order-service',
    timestamp: new Date().toISOString(),
  };
});

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.get(orderId);

  if (!order) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'Order not found',
      service: 'order-service',
    };
  }

  return {
    success: true,
    data: order,
    service: 'order-service',
  };
});

// Create new order
app.post('/orders', async (req, res) => {
  const { userId, items, shippingAddress, paymentMethod = 'stripe' } = req.body || {};

  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'User ID and items are required',
      service: 'order-service',
    };
  }

  try {
    // 1. Verify user exists
    const userResponse = await fetch(`${USER_SERVICE_URL}/users/${userId}`);
    if (!userResponse.ok) {
      res.statusCode = 400;
      return {
        success: false,
        error: 'Invalid user ID',
        service: 'order-service',
      };
    }
    const userData = await userResponse.json();

    // 2. Validate and calculate order total
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = inventory.get(item.productId);
      if (!product) {
        res.statusCode = 400;
        return {
          success: false,
          error: `Product not found: ${item.productId}`,
          service: 'order-service',
        };
      }

      if (product.stock < item.quantity) {
        res.statusCode = 400;
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          service: 'order-service',
        };
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });

      // Reserve inventory
      product.stock -= item.quantity;
      inventory.set(item.productId, product);
    }

    // 3. Create order
    const orderId = nextOrderId++;
    const order: any = {
      id: orderId,
      userId,
      userName: (userData as any).data.name,
      userEmail: (userData as any).data.email,
      items: orderItems,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      shippingAddress,
      paymentMethod,
      status: ORDER_STATUSES.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.set(orderId, order);

    // 4. Process payment
    try {
      order.status = ORDER_STATUSES.PAYMENT_PROCESSING;
      orders.set(orderId, order);

      const paymentResponse = await fetch(`${PAYMENT_SERVICE_URL}/payments/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          currency: 'USD',
          provider: paymentMethod,
          metadata: {
            orderId,
            userId,
            description: `Order #${orderId} - ${orderItems.length} items`,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if ((paymentData as any).success) {
        // Payment successful
        order.status = ORDER_STATUSES.CONFIRMED;
        order.paymentId = (paymentData as any).data.id;
        order.transactionId = (paymentData as any).data.transactionId;
        order.paidAt = new Date().toISOString();
      } else {
        // Payment failed - restore inventory
        for (const item of orderItems) {
          const product = inventory.get(item.productId);
          if (product) {
            product.stock += item.quantity;
            inventory.set(item.productId, product);
          }
        }

        order.status = ORDER_STATUSES.CANCELLED;
        order.cancelReason = 'Payment failed';
        order.paymentError = (paymentData as any).error || 'Unknown payment error';
      }
    } catch (error) {
      // Payment service error - restore inventory
      for (const item of orderItems) {
        const product = inventory.get(item.productId);
        if (product) {
          product.stock += item.quantity;
          inventory.set(item.productId, product);
        }
      }

      order.status = ORDER_STATUSES.CANCELLED;
      order.cancelReason = 'Payment service unavailable';
      order.paymentError = error instanceof Error ? error.message : 'Payment service error';
    }

    orders.set(orderId, order);

    // Emit order event
    const { events } = req;
    await events.emit('order.created', {
      orderId,
      userId,
      totalAmount,
      status: order.status,
      service: 'order-service',
    });

    res.statusCode = 201;
    return {
      success: true,
      data: order,
      service: 'order-service',
    };
  } catch (error) {
    res.statusCode = 500;
    return {
      success: false,
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error',
      service: 'order-service',
    };
  }
});

// Update order status
app.put('/orders/:id/status', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, reason } = req.body || {};
  const order = orders.get(orderId);

  if (!order) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'Order not found',
      service: 'order-service',
    };
  }

  if (!Object.values(ORDER_STATUSES).includes(status)) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Invalid status',
      validStatuses: Object.values(ORDER_STATUSES),
      service: 'order-service',
    };
  }

  const previousStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (reason) {
    order.statusReason = reason;
  }

  // Handle status-specific logic
  if (status === ORDER_STATUSES.SHIPPED) {
    order.shippedAt = new Date().toISOString();
    order.estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
  } else if (status === ORDER_STATUSES.DELIVERED) {
    order.deliveredAt = new Date().toISOString();
  }

  orders.set(orderId, order);

  // Emit status change event
  const { events } = req;
  await events.emit('order.status_changed', {
    orderId,
    previousStatus,
    newStatus: status,
    userId: order.userId,
    service: 'order-service',
  });

  return {
    success: true,
    data: order,
    message: `Order status updated to ${status}`,
    service: 'order-service',
  };
});

// Cancel order
app.post('/orders/:id/cancel', async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { reason = 'Customer request' } = req.body || {};
  const order = orders.get(orderId);

  if (!order) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'Order not found',
      service: 'order-service',
    };
  }

  if (
    [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED].includes(
      order.status
    )
  ) {
    res.statusCode = 400;
    return {
      success: false,
      error: `Cannot cancel order with status: ${order.status}`,
      service: 'order-service',
    };
  }

  const previousStatus = order.status;
  order.status = ORDER_STATUSES.CANCELLED;
  order.cancelReason = reason;
  order.cancelledAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  // Restore inventory
  for (const item of order.items) {
    const product = inventory.get(item.productId);
    if (product) {
      product.stock += item.quantity;
      inventory.set(item.productId, product);
    }
  }

  // Process refund if payment was successful
  if (order.paymentId && previousStatus === ORDER_STATUSES.CONFIRMED) {
    try {
      const refundResponse = await fetch(`${PAYMENT_SERVICE_URL}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: order.paymentId,
          amount: order.totalAmount,
          reason: `Order cancellation: ${reason}`,
        }),
      });

      if (refundResponse.ok) {
        const refundData = await refundResponse.json();
        order.refundId = (refundData as any).data.id;
        order.refundedAt = new Date().toISOString();
        order.status = ORDER_STATUSES.REFUNDED;
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      // Order is still cancelled, but refund failed
      order.refundError = 'Failed to process refund automatically';
    }
  }

  orders.set(orderId, order);

  // Emit cancellation event
  const { events } = req;
  await events.emit('order.cancelled', {
    orderId,
    userId: order.userId,
    reason,
    refunded: !!order.refundId,
    service: 'order-service',
  });

  return {
    success: true,
    data: order,
    message: 'Order cancelled successfully',
    service: 'order-service',
  };
});

// Service discovery endpoint
app.get('/services', async (req, res) => {
  try {
    const allServices = serviceRegistry.getAllServices();
    return {
      success: true,
      services: allServices,
      registry: {
        type: 'memory',
        healthChecks: true,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    res.statusCode = 500;
    return {
      success: false,
      error: 'Failed to retrieve services',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Start the service
async function startService() {
  try {
    // Register with service discovery
    await serviceRegistry.register(serviceInfo);

    // Start the HTTP server
    app.listen(serviceInfo.port);

    console.log(`
Order Service (Microservice-Ready)
=====================================
Port: ${serviceInfo.port}
Environment: ${process.env.NODE_ENV || 'development'}
Service Discovery: ${process.env.DISCOVERY_TYPE || 'memory'}
Health Check: http://${serviceInfo.host}:${serviceInfo.port}/health
Endpoints: 9
Features: Order management, payment coordination, inventory tracking
Dependencies: user-service (${USER_SERVICE_URL}), payment-service (${PAYMENT_SERVICE_URL})
Inter-service: Emits order lifecycle events
Containerized: ${!!process.env.KUBERNETES_SERVICE_HOST}
`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      await serviceRegistry.deregister('order-service');
      serviceRegistry.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      await serviceRegistry.deregister('order-service');
      serviceRegistry.destroy();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start order service:', error);
    process.exit(1);
  }
}

// Start the service
startService();
