// Database Adapters Demo - Showcasing the new adapter pattern
import { createApp, createDatabaseAdapter, MySQLAdapter, PostgreSQLAdapter, SQLiteAdapter, z, validate, body } from '@morojs/moro';

const app = createApp({
  cors: true,
  compression: true,
  helmet: true
});

// Example 1: Using the factory function (recommended)
const sqliteDb = createDatabaseAdapter('sqlite', {
  filename: 'demo.db',
  memory: false
});

// Example 2: Direct instantiation for more control
const mysqlDb = new MySQLAdapter({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'moro_demo',
  connectionLimit: 10
});

// User schema for validation
const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().min(18).max(120)
});

// Initialize database (SQLite for demo)
async function initializeDatabase() {
  try {
    await sqliteDb.connect();
    
    // Create users table if it doesn't exist
    await sqliteDb.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        age INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Routes using database adapters
app.get('/api/users', async (req, res) => {
  try {
    const users = await sqliteDb.query('SELECT * FROM users ORDER BY created_at DESC');
    return { 
      success: true, 
      data: users,
      adapter: 'SQLite'
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await sqliteDb.queryOne('SELECT * FROM users WHERE id = ?', [parseInt(id)]);
    
    if (!user) {
      res.status(404);
      return { success: false, error: 'User not found' };
    }
    
    return { success: true, data: user };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

app.post('/api/users', 
  validate({ body: UserSchema }),
  async (req, res) => {
    try {
      const userData = req.body;
      const newUser = await sqliteDb.insert('users', userData);
      
      res.status(201);
      return { 
        success: true, 
        data: newUser,
        message: 'User created successfully'
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

app.put('/api/users/:id',
  validate({ body: UserSchema.partial() }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedUser = await sqliteDb.update('users', updateData, { id: parseInt(id) });
      
      return { 
        success: true, 
        data: updatedUser,
        message: 'User updated successfully'
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await sqliteDb.delete('users', { id: parseInt(id) });
    
    if (deletedCount === 0) {
      res.status(404);
      return { success: false, error: 'User not found' };
    }
    
    return { 
      success: true, 
      message: 'User deleted successfully',
      deletedCount
    };
  } catch (error) {
    res.status(500);
    return { 
      success: false, 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : String(error)
    };
  }
});

// Transaction example
app.post('/api/users/bulk', 
  validate({ body: z.object({
    users: z.array(UserSchema).min(1).max(10)
  }) }),
  async (req, res) => {
    try {
      const { users } = req.body;
      
      const result = await sqliteDb.transaction(async (tx) => {
        const createdUsers = [];
        
        for (const userData of users) {
          const newUser = await tx.insert('users', userData);
          createdUsers.push(newUser);
        }
        
        return createdUsers;
      });
      
      res.status(201);
      return { 
        success: true, 
        data: result,
        message: `${result.length} users created successfully`,
        adapter: 'SQLite with Transaction'
      };
    } catch (error) {
      res.status(500);
      return { 
        success: false, 
        error: 'Failed to create users in bulk',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
);

// Adapter switching demo
app.get('/api/adapters/info', (req, res) => {
  return {
    success: true,
    availableAdapters: {
      mysql: 'MySQL/MariaDB adapter with connection pooling',
      postgresql: 'PostgreSQL adapter with advanced features',
      sqlite: 'SQLite adapter for lightweight applications'
    },
    factoryUsage: {
      mysql: "createDatabaseAdapter('mysql', { host: 'localhost', ... })",
      postgresql: "createDatabaseAdapter('postgresql', { host: 'localhost', ... })",
      sqlite: "createDatabaseAdapter('sqlite', { filename: 'app.db' })"
    },
    directUsage: {
      mysql: "new MySQLAdapter({ host: 'localhost', ... })",
      postgresql: "new PostgreSQLAdapter({ host: 'localhost', ... })",
      sqlite: "new SQLiteAdapter({ filename: 'app.db' })"
    }
  };
});

// Health check with database status
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await sqliteDb.query('SELECT 1');
    
    return {
      success: true,
      status: 'healthy',
      database: 'connected',
      adapter: 'SQLite',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    res.status(503);
    return {
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// Initialize database and start server
initializeDatabase().then(() => {
  const port = parseInt(process.env.PORT || '3002', 10);
  app.listen(port, () => {
    console.log(`Database Demo Server running on http://localhost:${port}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/users           - List all users');
    console.log('  GET  /api/users/:id       - Get user by ID');
    console.log('  POST /api/users           - Create new user');
    console.log('  PUT  /api/users/:id       - Update user');
    console.log('  DELETE /api/users/:id     - Delete user');
    console.log('  POST /api/users/bulk      - Create multiple users');
    console.log('  GET  /api/adapters/info   - Database adapter information');
    console.log('  GET  /api/health          - Health check with DB status');
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await sqliteDb.disconnect();
    console.log('Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}); 