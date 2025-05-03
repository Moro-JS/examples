// NoSQL & ORM Demo - MongoDB, Redis, and Drizzle ORM
import { 
  createApp, 
  createDatabaseAdapter, 
  MongoDBAdapter, 
  RedisAdapter, 
  DrizzleAdapter,
  z, 
  validate 
} from '@morojs/moro';

const app = createApp({
  cors: true,
  compression: true,
  helmet: true
});

// Example 1: MongoDB for document storage
const mongoDb = createDatabaseAdapter('mongodb', {
  host: 'localhost',
  port: 27017,
  database: 'moro_demo',
  username: process.env.MONGO_USER,
  password: process.env.MONGO_PASSWORD
});

// Example 2: Redis for caching and sessions
const redisDb = createDatabaseAdapter('redis', {
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  keyPrefix: 'moro:demo:'
});

// Example 3: Drizzle ORM (requires separate setup)
// This would be configured with your actual Drizzle instance
// const drizzleDb = createDatabaseAdapter('drizzle', {
//   database: drizzleInstance,
//   schema: schemaObject
// });

// User schemas for validation
const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }).optional()
});

const ProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  category: z.string(),
  tags: z.array(z.string()).optional(),
  inStock: z.boolean().default(true)
});

// Initialize databases
async function initializeDatabases() {
  try {
    // MongoDB setup
    await mongoDb.connect();
    
    // Create indexes for better performance
    if (mongoDb instanceof MongoDBAdapter) {
      await mongoDb.createIndex('users', { email: 1 }, { unique: true });
      await mongoDb.createIndex('products', { category: 1, name: 1 });
    }
    
    // Redis setup
    await redisDb.connect();
    
    console.log('All databases initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// MongoDB Routes - Document operations
app.get('/api/mongo/users', async (req, res) => {
  try {
    const users = await mongoDb.query('users');
    return { 
      success: true, 
      data: users,
      count: users.length,
      database: 'MongoDB'
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to fetch users from MongoDB',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

app.get('/api/mongo/users/search', async (req, res) => {
  try {
    const { name, minAge, maxAge } = req.query;
    const query: any = {};
    
    if (name) query.name = new RegExp(name as string, 'i');
    if (minAge || maxAge) {
      query.age = {};
      if (minAge) query.age.$gte = parseInt(minAge as string);
      if (maxAge) query.age.$lte = parseInt(maxAge as string);
    }
    
    const users = await mongoDb.query('users', query);
    return { 
      success: true, 
      data: users,
      query,
      count: users.length
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Search failed',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

app.post('/api/mongo/users', 
  validate({ body: UserSchema }),
  async (req, res) => {
    try {
      const userData = req.body;
      const newUser = await mongoDb.insert('users', userData);
      
      res.status(201);
      return { 
        success: true, 
        data: newUser,
        message: 'User created in MongoDB'
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to create user in MongoDB',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

// MongoDB Aggregation example
app.get('/api/mongo/users/stats', async (req, res) => {
  try {
    if (!(mongoDb instanceof MongoDBAdapter)) {
      res.status(400);
      return { success: false, error: 'Not a MongoDB adapter' };
    }
    
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgAge: { $avg: '$age' },
          minAge: { $min: '$age' },
          maxAge: { $max: '$age' }
        }
      }
    ];
    
    const stats = await mongoDb.aggregate('users', pipeline);
    return { 
      success: true, 
      data: stats[0] || { totalUsers: 0, avgAge: 0, minAge: 0, maxAge: 0 },
      message: 'User statistics from MongoDB aggregation'
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to get user stats',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Redis Routes - Key-value and caching operations
app.get('/api/redis/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redisDb.queryOne(key);
    
    if (!value) {
      res.status(404);
      return { success: false, error: 'Key not found' };
    }
    
    return { 
      success: true, 
      data: { key, value },
      database: 'Redis'
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to get value from Redis',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

app.post('/api/redis/cache',
  validate({ body: z.object({
    key: z.string().min(1),
    value: z.any(),
    ttl: z.number().int().positive().optional()
  }) }),
  async (req, res) => {
    try {
      const { key, value, ttl } = req.body;
      
      if (redisDb instanceof RedisAdapter) {
        await redisDb.set(key, value, ttl);
      } else {
        await redisDb.insert(key, { value });
      }
      
      return { 
        success: true, 
        message: `Value stored in Redis${ttl ? ` with TTL ${ttl}s` : ''}`,
        data: { key, value, ttl }
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to store value in Redis',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

// Redis counters example
app.post('/api/redis/counter/:name/incr', async (req, res) => {
  try {
    const { name } = req.params;
    
    if (!(redisDb instanceof RedisAdapter)) {
      res.status(400);
      return { success: false, error: 'Not a Redis adapter' };
    }
    
    const newValue = await redisDb.incr(`counter:${name}`);
    return { 
      success: true, 
      data: { counter: name, value: newValue },
      message: 'Counter incremented'
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to increment counter',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Redis pub/sub example
app.post('/api/redis/publish',
  validate({ body: z.object({
    channel: z.string().min(1),
    message: z.any()
  }) }),
  async (req, res) => {
    try {
      const { channel, message } = req.body;
      
      if (!(redisDb instanceof RedisAdapter)) {
        res.status(400);
        return { success: false, error: 'Not a Redis adapter' };
      }
      
      const subscribers = await redisDb.publish(channel, message);
      return { 
        success: true, 
        data: { channel, message, subscribers },
        message: `Message published to ${subscribers} subscribers`
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to publish message',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

// Cross-database operations
app.post('/api/hybrid/user-with-cache',
  validate({ body: UserSchema }),
  async (req, res) => {
    try {
      const userData = req.body;
      
      // Store in MongoDB
      const user = await mongoDb.insert('users', userData);
      
      // Cache in Redis
      if (redisDb instanceof RedisAdapter) {
        await redisDb.set(`user:${user._id}`, user, 3600); // 1 hour TTL
      }
      
      res.status(201);
      return { 
        success: true, 
        data: user,
        message: 'User created in MongoDB and cached in Redis',
        operations: ['mongodb:insert', 'redis:cache']
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to create user with cache',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

// Database comparison endpoint
app.get('/api/databases/info', (req, res) => {
  return {
    success: true,
    databases: {
      mongodb: {
        type: 'NoSQL Document Database',
        strengths: ['Flexible schema', 'Rich queries', 'Aggregation pipeline'],
        useCases: ['Content management', 'User profiles', 'Analytics'],
        operations: ['CRUD', 'Aggregation', 'Indexing', 'Transactions']
      },
      redis: {
        type: 'In-Memory Key-Value Store',
        strengths: ['Ultra-fast', 'Multiple data types', 'Pub/Sub'],
        useCases: ['Caching', 'Sessions', 'Real-time features'],
        operations: ['Key-value', 'Counters', 'Lists', 'Hashes', 'Pub/Sub']
      },
      drizzle: {
        type: 'Type-safe ORM',
        strengths: ['Type safety', 'SQL-like syntax', 'Multiple drivers'],
        useCases: ['Complex relations', 'Type-safe queries', 'Migrations'],
        operations: ['Type-safe CRUD', 'Relations', 'Migrations', 'Raw SQL']
      }
    },
    examples: {
      mongodb: {
        factory: "createDatabaseAdapter('mongodb', { host: '...', database: '...' })",
        direct: "new MongoDBAdapter({ host: '...', database: '...' })"
      },
      redis: {
        factory: "createDatabaseAdapter('redis', { host: '...', keyPrefix: '...' })",
        direct: "new RedisAdapter({ host: '...', keyPrefix: '...' })"
      },
      drizzle: {
        factory: "createDatabaseAdapter('drizzle', { database: drizzleInstance, schema })",
        direct: "new DrizzleAdapter({ database: drizzleInstance, schema })"
      }
    }
  };
});

// Health check for all databases
app.get('/api/health/databases', async (req, res) => {
  const health: any = {
    timestamp: new Date().toISOString(),
    databases: {}
  };
  
  try {
    // Test MongoDB
    try {
      await mongoDb.query('users', {}, { limit: 1 });
      health.databases.mongodb = { status: 'healthy', type: 'NoSQL Document' };
    } catch (error) {
      health.databases.mongodb = { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    // Test Redis
    try {
      if (redisDb instanceof RedisAdapter) {
        await redisDb.get('health:check');
      } else {
        await redisDb.queryOne('health:check');
      }
      health.databases.redis = { status: 'healthy', type: 'Key-Value Store' };
    } catch (error) {
      health.databases.redis = { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : String(error)
      };
    }
    
    const allHealthy = Object.values(health.databases).every((db: any) => db.status === 'healthy');
    health.overall = allHealthy ? 'healthy' : 'degraded';
    
    if (!allHealthy) res.status(503);
    return { success: true, ...health };
  } catch (error) {
    res.status(503);
    return {
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Initialize and start server
initializeDatabases().then(() => {
  const port = parseInt(process.env.PORT || '3003', 10);
  app.listen(port, () => {
    console.log(`NoSQL & ORM Demo Server running on http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('  MongoDB:');
    console.log('    GET  /api/mongo/users          - List users');
    console.log('    GET  /api/mongo/users/search   - Search users');
    console.log('    POST /api/mongo/users          - Create user');
    console.log('    GET  /api/mongo/users/stats    - User statistics');
    console.log('  Redis:');
    console.log('    GET  /api/redis/cache/:key     - Get cached value');
    console.log('    POST /api/redis/cache          - Set cache value');
    console.log('    POST /api/redis/counter/:name/incr - Increment counter');
    console.log('    POST /api/redis/publish        - Publish message');
    console.log('  Hybrid:');
    console.log('    POST /api/hybrid/user-with-cache - Create user + cache');
    console.log('  System:');
    console.log('    GET  /api/databases/info       - Database information');
    console.log('    GET  /api/health/databases     - Health check');
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await mongoDb.disconnect();
    await redisDb.disconnect();
    console.log('All databases disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}); 