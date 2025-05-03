import { createApp, z, validate } from '@morojs/moro';
import fs from 'fs';
import path from 'path';

// Create app with WebSocket support
const app = createApp();

// Simple in-memory storage for demo
let users: any[] = [];
let rooms: any[] = [
  { id: 'general', name: 'General Chat', description: 'Main chat room' },
  { id: 'random', name: 'Random', description: 'Random discussions' }
];
let messages: any[] = [];

// Basic welcome endpoint
app.get('/', (req, res) => {
  return {
    message: 'Real-time Chat API - Simple Demo',
    status: 'running',
    version: '1.0.0',
    note: 'This is a simplified demo without database dependencies',
    endpoints: [
      'GET / - This message',
      'GET /health - Health check',
      'GET /rooms - Get available rooms',
      'GET /test - WebSocket test client (open in browser)',
      'POST /auth/register - Simple user registration (no persistence)',
      'POST /auth/login - Simple user login (no persistence)',
      'WebSocket /chat - Real-time chat functionality'
    ],
    websocket: {
      url: 'ws://localhost:3000/chat',
      events: ['join', 'message', 'leave']
    }
  };
});

// Simple authentication endpoints (no database)
app.post('/auth/register', 
  validate({
    body: z.object({
      username: z.string().min(3).max(20),
      email: z.string().email(),
      password: z.string().min(6)
    })
  }, async (req, res) => {
    // Check if user already exists
    const existingUser = users.find(u => u.email === req.body.email || u.username === req.body.username);
    if (existingUser) {
      res.status(400);
      return { error: 'User already exists with this email or username' };
    }

    // Create user (in memory)
    const user = {
      id: Date.now().toString(),
      username: req.body.username,
      email: req.body.email,
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    
    return { 
      user, 
      token: `demo-token-${user.id}`,
      message: 'User registered successfully (demo mode - no persistence)'
    };
  })
);

app.post('/auth/login',
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string()
    })
  }, async (req, res) => {
    // Find user (in memory)
    const user = users.find(u => u.email === req.body.email);
    if (!user) {
      res.status(401);
      return { error: 'Invalid credentials' };
    }

    return { 
      user, 
      token: `demo-token-${user.id}`,
      message: 'Login successful (demo mode)'
    };
  })
);

// Simple WebSocket handler for testing
app.get('/socket.io/', (req, res) => {
  console.log('🔌 WebSocket endpoint accessed via HTTP');
  res.setHeader('Content-Type', 'application/json');
  return { 
    message: 'WebSocket endpoint active',
    note: 'This should be accessed via WebSocket protocol' 
  };
});

// Since MoroJS WebSocket might not be working, let's add a simple message endpoint for testing
app.post('/api/chat/join', 
  validate({
    body: z.object({
      username: z.string(),
      roomId: z.string().optional()
    })
  }, (req, res) => {
    console.log(`📝 Join via HTTP:`, req.body);
    const roomId = req.body.roomId || 'general';
    const username = req.body.username || 'Anonymous';
    
    return { 
      success: true, 
      message: `${username} would join room ${roomId}`,
      room: rooms.find(r => r.id === roomId) || { id: roomId, name: roomId }
    };
  })
);

app.post('/api/chat/message', 
  validate({
    body: z.object({
      username: z.string(),
      message: z.string(),
      roomId: z.string().optional()
    })
  }, (req, res) => {
    console.log(`💬 Message via HTTP:`, req.body);
    const roomId = req.body.roomId || 'general';
    const username = req.body.username || 'Anonymous';
    
    const message = {
      id: Date.now(),
      content: req.body.message,
      sender: username,
      roomId,
      timestamp: new Date().toISOString()
    };
    
    // Store message in memory
    messages.push(message);
    console.log(`📨 Message stored:`, message);
    
    return { success: true, message: 'Message sent', data: message };
  })
);

// Try the MoroJS WebSocket API as well (might not work)
console.log('🔌 Attempting to set up WebSocket endpoint /chat...');

try {
  app.websocket('/chat', {
    connect: (socket: any) => {
      console.log(`🔗 MoroJS WebSocket client connected: ${socket.id}`);
    },
    
    disconnect: (socket: any) => {
      console.log(`❌ MoroJS WebSocket client disconnected: ${socket.id}`);
    },
    
    join: (socket: any, data: any) => {
      console.log(`📝 Join event received via MoroJS WebSocket:`, data);
      const roomId = data.roomId || 'general';
      const username = data.username || 'Anonymous';
      
      console.log(`👥 ${username} joined room ${roomId}`);
      
      return { 
        success: true, 
        message: `Joined room ${roomId}`,
        room: rooms.find(r => r.id === roomId) || { id: roomId, name: roomId }
      };
    },
    
    message: (socket: any, data: any) => {
      console.log(`💬 Message event received via MoroJS WebSocket:`, data);
      const roomId = data.roomId || 'general';
      const username = data.username || 'Anonymous';
      
      const message = {
        id: Date.now(),
        content: data.message,
        sender: username,
        roomId,
        timestamp: new Date().toISOString()
      };
      
      // Store message in memory
      messages.push(message);
      console.log(`📨 Broadcasting message to room ${roomId}:`, message);
      
      return { success: true, message: 'Message sent' };
    }
  });
  console.log('✅ MoroJS WebSocket endpoint setup successful');
} catch (error) {
  console.log('❌ MoroJS WebSocket setup failed:', error);
}

// Simple REST endpoints
app.get('/rooms', (req, res) => {
  return { 
    rooms,
    message: 'Available chat rooms'
  };
});

app.get('/rooms/:roomId/messages',
  validate({
    params: z.object({
      roomId: z.string()
    }),
    query: z.object({
      limit: z.coerce.number().max(100).default(50)
    })
  }, async (req, res) => {
    const roomMessages = messages
      .filter(m => m.roomId === req.params.roomId)
      .slice(-req.query.limit);
    
    return { 
      messages: roomMessages,
      roomId: req.params.roomId,
      count: roomMessages.length
    };
  })
);

// Serve Socket.IO client library locally
app.get('/socket.io/socket.io.js', (req, res) => {
  // Simple Socket.IO client implementation for testing
  const socketIOClient = `
// Minimal Socket.IO client implementation
class SimpleSocketIO {
  constructor(url) {
    this.url = url;
    this.eventHandlers = {};
    this.connected = false;
  }
  
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }
  
  emit(event, data) {
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }
  
  connect() {
    const wsUrl = this.url.replace('http', 'ws') + '/socket.io/';
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      this.connected = true;
      this.trigger('connect');
    };
    
    this.ws.onclose = () => {
      this.connected = false;
      this.trigger('disconnect');
    };
    
    this.ws.onerror = (error) => {
      this.trigger('connect_error', error);
    };
    
    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.trigger(data.event || data.type, data.data || data);
      } catch (e) {
        console.error('Failed to parse message:', event.data);
      }
    };
    
    return this;
  }
  
  trigger(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }
}

window.io = function(url) {
  return new SimpleSocketIO(url).connect();
};
`;
  res.setHeader('Content-Type', 'application/javascript');
  res.end(socketIOClient);
});

// Serve the test client HTML page
app.get('/test', (req, res) => {
  const htmlPath = path.join(__dirname, '..', 'test-client.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  res.setHeader('Content-Type', 'text/html');
  // Allow local Socket.IO script
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' ws: wss: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:");
  res.end(html);
});

// Health check
app.get('/health', (req, res) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    stats: {
      users: users.length,
      rooms: rooms.length,
      messages: messages.length
    }
  };
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Real-time Chat Server running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/chat`);
  console.log(`\nSimple demo endpoints:`);
  console.log(`  GET / - API documentation`);
  console.log(`  GET /test - WebSocket test client (open in browser)`);
  console.log(`  POST /auth/register - User registration (in-memory)`);
  console.log(`  POST /auth/login - User login (in-memory)`);
  console.log(`  GET /rooms - Available chat rooms`);
  console.log(`  WebSocket events: join, message, leave`);
  console.log(`\n🎯 To test real-time chat: Open http://localhost:${PORT}/test in your browser!`);
  console.log(`Note: This is a simplified demo without database persistence`);
}); 