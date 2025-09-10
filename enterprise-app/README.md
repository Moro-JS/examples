# Enterprise Application Example

A comprehensive enterprise-grade application built with the MoroJS framework, showcasing the new functional module architecture with WebSocket support, database integration, and modular design patterns.

## Features

- **Functional Module System**: Clean, modular architecture using `defineModule()` API
- **WebSocket Support**: Real-time communication with Socket.IO integration
- **Database Integration**: MySQL2 support with schema migrations and seeds
- **REST API**: Full CRUD operations across multiple entities
- **Type Safety**: Complete TypeScript implementation
- **Enterprise Middleware**: Logging, CORS, compression, and security headers
- **Graceful Shutdown**: Production-ready process management

## Architecture

This example demonstrates the new functional module architecture that replaces decorators with a cleaner, more maintainable approach:

### Module Structure

```
src/modules/
├── users/          # User management
├── orders/         # Order processing
├── todos/          # Task management
├── health/         # Health checks
└── test-simple/    # Basic testing
```

Each module follows the functional pattern:

- `index.ts` - Module definition using `defineModule()`
- `config.ts` - Module configuration
- `routes.ts` - HTTP route definitions
- `sockets.ts` - WebSocket handlers
- `actions.ts` - Business logic
- `types.ts` - TypeScript interfaces
- `schemas.ts` - Validation schemas

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Development mode**:

   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Core Routes

- `GET /` - Application info
- `GET /health` - Health check
- `GET /debug/modules` - Module information

### Module APIs

- `GET /api/v1.0.0/health/` - Health module
- `GET /api/v1.0.0/users/` - User management
- `GET /api/v1.0.0/orders/` - Order processing
- `GET /api/v1.0.0/todos/` - Todo management

## WebSocket Namespaces

- `ws://localhost:3002/users` - User events
- `ws://localhost:3002/orders` - Order events
- `ws://localhost:3002/todos` - Todo events

## Database

The example includes:

- Database schema definitions
- Migration files for table creation
- Seed data for development
- MySQL2 adapter integration

### Todo Module Database

- Schema: `src/modules/todos/database/schema.sql`
- Migrations: `src/modules/todos/database/migrations/`
- Seeds: `src/modules/todos/database/seeds/`

## Development

### Available Scripts

- `npm run dev` - Start with hot reload
- `npm run dev:pure` - Start without hot reload
- `npm run dev:framework` - Start with framework hot reload
- `npm run build` - Build for production
- `npm run start` - Start production build
- `npm run clean` - Clean build directory

### Switching Between Local and NPM

```bash
# Use local MoroJS development version
npm run switch:local

# Use published NPM version
npm run switch:npm
```

## Key Differences from Legacy Architecture

| Legacy (Decorators) | New (Functional)   |
| ------------------- | ------------------ |
| `@Controller`       | `defineModule()`   |
| `@Route`            | Route functions    |
| `@Injectable`       | Pure functions     |
| `.model.ts`         | `types.ts`         |
| Mixed files         | Separated concerns |

## Module Example

```typescript
// modules/users/index.ts
import { defineModule } from '@morojs/moro';
import { config } from './config';
import { routes } from './routes';
import { userSockets as sockets } from './sockets';

export default defineModule({
  name: 'users',
  version: '1.0.0',
  config,
  routes,
  sockets,
});
```

## Production Deployment

The application is production-ready with:

- Graceful shutdown handling
- Environment configuration
- Security middleware (Helmet)
- CORS support
- Request compression
- Structured logging

## Dependencies

- **@morojs/moro**: Core framework
- **mysql2**: Database adapter
- **socket.io**: WebSocket support
- **reflect-metadata**: TypeScript metadata
- **typescript**: Type checking

---

Built with ❤️ using the MoroJS Framework
