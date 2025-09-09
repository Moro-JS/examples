# Simple API Example

A basic Moro framework demonstration showing fundamental concepts like routing, validation, and API development.

## Features

- 🔄 CRUD operations with in-memory storage
- Zod validation for type safety
- Zero-config setup
- Health checks and error handling
- Simple testing endpoints

## Usage

### For Moro Framework Development

When working in the MoroJS monorepo (has `../../MoroJS` directory):

```bash
npm install  # Uses local MoroJS source automatically
npm run dev  # Real-time TypeScript development
```

### For External Developers

When using this example standalone:

```bash
npm run install:external  # Installs moro from npm
npm run dev               # Runs with published package
```

**That's it!** No setup scripts, no complexity. The package.json is pre-configured for local development, but you can easily switch to the npm package when needed.

## API Endpoints

| Method | Endpoint     | Description                              |
| ------ | ------------ | ---------------------------------------- |
| `GET`  | `/`          | Welcome message and API overview         |
| `GET`  | `/health`    | Health check                             |
| `GET`  | `/users`     | List all users (with optional filtering) |
| `POST` | `/users`     | Create a new user                        |
| `GET`  | `/users/:id` | Get user by ID                           |

## Testing the API

```bash
# Get welcome message
curl http://localhost:3001/

# List users
curl http://localhost:3001/users

# Create a user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com", "age": 28}'

# Get specific user
curl http://localhost:3001/users/1

# Search users
curl "http://localhost:3001/users?search=john&limit=5"
```

## Example Response

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    }
  ],
  "total": 1,
  "filters": {
    "search": "john",
    "limit": 5
  }
}
```

## Key Concepts Demonstrated

- **Intelligent Routing**: Chainable API with automatic middleware ordering
- **Zod Validation**: Type-safe request validation with `UserSchema`
- **Functional Architecture**: Pure functions, no decorators
- **Error Handling**: Proper HTTP status codes and error responses

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run install:external` - Switch to using npm package instead of local source
- `npm run build` - Build for production
- `npm run start` - Run built version

## Next Steps

- Explore [Feature Showcase](../feature-showcase) for advanced patterns
- Try [Enterprise App](../enterprise-app) for modular architecture
- Check out [Microservices](../microservice) for distributed systems
