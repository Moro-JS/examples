// Example: Basic gRPC Server with MoroJS
// Demonstrates all RPC patterns: Unary, Server Streaming, Client Streaming, Bidirectional Streaming

import { createApp, grpcAuth, grpcValidate, grpcLogger, z } from '@morojs/moro';

// Initialize app
const app = createApp({
  server: { port: 3000 },
  logging: { level: 'info' },
});

// In-memory database
const users = new Map<string, any>();

// Validation schemas
const GetUserSchema = z.object({
  id: z.string().uuid(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  role: z.string().optional(),
});

// Initialize gRPC
await app.grpcInit({
  port: 50051,
  host: '0.0.0.0',
  adapter: 'grpc-js',
  enableHealthCheck: true,
  enableReflection: true,
  maxReceiveMessageLength: 4 * 1024 * 1024,
  maxSendMessageLength: 4 * 1024 * 1024,
});

// Register UserService
await app.grpcService('../proto/users.proto', 'UserService', {
  // Unary RPC: Get single user
  getUser: [
    grpcLogger(),
    grpcValidate({ request: GetUserSchema }),
    async (call, callback) => {
      const user = users.get(call.request.id);

      if (!user) {
        const error: any = new Error('User not found');
        error.code = 5; // NOT_FOUND
        callback(error);
        return;
      }

      callback(null, user);
    },
  ],

  // Server Streaming: List users
  listUsers: [
    grpcLogger(),
    async call => {
      const { limit = 10, offset = 0, role_filter } = call.request;

      let allUsers = Array.from(users.values());

      // Filter by role if specified
      if (role_filter) {
        allUsers = allUsers.filter(u => u.role === role_filter);
      }

      // Apply pagination
      const paginatedUsers = allUsers.slice(offset, offset + limit);

      // Stream each user
      for (const user of paginatedUsers) {
        call.write(user);
      }

      call.end();
    },
  ],

  // Unary RPC: Create user
  createUser: [
    grpcLogger(),
    grpcValidate({ request: CreateUserSchema }),
    async (call, callback) => {
      const id = crypto.randomUUID();
      const now = Date.now();

      const user = {
        id,
        ...call.request,
        created_at: now,
        updated_at: now,
      };

      users.set(id, user);

      console.log(`✓ Created user: ${user.name} (${user.id})`);

      callback(null, user);
    },
  ],

  // Unary RPC: Update user
  updateUser: [
    grpcLogger(),
    async (call, callback) => {
      const existingUser = users.get(call.request.id);

      if (!existingUser) {
        const error: any = new Error('User not found');
        error.code = 5; // NOT_FOUND
        callback(error);
        return;
      }

      const updatedUser = {
        ...existingUser,
        ...call.request,
        updated_at: Date.now(),
      };

      users.set(call.request.id, updatedUser);

      console.log(`✓ Updated user: ${updatedUser.name} (${updatedUser.id})`);

      callback(null, updatedUser);
    },
  ],

  // Unary RPC: Delete user
  deleteUser: [
    grpcLogger(),
    async (call, callback) => {
      const exists = users.has(call.request.id);

      if (!exists) {
        const error: any = new Error('User not found');
        error.code = 5; // NOT_FOUND
        callback(error);
        return;
      }

      users.delete(call.request.id);

      console.log(`✓ Deleted user: ${call.request.id}`);

      callback(null, {
        success: true,
        message: 'User deleted successfully',
      });
    },
  ],

  // Client Streaming: Batch create users
  batchCreateUsers: [
    grpcLogger(),
    async (call, callback) => {
      const createdUsers: any[] = [];

      call.on('data', (userRequest: any) => {
        const id = crypto.randomUUID();
        const now = Date.now();

        const user = {
          id,
          ...userRequest,
          created_at: now,
          updated_at: now,
        };

        users.set(id, user);
        createdUsers.push(user);

        console.log(`✓ Batch created user: ${user.name} (${user.id})`);
      });

      call.on('end', () => {
        callback(null, {
          count: createdUsers.length,
          users: createdUsers,
        });
      });

      call.on('error', (error: any) => {
        console.error('Batch create error:', error);
      });
    },
  ],

  // Bidirectional Streaming: Real-time user updates
  streamUsers: [
    grpcLogger(),
    async call => {
      console.log('✓ User streaming started');

      call.on('data', (request: any) => {
        const { event_type, user } = request;

        console.log(`→ Stream event: ${event_type}`, user.name);

        // Echo back the user with server timestamp
        call.write({
          ...user,
          updated_at: Date.now(),
        });
      });

      call.on('end', () => {
        console.log('✓ User streaming ended');
        call.end();
      });

      call.on('error', (error: any) => {
        console.error('Stream error:', error);
      });
    },
  ],
});

// Add some sample users
const sampleUsers = [
  { name: 'Alice', email: 'alice@example.com', age: 30, role: 'admin' },
  { name: 'Bob', email: 'bob@example.com', age: 25, role: 'user' },
  { name: 'Charlie', email: 'charlie@example.com', age: 35, role: 'user' },
];

for (const userData of sampleUsers) {
  const id = crypto.randomUUID();
  const now = Date.now();
  users.set(id, { id, ...userData, created_at: now, updated_at: now });
}

// HTTP endpoints for API
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    grpc: {
      port: 50051,
      services: app.getGrpcServices(),
      stats: app.getGrpcStats(),
    },
  });
});

app.get('/users', (req, res) => {
  res.json(Array.from(users.values()));
});

// Start server
app.listen(() => {
  console.log('\n🚀 MoroJS gRPC Example Server');
  console.log('═══════════════════════════════════════');
  console.log('HTTP Server:  http://localhost:3000');
  console.log('gRPC Server:  localhost:50051');
  console.log('Health Check: http://localhost:3000/health');
  console.log('═══════════════════════════════════════');
  console.log('\nTest with grpcurl:');
  console.log('  grpcurl -plaintext localhost:50051 list');
  console.log('  grpcurl -plaintext localhost:50051 grpc.health.v1.Health/Check');
  console.log('  grpcurl -plaintext localhost:50051 UserService/ListUsers');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹ Shutting down gracefully...');
  await app.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹ Shutting down gracefully...');
  await app.close();
  process.exit(0);
});
