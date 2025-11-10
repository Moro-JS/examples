# gRPC Server Example

Demonstrates all gRPC RPC patterns with MoroJS: Unary, Server Streaming, Client Streaming, and Bidirectional Streaming.

## Features

- Unary RPC (request-response)
- Server Streaming RPC
- Client Streaming RPC
- Bidirectional Streaming RPC
- gRPC health checks
- gRPC reflection
- Request validation with Zod
- Request logging

## Prerequisites

Install `grpcurl` for testing (optional but recommended):

```bash
# macOS
brew install grpcurl

# Linux
# Download from https://github.com/fullstorydev/grpcurl/releases
```

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
npm run switch:npm  # Installs moro from npm
npm run dev         # Runs with published package
```

## API Endpoints

### HTTP Endpoints

| Method | Endpoint  | Description                   |
| ------ | --------- | ----------------------------- |
| `GET`  | `/health` | Health check with gRPC status |
| `GET`  | `/users`  | List all users (HTTP API)     |

### gRPC Services

The server exposes a `UserService` with the following RPCs:

| RPC Type         | Method             | Description                           |
| ---------------- | ------------------ | ------------------------------------- |
| Unary            | `GetUser`          | Get a single user by ID               |
| Unary            | `CreateUser`       | Create a new user                     |
| Unary            | `UpdateUser`       | Update an existing user               |
| Unary            | `DeleteUser`       | Delete a user                         |
| Server Streaming | `ListUsers`        | Stream list of users with pagination  |
| Client Streaming | `BatchCreateUsers` | Batch create users from client stream |
| Bidirectional    | `StreamUsers`      | Real-time bidirectional user updates  |

## Testing

### Using grpcurl

```bash
# List available services
grpcurl -plaintext localhost:50051 list

# Check health
grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check

# List users (server streaming)
grpcurl -plaintext localhost:50051 users.UserService/ListUsers

# Get user by ID
grpcurl -plaintext -d '{"id": "user-id-here"}' localhost:50051 users.UserService/GetUser

# Create user
grpcurl -plaintext -d '{"name": "John", "email": "john@example.com", "age": 30}' localhost:50051 users.UserService/CreateUser
```

### Using HTTP API

```bash
# Health check
curl http://localhost:3000/health

# List users
curl http://localhost:3000/users
```

## RPC Patterns Demonstrated

### 1. Unary RPC

Simple request-response pattern:

- `GetUser`: Get a single user
- `CreateUser`: Create a user
- `UpdateUser`: Update a user
- `DeleteUser`: Delete a user

### 2. Server Streaming

Server sends multiple responses:

- `ListUsers`: Stream paginated list of users

### 3. Client Streaming

Client sends multiple requests:

- `BatchCreateUsers`: Batch create users from stream

### 4. Bidirectional Streaming

Both client and server stream:

- `StreamUsers`: Real-time bidirectional updates

## Concepts Demonstrated

- **gRPC Integration**: Full gRPC server setup with MoroJS
- **RPC Patterns**: All four gRPC RPC patterns
- **Health Checks**: gRPC health check service
- **Reflection**: gRPC reflection for service discovery
- **Validation**: Request validation with Zod schemas
- **Logging**: Request logging middleware
- **Error Handling**: Proper gRPC error codes

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
