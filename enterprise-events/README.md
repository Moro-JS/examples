# Production Events Demo

> Demonstrates secure, scalable, observable event-driven architecture with Moro

## What This Example Shows

This example demonstrates the production-grade event system capabilities of Moro:

- **Isolated Module Event Buses** - Each module gets its own event namespace
- **🌐 Global System Events** - Framework lifecycle and cross-module communication  
- **Real-time Metrics & Monitoring** - Track event performance and patterns
- **Audit Logging** - Compliance-ready event tracking
- **Type-safe Event Payloads** - Full TypeScript support for event data
- **🏷Automatic Namespacing** - Security through event isolation

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (uses compiled framework)
npm run dev

# Run in framework development mode (uses source)
npm run dev:framework

# Build for production
npm run build
npm start
```

The server will start on **http://localhost:3003**

## API Endpoints

### Core Endpoints
- `GET /` - Welcome message and feature overview
- `GET /metrics` - Real-time event system metrics
- `GET /audit-log` - Compliance audit log (configurable limit)

### Event Demonstrations
- `GET /users` - Module events with automatic namespacing
- `GET /orders` - Inter-module communication patterns
- `GET /notifications` - Event-driven notification system
- `GET /error-example` - Error handling with event context
- `GET /security-demo` - Security isolation demonstration

## Event System Features

### Module Isolation
```typescript
// Each request gets its own isolated event bus
const { events } = req;

// Events are automatically namespaced by module
await events.emit('user.created', userData);
await events.emit('order.processed', orderData);
```

### Global System Events
```typescript
// Listen to framework lifecycle events
app.events.on('framework:initialized', ({ data }) => {
  console.log('Framework started with:', data.options);
});

app.events.on('module:loaded', ({ data }) => {
  console.log(`Module ${data.moduleId}@${data.version} loaded`);
});
```

### Real-time Metrics
```typescript
const metrics = app.events.getMetrics();
console.log({
  totalEvents: metrics.totalEvents,
  averageLatency: metrics.averageLatency,
  errorRate: metrics.errorRate,
  eventsByType: metrics.eventsByType
});
```

### Audit Logging
```typescript
// Enable compliance-ready audit logging
app.events.enableAuditLog();

// Retrieve audit logs
const auditLog = app.events.getAuditLog();
```

## Example Usage

### 1. Basic Event Emission
```bash
curl http://localhost:3003/users
```
Demonstrates module-level events with automatic namespacing.

### 2. Inter-Module Communication
```bash
curl http://localhost:3003/orders
```
Shows how modules can listen to events from other modules.

### 3. Error Event Handling
```bash
curl http://localhost:3003/error-example
```
Demonstrates structured error logging with event context.

### 4. Real-time Metrics
```bash
curl http://localhost:3003/metrics
```
View live event system performance metrics.

### 5. Compliance Audit Log
```bash
curl "http://localhost:3003/audit-log?limit=10"
```
Access the last 10 audit log entries.

## Monitoring Output

Watch the console for real-time event activity:

```
Framework initialized with options: { autoDiscover: true }
Module loaded: users@1.0.0
Middleware registered: request-logger
Event Metrics: {
  totalEvents: 42,
  averageLatency: "1.23ms",
  errorRate: "0.00%",
  topEvents: [["user.list.requested", 15], ["orders.retrieved", 8]]
}
```

## 🏢 Enterprise Features

### Security
- **Event Namespacing**: Automatic isolation prevents cross-module interference
- **Module Boundaries**: Strict event bus isolation for security
- **Audit Trail**: Complete event history for compliance

### Performance
- **Low Latency**: Sub-millisecond event processing
- **High Throughput**: Handles thousands of events per second
- **Memory Efficient**: Optimized event storage and cleanup

### Observability
- **Real-time Metrics**: Track event performance live
- **Error Tracking**: Comprehensive error event handling
- **Audit Logging**: Compliance-ready event trails

## Related Examples

- **[Enterprise App](../enterprise-app/)** - Full modular application
- **[Simple API](../simple-api/)** - Basic Express-like API
- **[Feature Showcase](../feature-showcase/)** - Comprehensive framework demo including logging

## Learn More

- [Moro Documentation](https://morojs.com)
- [Event System Guide](../../moro/docs/events.md)
- [Enterprise Architecture Patterns](../../moro/docs/patterns.md) 