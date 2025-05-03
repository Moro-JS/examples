// Session Management Demo - Built-in Session Support
import { createApp, builtInMiddleware } from '@morojs/moro';
import { session } from '../../../MoroJS/src/core/middleware/built-in/session';
import { createFrameworkLogger } from '../../../MoroJS/src/core/logger';

const logger = createFrameworkLogger('SessionDemo');

const app = createApp();

// Example 1: Memory sessions (development)
app.use(builtInMiddleware.cookie()); // Required for session cookies
app.use(session({
  store: 'memory',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: false, // Set to true in production with HTTPS
    sameSite: 'lax'
  },
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));

// Example 2: Redis sessions (production)
// app.use(builtInMiddleware.session({
//   store: 'redis',
//   storeOptions: {
//     host: 'localhost',
//     port: 6379,
//     password: process.env.REDIS_PASSWORD,
//     keyPrefix: 'sess:'
//   },
//   cookie: {
//     maxAge: 24 * 60 * 60 * 1000, // 24 hours
//     httpOnly: true,
//     secure: true, // HTTPS only in production
//     sameSite: 'strict'
//   },
//   secret: process.env.SESSION_SECRET || 'production-secret',
//   rolling: true // Reset expiry on each request
// }));

// Example 3: File sessions (single server deployments)
// app.use(builtInMiddleware.session({
//   store: 'file',
//   storeOptions: {
//     path: './sessions'
//   },
//   cookie: {
//     maxAge: 12 * 60 * 60 * 1000, // 12 hours
//     httpOnly: true
//   },
//   secret: 'file-session-secret'
// }));

// Routes demonstrating session usage

// Login route - creates session
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Simple authentication (use proper auth in production)
  if (username === 'demo' && password === 'password') {
    // Store user data in session
    req.session.userId = 1;
    req.session.username = username;
    req.session.loginTime = new Date().toISOString();
    req.session.isAuthenticated = true;
    
    // Session is automatically saved after response
    res.json({
      success: true,
      message: 'Logged in successfully',
      sessionId: req.session.sessionID,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Protected route - requires session
app.get('/profile', async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Please log in first'
    });
  }
  
  res.json({
    success: true,
    user: {
      id: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
      sessionId: req.session.sessionID
    },
    sessionData: req.session
  });
});

// Update session data
app.post('/preferences', async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Please log in first'
    });
  }
  
  // Update session with user preferences
  req.session.preferences = {
    theme: req.body.theme || 'light',
    language: req.body.language || 'en',
    notifications: req.body.notifications || false
  };
  
  res.json({
    success: true,
    message: 'Preferences updated',
    preferences: req.session.preferences
  });
});

// Session info
app.get('/session', async (req, res) => {
  res.json({
    sessionId: req.session.sessionID,
    isAuthenticated: req.session.isAuthenticated || false,
    data: req.session,
    cookie: req.session.cookie
  });
});

// Manual session save
app.post('/session/save', async (req, res) => {
  await req.session.save();
  res.json({
    success: true,
    message: 'Session saved manually'
  });
});

// Session regeneration (security)
app.post('/session/regenerate', async (req, res) => {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Please log in first'
    });
  }
  
  const oldSessionId = req.session.sessionID;
  const newSessionId = await req.session.regenerate();
  
  res.json({
    success: true,
    message: 'Session regenerated for security',
    oldSessionId,
    newSessionId
  });
});

// Logout route - destroys session
app.post('/logout', async (req, res) => {
  if (req.session.isAuthenticated) {
    await req.session.destroy();
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } else {
    res.json({
      success: true,
      message: 'Not logged in'
    });
  }
});

// Shopping cart example using sessions
app.post('/cart/add', async (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  const item = {
    id: req.body.id,
    name: req.body.name,
    price: req.body.price,
    quantity: req.body.quantity || 1
  };
  
  req.session.cart.push(item);
  
  res.json({
    success: true,
    message: 'Item added to cart',
    cart: req.session.cart,
    cartTotal: req.session.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  });
});

app.get('/cart', async (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  res.json({
    success: true,
    cart,
    itemCount: cart.length,
    total
  });
});

// Session analytics
app.get('/admin/sessions', async (req, res) => {
  // In a real app, you'd query your session store
  res.json({
    message: 'Session analytics would go here',
    note: 'In production, query your session store (Redis, etc.) for session data'
  });
});

// Error handling for session-related errors
app.use((err, req, res, next) => {
  if (err.message.includes('session')) {
    logger.error('Session error', 'SessionError', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Session error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  } else {
    next(err);
  }
});

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  console.log(`Session demo server running on port ${PORT}`);
  console.log('\nTry these endpoints:');
  console.log('POST /login - Login with username: "demo", password: "password"');
  console.log('GET /profile - View profile (requires login)');
  console.log('POST /preferences - Update user preferences');
  console.log('GET /session - View session info');
  console.log('POST /session/regenerate - Regenerate session ID');
  console.log('POST /logout - Logout and destroy session');
  console.log('POST /cart/add - Add items to cart');
  console.log('GET /cart - View cart contents');
});

export default app; 