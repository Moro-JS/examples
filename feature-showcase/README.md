# Feature Showcase Example

This example demonstrates comprehensive Moro framework capabilities and serves as a feature showcase for advanced developers exploring the framework's full potential.

⚠️ **Note**: This is NOT a simple API example! If you're looking for a basic getting-started example, see the `simple-api` example instead.

## **Features Demonstrated**

This comprehensive showcase includes:

- **All Routing Styles** - Chainable, schema-first, and direct routing
- **Advanced Validation** - Complex Zod schemas and validation patterns
- **Database Integration** - Multiple database adapters and ORMs
- **Configuration Management** - Type-safe environment configuration
- **Functional Dependency Injection** - Advanced DI patterns
- **API Documentation** - OpenAPI generation from schemas
- **Enterprise Caching** - Multi-layer caching strategies
- **Advanced Logging** - Enterprise logging with structured output
- **NoSQL & SQL Examples** - MongoDB, PostgreSQL, Redis integration
- **Middleware Composition** - Advanced middleware patterns
- **Clean Architecture** - Domain-driven design patterns
- **Performance Monitoring** - Advanced metrics and monitoring
- **WebSocket Integration** - Real-time features
- **Rate Limiting** - Advanced rate limiting strategies

## **Quick Start**

```bash
# From the monorepo root
npm run dev:feature-showcase

# Or from this directory
npm run dev

# Run specific feature demos
npm run dev:logging     # Just the logging demo
npm run dev:validation  # Validation examples
npm run dev:routing     # Intelligent routing demo
npm run dev:config      # Configuration demo
```

The server will start on http://localhost:3001

## **API Endpoints**

### **GET /**

Welcome message with endpoint list

```bash
curl http://localhost:3001/
```

### **GET /health**

Health check endpoint

```bash
curl http://localhost:3001/health
```

### **GET /users**

Get all users

```bash
curl http://localhost:3001/users
```

### **POST /users**

Create a new user (with validation & rate limiting)

```bash
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

**Validation Rules:**

- `name`: 2-50 characters, required
- `email`: Valid email format, required

**Rate Limit:** 10 requests per minute

### **Logging Demo Endpoints**

```bash
# Main logging demonstration
curl http://localhost:3001/demo/logging

# Error logging with stack traces
curl http://localhost:3001/demo/logging/error

# Performance timing demonstration
curl http://localhost:3001/demo/logging/performance?delay=300

# Component-specific logging
curl http://localhost:3001/demo/logging/components
```

## **WebSocket Chat**

Connect to `ws://localhost:3001/chat` for real-time chat.

### **Events**

**Join Chat Room:**

```javascript
socket.emit('join', { username: 'John' });
```

**Send Message:**

```javascript
socket.emit('message', {
  username: 'John',
  message: 'Hello everyone!',
});
```

**Listen for Messages:**

```javascript
socket.on('message', data => {
  console.log(`${data.username}: ${data.message}`);
});

socket.on('user-joined', data => {
  console.log(data.message); // "John joined the chat"
});
```

## **Code Structure**

```typescript
// Simple, Express-like API
const app = createApp({
  cors: true,
  compression: true,
  helmet: true,
});

// Routes with built-in features
app.post(
  '/users',
  (req, res) => {
    // Handler logic
  },
  {
    validation: ZodSchema, // Auto-validation
    rateLimit: { requests: 10, window: 60000 }, // Rate limiting
  }
);

// WebSocket support
app.websocket('/chat', {
  message: (socket, data) => {
    socket.broadcast.emit('message', data);
  },
});

app.listen(3001);
```

## **Key Differences from Express**

| Feature           | Express           | Moro                |
| ----------------- | ----------------- | ------------------- |
| **Response**      | `res.json(data)`  | `return data`       |
| **Validation**    | Manual middleware | Built-in options    |
| **Rate Limiting** | External package  | Built-in options    |
| **WebSockets**    | Separate setup    | Integrated API      |
| **TypeScript**    | Additional setup  | First-class support |
| **Performance**   | ~28k req/sec      | ~45k req/sec        |

## **Development**

### **Hot Reload**

```bash
npm run dev  # Automatic restarts on file changes
```

### **Build for Production**

```bash
npm run build
npm start
```

### **Environment Variables**

```bash
PORT=3001                    # Server port
CORS_ORIGIN=*               # CORS origin
NODE_ENV=development        # Environment
```

## **Use This Example When**

- **Prototyping** - Quick API development
- **Small Services** - Simple microservices
- **Migration from Express** - Familiar patterns
- **Learning Moro** - Gentle introduction

For complex applications, see the [Enterprise App Example](../enterprise-app/).

---

**Built with ♥ using Moro Framework**
