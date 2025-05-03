# Microservice Architecture Demo

> Complete microservice architecture demonstration with Moro

## What This Example Shows

This example demonstrates a **complete, production-ready microservice architecture** using Moro:

- **Service Mesh Architecture** - 3 fully implemented services working together
- **Inter-Service Communication** - Real HTTP calls + event-driven messaging
- **🚪 Load Balancing** - Nginx-based routing with health checks
- **Service Discovery** - Consul/Kubernetes/Memory-based registration
- **Circuit Breakers** - Built-in fault tolerance and graceful degradation
- **Observability** - Prometheus monitoring + structured logging
- ** Production Ready** - Docker, Kubernetes, health checks, graceful shutdown
- **Real Business Logic** - Complete e-commerce flow: users → orders → payments

## 🏛Architecture

```
┌─────────────┐
│ API Gateway │ :3000
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│User │ │Payment  │ │Order    │ │Inventory│
│:3010│ │:3011    │ │:3012    │ │:3013    │
└─────┘ └─────────┘ └─────────┘ └─────────┘
```

## Quick Start

### Prerequisites
```bash
# Install dependencies for all services
npm run install:all

# Optional: Copy environment configuration
cp config.example.env .env
# Edit .env file to customize for your environment
```

### Development Mode
```bash
# Start all services concurrently
npm run dev

# Or start individual services
npm run dev:user      # User Service (port 3010)
npm run dev:payment   # Payment Service (port 3011)
npm run dev:order     # Order Service (port 3012)

# Start Nginx gateway (requires Docker)
docker-compose up nginx
```

### Production Mode
```bash
# Build all services
npm run build:all

# Start all services
npm run start:all
```

## 🏢 Services Overview

### 🌐 Nginx Load Balancer (Port 3000)
**External load balancer and API gateway**
- Request routing to appropriate services
- Load balancing with health checks
- SSL termination and security headers
- Rate limiting and compression
- Production-ready reverse proxy

**Routes:**
```
GET  /                    # Gateway info page
GET  /health             # Gateway health check
GET  /status             # Nginx status page
/users/*                 # Route to User Service (3010)
/payments/*              # Route to Payment Service (3011)
/orders/*                # Route to Order Service (3012)
```

### 👤 User Service (Port 3010)
**User management and authentication**
- CRUD operations for users
- User status management (active/inactive)
- Event emission for user lifecycle
- Role-based access control

**Endpoints:**
```
GET    /users            # List all users
GET    /users/:id        # Get user by ID
POST   /users            # Create new user
PUT    /users/:id        # Update user
DELETE /users/:id        # Delete user
POST   /users/:id/activate    # Activate user
POST   /users/:id/deactivate  # Deactivate user
```

### 💳 Payment Service (Port 3011) **IMPLEMENTED**
**Payment processing and transaction management**
- Multiple payment providers (Stripe, PayPal, Square, Crypto)
- Real-time payment processing with fees calculation
- Transaction history and status tracking
- Refund processing and management
- Payment provider health monitoring
- Event emission for payment lifecycle

**Endpoints:**
```
GET    /payments            # List all payments
GET    /payments/:id        # Get payment by ID
POST   /payments/process    # Process new payment
GET    /transactions        # List all transactions
GET    /transactions/:id    # Get transaction by ID
GET    /providers           # Get payment providers status
POST   /refunds             # Process refund
```

### Order Service (Port 3012) **IMPLEMENTED**
**Order management and fulfillment with inter-service coordination**
- Complete order lifecycle management
- Real-time inventory tracking and reservation
- Integration with User and Payment services
- Automatic payment processing and refunds
- Order status workflow (8 statuses)
- Service dependency health checking

**Endpoints:**
```
GET    /orders              # List all orders
GET    /orders/:id          # Get order by ID
POST   /orders              # Create new order (calls user + payment services)
PUT    /orders/:id/status   # Update order status
POST   /orders/:id/cancel   # Cancel order (auto-refund)
GET    /inventory           # View product inventory
```

## Inter-Service Communication

### Event-Driven Architecture
Services communicate through events for loose coupling:

```typescript
// User Service emits events
await events.emit('user.created', { userId, email, role });
await events.emit('user.updated', { userId, changes });

// Order Service listens to user events
events.on('user.created', ({ data }) => {
  // Initialize user preferences
});

// Payment Service listens to order events
events.on('order.created', ({ data }) => {
  // Process payment automatically
});
```

### HTTP Communication
Direct service-to-service calls for immediate responses:

```typescript
// Order Service calls User Service
const userResponse = await fetch('http://user-service:3010/users/123');

// Payment Service calls external payment providers
const paymentResult = await processWithProvider(paymentData);
```

## Resilience Patterns

### Circuit Breaker
```typescript
const circuitBreaker = new CircuitBreaker(userServiceCall, {
  failureThreshold: 5,
  resetTimeout: 30000,
  timeout: 5000
});

const result = await circuitBreaker.execute();
```

### Retry with Backoff
```typescript
const result = await retryWithBackoff(async () => {
  return await serviceCall();
}, { maxRetries: 3, baseDelay: 1000 });
```

### Health Checks
```typescript
app.get('/health', () => ({
  service: 'user-service',
  status: 'healthy',
  dependencies: ['database', 'redis'],
  uptime: process.uptime()
}));
```

## Observability

### Distributed Logging
```typescript
// Correlated logs across services
logger.info('Processing order', 'OrderService', {
  orderId: '12345',
  userId: '67890',
  correlationId: 'req_abc123'
});
```

### Metrics Collection
```typescript
// Service metrics
const metrics = {
  requestsPerSecond: 150,
  averageResponseTime: '45ms',
  errorRate: '0.1%',
  activeConnections: 23
};
```

### Distributed Tracing
```typescript
// Request tracing across services
const trace = {
  traceId: 'trace_xyz789',
  spanId: 'span_order_create',
  parentSpanId: 'span_api_gateway',
  service: 'order-service'
};
```

## Development Tools

### Service Discovery
Services automatically register with the API Gateway:

```typescript
// Automatic service registration
await gateway.registerService({
  name: 'user-service',
  url: 'http://localhost:3010',
  healthCheck: '/health'
});
```

### Load Testing
```bash
# Test individual service
curl -X POST http://localhost:3010/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'

# Test through API Gateway
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com"}'
```

### Monitoring Dashboard
```bash
# Service health overview
curl http://localhost:3000/health

# Individual service status
curl http://localhost:3010/health
curl http://localhost:3011/health
curl http://localhost:3012/health
```

## 🐳 Container Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  api-gateway:
    build: ./api-gateway
    ports: ["3000:3000"]
    depends_on: [user-service, payment-service, order-service]
    
  user-service:
    build: ./user-service
    ports: ["3010:3010"]
    
  payment-service:
    build: ./payment-service
    ports: ["3011:3011"]
    
  order-service:
    build: ./order-service
    ports: ["3012:3012"]
    depends_on: [user-service, payment-service]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: user-service:latest
        ports:
        - containerPort: 3010
```

## Related Examples

- **[Enterprise App](../enterprise-app/)** - Monolithic modular application
- **[Simple API](../simple-api/)** - Basic API patterns
- **[Enterprise Events](../enterprise-events/)** - Event-driven architecture

## Learn More

- [Moro Documentation](https://morojs.com)
- [Microservices Patterns](../../moro/docs/microservices.md)
- [Service Mesh Guide](../../moro/docs/service-mesh.md)
- [Production Deployment](../../moro/docs/production.md) 