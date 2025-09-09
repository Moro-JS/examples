import { createApp, z } from '@morojs/moro';

// Create the app
const app = createApp();

// Simple schemas for validation
const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

// In-memory storage for demo
const users: Array<{ id: number; name: string; email: string; age?: number }> = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
];

let nextId = 3;

// Routes

// Welcome endpoint
app.get('/', (req, res) => {
  return {
    message: 'Welcome to Simple Moro API!',
    endpoints: [
      'GET / - This welcome message',
      'GET /health - Health check',
      'GET /users - List users',
      'POST /users - Create user',
      'GET /users/:id - Get user by ID',
    ],
  };
});

// Health check
app.get('/health', (req, res) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Get all users with optional filtering
app.get('/users', (req, res) => {
  const limit = parseInt(req.query.limit || '10');
  const search = req.query.search;

  let filteredUsers = users;

  if (search) {
    filteredUsers = users.filter(
      user =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  return {
    users: filteredUsers.slice(0, limit),
    total: filteredUsers.length,
    filters: { search, limit },
  };
});

// Create a new user
app
  .post('/users')
  .body(UserSchema)
  .handler((req, res) => {
    const newUser = {
      id: nextId++,
      ...req.body,
    };

    users.push(newUser);

    return {
      success: true,
      user: newUser,
    };
  });

// Get user by ID (using simple version without params validation for now)
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    res.statusCode = 400;
    return { error: 'Invalid user ID' };
  }

  const user = users.find(u => u.id === userId);

  if (!user) {
    res.statusCode = 404;
    return { error: 'User not found' };
  }

  return { user };
});

// Start the server
app.listen(3001, () => {
  console.log('Simple API server running on http://localhost:3001');
  console.log('Try these endpoints:');
  console.log('   GET  http://localhost:3001/');
  console.log('   GET  http://localhost:3001/users');
  console.log('   POST http://localhost:3001/users');
  console.log('   GET  http://localhost:3001/users/1');
});
