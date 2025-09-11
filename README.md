# MoroJS Examples

A collection of complete, production-ready examples built with MoroJS. Each example demonstrates different aspects of the framework and provides a solid foundation for building real-world applications.

## Examples Overview

### [Simple API](./simple-api/)

**Perfect for beginners**

- Basic REST API setup
- Route handlers and middleware
- Request validation with Zod
- Simple in-memory data storage

**Use when**: Learning MoroJS basics or building simple APIs

### 🔐 [Simple Authentication](./simple-auth-example/)

**Basic authentication with OAuth providers**

- GitHub and Google OAuth integration
- JWT-based session management
- Protected route examples
- Demo mode for testing without OAuth setup
- Programmatic sign in/out APIs

**Use when**: Adding basic authentication to your app

### 🏢 [Enterprise Application](./enterprise-app/)

**Production-ready enterprise system**

- Modular architecture with dependency injection
- Multi-module organization (users, orders, products)
- JWT authentication with role-based access control
- Database integration with PostgreSQL
- Comprehensive validation and error handling
- Event-driven communication between modules

**Use when**: Building large-scale business applications

### 🔒 [Enterprise Authentication](./enterprise-auth-example/)

**Advanced authentication with RBAC and enterprise features**

- Role-Based Access Control (Admin, Manager, User)
- Multiple OAuth providers (GitHub, Google, Microsoft, Okta)
- Permission-based authorization system
- Security audit logging and event tracking
- Enterprise SSO integration (Azure AD, Okta)
- Advanced session management with security features
- Webhook security with API key authentication

**Use when**: Building enterprise applications with complex security requirements

### [Real-time Chat](./real-time-chat/)

**WebSocket-powered real-time application**

- WebSocket integration for instant messaging
- User authentication and presence tracking
- Room-based chat system
- Typing indicators and read receipts
- Message persistence with PostgreSQL
- Redis for session management

**Use when**: Building real-time features like chat, notifications, or live updates

### 🛒 [E-commerce API](./ecommerce-api/)

**Complete online store backend**

- Product catalog with search and filtering
- Shopping cart management
- Stripe payment integration
- Order processing and tracking
- Inventory management
- Admin dashboard endpoints

**Use when**: Building e-commerce platforms or payment-enabled applications

### [Microservices](./microservice/)

**Distributed system architecture**

- Multiple interconnected services
- Docker containerization
- Service discovery and communication
- API Gateway pattern
- Inter-service events and messaging
- Kubernetes deployment configs

**Use when**: Building scalable distributed systems

### [Feature Showcase](./feature-showcase/)

**Comprehensive framework features**

- Advanced caching strategies
- File upload handling
- Rate limiting and security
- Database optimization
- Custom middleware examples
- Performance monitoring

**Use when**: Exploring advanced MoroJS capabilities

### [Runtime Examples](./runtime-examples/)

**Multi-runtime deployment**

- Node.js traditional deployment
- Vercel Edge Functions
- AWS Lambda serverless
- Cloudflare Workers
- Runtime adapter examples

**Use when**: Deploying to different hosting platforms

### [Enterprise Events](./enterprise-events/)

**Event-driven architecture**

- Complex event sourcing patterns
- Message queues and processing
- Saga pattern implementation
- Event replay and debugging
- Cross-service communication

**Use when**: Building event-driven systems

## Quick Start

Choose an example based on your needs:

```bash
# Clone the repository
git clone https://github.com/Moro-JS/examples.git
cd examples

# Choose and run an example
cd simple-api
npm install
npm run dev
```

## Learning Path

**For beginners:**

1. Start with [Simple API](./simple-api/) to learn basics
2. Move to [Feature Showcase](./feature-showcase/) for advanced concepts
3. Try [Real-time Chat](./real-time-chat/) for WebSocket features

**For production apps:**

1. Study [Enterprise Application](./enterprise-app/) for architecture patterns
2. Explore [E-commerce API](./ecommerce-api/) for payment integration
3. Review [Microservices](./microservice/) for scaling strategies

**For specific use cases:**

- **Real-time features**: [Real-time Chat](./real-time-chat/)
- **Payment processing**: [E-commerce API](./ecommerce-api/)
- **Distributed systems**: [Microservices](./microservice/)
- **Event-driven**: [Enterprise Events](./enterprise-events/)
- **Multi-runtime**: [Runtime Examples](./runtime-examples/)

## Technologies Used

All examples showcase different combinations of:

- **Framework**: MoroJS with TypeScript
- **Databases**: PostgreSQL, Redis, SQLite
- **Authentication**: JWT, OAuth2, API Keys
- **Payments**: Stripe, PayPal
- **Real-time**: WebSockets, Server-Sent Events
- **Caching**: Redis, in-memory
- **Validation**: Zod schemas
- **Testing**: Jest, Supertest
- **Deployment**: Docker, Kubernetes, Serverless

## Example Structure

Each example includes:

```
example-name/
├── src/                 # Source code
├── tests/              # Test files
├── database/           # Schema and migrations
├── docs/               # Additional documentation
├── package.json        # Dependencies and scripts
├── README.md          # Example-specific guide
├── .env.example       # Environment template
├── docker-compose.yml # Local development (if applicable)
└── Dockerfile         # Production deployment (if applicable)
```

## 🚦 Running Examples

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Moro-JS/examples.git
cd examples

# Install dependencies for all examples (uses @morojs/moro from npm)
npm run setup:npm

# Run a specific example
cd simple-api
npm run dev
```

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (for database examples)
- Redis 6+ (for caching examples)
- Docker (for containerized examples)

### Development Modes

This repository supports two modes:

- **NPM Mode** (default): Uses `@morojs/moro` from npm - perfect for trying examples
- **Local Mode**: Uses local framework files - perfect for framework development

```bash
# Switch to NPM mode (GitHub ready)
npm run setup:npm

# Switch to Local mode (framework development)
npm run setup:local
```

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

### Common Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test

# Database setup (if applicable)
npm run db:setup
npm run db:migrate
npm run db:seed
```

## Configuration

Most examples use environment variables for configuration:

```bash
# Copy example environment file
cp .env.example .env

# Edit with your settings
nano .env
```

Common environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT token signing
- `STRIPE_SECRET_KEY` - Stripe API key (for payment examples)
- `PORT` - Server port (default: 3000)

## Testing

Run tests for all examples:

```bash
# Install dependencies for all examples
npm run install:all

# Run all tests
npm run test:all

# Run specific example tests
cd simple-api && npm test
```

## Documentation

- **[MoroJS Documentation](https://morojs.com/docs)** - Framework documentation
- **[API Reference](https://github.com/Moro-JS/moro/blob/main/API.md)** - Complete API reference
- **[Deployment Guide](https://morojs.com/docs/deployment)** - Production deployment
- **[Best Practices](https://morojs.com/docs/best-practices)** - Recommended patterns

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Report Issues**: Found a bug? [Create an issue](https://github.com/Moro-JS/examples/issues)
2. **Suggest Examples**: Need an example for your use case? Let us know!
3. **Improve Examples**: Submit PRs to enhance existing examples
4. **Add Examples**: Contribute new examples following our structure

### Adding a New Example

1. Fork this repository
2. Create a new directory with your example
3. Follow the standard structure (see above)
4. Include comprehensive README and tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋‍♂Support

- **Documentation**: [https://morojs.com](https://morojs.com)
- **GitHub Issues**: [Report bugs or request features](https://github.com/Moro-JS/examples/issues)
- **Discord**: [Join our community](https://morojs.com/discord)
- **Twitter**: [@MoroJS](https://twitter.com/morojs)

---

Built with ❤️ by the MoroJS team and community.
