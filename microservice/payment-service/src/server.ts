// Payment Service - Microservice Example
// Handles payment processing and transaction management

import { createApp } from '@morojs/moro';
import { ServiceRegistry } from 'moro/src/core/networking/service-discovery';

const app = createApp();

// Service Discovery Setup
const serviceRegistry = new ServiceRegistry({
  type: process.env.DISCOVERY_TYPE as any || 'memory',
  consulUrl: process.env.CONSUL_URL || 'http://consul:8500',
  kubernetesNamespace: process.env.K8S_NAMESPACE || 'default',
  healthCheckInterval: 30000,
  tags: ['payment-processing', 'transactions', 'v1']
});

// Register this service
const serviceInfo = {
  name: 'payment-service',
  host: process.env.SERVICE_HOST || 'localhost',
  port: parseInt(process.env.PORT || '3011'),
  health: '/health',
  version: '1.0.0',
  tags: ['payment-processing', 'transactions'],
  metadata: {
    environment: process.env.NODE_ENV || 'development',
    startTime: new Date().toISOString(),
    capabilities: ['credit-card', 'paypal', 'stripe', 'crypto']
  }
};

// In-memory payment store (in production, use a database)
const payments = new Map();
const transactions = new Map();
let nextPaymentId = 1;
let nextTransactionId = 1001;

// Mock payment providers
const paymentProviders = {
  stripe: { status: 'active', processingFee: 0.029, fixedFee: 0.30 },
  paypal: { status: 'active', processingFee: 0.034, fixedFee: 0.00 },
  square: { status: 'active', processingFee: 0.026, fixedFee: 0.10 },
  crypto: { status: 'maintenance', processingFee: 0.015, fixedFee: 0.00 }
};

// Service health check
app.get('/health', (req, res) => {
  const healthStatus = {
    service: 'payment-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development',
    dependencies: {
      stripe: paymentProviders.stripe.status,
      paypal: paymentProviders.paypal.status,
      square: paymentProviders.square.status,
      crypto: paymentProviders.crypto.status
    },
    metrics: {
      totalPayments: payments.size,
      totalTransactions: transactions.size,
      successfulTransactions: Array.from(transactions.values()).filter((t: any) => t.status === 'completed').length
    }
  };
  
  res.statusCode = 200;
  return healthStatus;
});

// Service info endpoint
app.get('/', (req, res) => {
  return {
    service: 'Payment Processing Service',
    version: '1.0.0',
    description: 'Handles payment processing and transaction management',
    endpoints: [
      'GET /',
      'GET /health',
      'GET /payments',
      'GET /payments/:id',
      'POST /payments/process',
      'GET /transactions',
      'GET /transactions/:id',
      'GET /providers',
      'POST /refunds',
      'GET /services'
    ],
    supportedProviders: Object.keys(paymentProviders),
    capabilities: serviceInfo.metadata?.capabilities,
    serviceDiscovery: {
      type: serviceRegistry.constructor.name,
      registered: true,
      tags: serviceInfo.tags
    },
    port: serviceInfo.port
  };
});

// Get payment providers
app.get('/providers', (req, res) => {
  return {
    success: true,
    providers: paymentProviders,
    timestamp: new Date().toISOString()
  };
});

// Process payment
app.post('/payments/process', async (req, res) => {
  const { amount, currency = 'USD', provider = 'stripe', paymentMethod, metadata = {} } = req.body || {};
  
  if (!amount || amount <= 0) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Invalid amount',
      service: 'payment-service'
    };
  }

  if (!paymentProviders[provider]) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Unsupported payment provider',
      supportedProviders: Object.keys(paymentProviders),
      service: 'payment-service'
    };
  }

  if (paymentProviders[provider].status !== 'active') {
    res.statusCode = 503;
    return {
      success: false,
      error: 'Payment provider temporarily unavailable',
      provider: provider,
      status: paymentProviders[provider].status,
      service: 'payment-service'
    };
  }

  // Simulate payment processing
  const processingTime = Math.random() * 2000 + 500; // 0.5-2.5 seconds
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // Simulate occasional failures (5% failure rate)
  const shouldFail = Math.random() < 0.05;

  const transactionId = `tx_${nextTransactionId++}`;
  const paymentId = nextPaymentId++;

  const providerFee = amount * paymentProviders[provider].processingFee + paymentProviders[provider].fixedFee;
  const netAmount = amount - providerFee;

  const payment: any = {
    id: paymentId,
    transactionId,
    amount,
    currency,
    provider,
    status: shouldFail ? 'failed' : 'completed',
    paymentMethod: paymentMethod || 'card',
    fees: {
      processing: parseFloat(providerFee.toFixed(2)),
      net: parseFloat(netAmount.toFixed(2))
    },
    metadata,
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    processingTime: Math.round(processingTime)
  };

  if (shouldFail) {
    payment.error = 'Payment declined by provider';
    payment.errorCode = 'CARD_DECLINED';
  }

  payments.set(paymentId, payment);
  transactions.set(transactionId, {
    id: transactionId,
    paymentId,
    type: 'payment',
    status: payment.status,
    amount,
    currency,
    provider,
    timestamp: new Date().toISOString()
  });

  // Emit payment event
  const { events } = req;
  await events.emit('payment.processed', {
    paymentId,
    transactionId,
    amount,
    currency,
    status: payment.status,
    provider,
    service: 'payment-service'
  });

  res.statusCode = shouldFail ? 402 : 201;
  return {
    success: !shouldFail,
    data: payment,
    service: 'payment-service'
  };
});

// Get all payments
app.get('/payments', (req, res) => {
  const paymentList = Array.from(payments.values());
  const status = req.query.status as string;
  const provider = req.query.provider as string;
  
  let filteredPayments = paymentList;
  if (status) {
    filteredPayments = filteredPayments.filter((p: any) => p.status === status);
  }
  if (provider) {
    filteredPayments = filteredPayments.filter((p: any) => p.provider === provider);
  }

  return {
    success: true,
    data: filteredPayments,
    total: filteredPayments.length,
    filters: { status, provider },
    service: 'payment-service',
    timestamp: new Date().toISOString()
  };
});

// Get payment by ID
app.get('/payments/:id', (req, res) => {
  const paymentId = parseInt(req.params.id);
  const payment = payments.get(paymentId);
  
  if (!payment) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'Payment not found',
      service: 'payment-service'
    };
  }
  
  return {
    success: true,
    data: payment,
    service: 'payment-service'
  };
});

// Get all transactions
app.get('/transactions', (req, res) => {
  const transactionList = Array.from(transactions.values());
  
  return {
    success: true,
    data: transactionList,
    total: transactionList.length,
    service: 'payment-service',
    timestamp: new Date().toISOString()
  };
});

// Get transaction by ID
app.get('/transactions/:id', (req, res) => {
  const transaction = transactions.get(req.params.id);
  
  if (!transaction) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'Transaction not found',
      service: 'payment-service'
    };
  }
  
  return {
    success: true,
    data: transaction,
    service: 'payment-service'
  };
});

// Process refund
app.post('/refunds', async (req, res) => {
  const { paymentId, amount, reason = 'customer_request' } = req.body || {};
  
  if (!paymentId) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Payment ID required',
      service: 'payment-service'
    };
  }

  const payment = payments.get(parseInt(paymentId));
  if (!payment) {
    res.statusCode = 404;
    return {
      success: false,
      error: 'Payment not found',
      service: 'payment-service'
    };
  }

  if (payment.status !== 'completed') {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Can only refund completed payments',
      paymentStatus: payment.status,
      service: 'payment-service'
    };
  }

  const refundAmount = amount || payment.amount;
  if (refundAmount > payment.amount) {
    res.statusCode = 400;
    return {
      success: false,
      error: 'Refund amount cannot exceed payment amount',
      service: 'payment-service'
    };
  }

  // Simulate refund processing
  await new Promise(resolve => setTimeout(resolve, 1000));

  const refundId = `ref_${nextTransactionId++}`;
  const refund = {
    id: refundId,
    paymentId: payment.id,
    amount: refundAmount,
    currency: payment.currency,
    reason,
    status: 'completed',
    provider: payment.provider,
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString()
  };

  // Update payment status if full refund
  if (refundAmount === payment.amount) {
    payment.status = 'refunded';
    payments.set(payment.id, payment);
  }

  transactions.set(refundId, {
    id: refundId,
    paymentId: payment.id,
    type: 'refund',
    status: 'completed',
    amount: refundAmount,
    currency: payment.currency,
    provider: payment.provider,
    timestamp: new Date().toISOString()
  });

  // Emit refund event
  const { events } = req;
  await events.emit('payment.refunded', {
    refundId,
    paymentId: payment.id,
    amount: refundAmount,
    currency: payment.currency,
    reason,
    service: 'payment-service'
  });

  res.statusCode = 201;
  return {
    success: true,
    data: refund,
    service: 'payment-service'
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
        healthChecks: true
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    res.statusCode = 500;
    return {
      success: false,
      error: 'Failed to retrieve services',
      message: error instanceof Error ? error.message : 'Unknown error'
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
💳 Payment Service (Microservice-Ready)
=======================================
Port: ${serviceInfo.port}
Environment: ${process.env.NODE_ENV || 'development'}
Service Discovery: ${process.env.DISCOVERY_TYPE || 'memory'}
Health Check: http://${serviceInfo.host}:${serviceInfo.port}/health
Endpoints: 10
Features: Payment processing, refunds, multiple providers
Providers: ${Object.keys(paymentProviders).join(', ')}
Inter-service: Emits payment lifecycle events
Containerized: ${!!process.env.KUBERNETES_SERVICE_HOST}
`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Received SIGTERM, shutting down gracefully...');
      await serviceRegistry.deregister('payment-service');
      serviceRegistry.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Received SIGINT, shutting down gracefully...');
      await serviceRegistry.deregister('payment-service');
      serviceRegistry.destroy();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start payment service:', error);
    process.exit(1);
  }
}

// Start the service
startService(); 