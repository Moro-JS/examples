// Advanced Features Demo - HTTP/2, SSE, Range Requests, CSRF, CSP, Advanced Caching
import { createApp, httpMiddleware, MoroCore, MoroOptions } from '@morojs/moro';
import path from 'path';
import fs from 'fs';

// HTTP/2 configuration (uncomment for HTTPS/HTTP2)
const http2Options: MoroOptions = {
  // http2: true,
  // https: {
  //   key: fs.readFileSync('path/to/private-key.pem'),
  //   cert: fs.readFileSync('path/to/certificate.pem')
  // },
  websocket: {
    compression: true,
    customIdGenerator: () => `moro-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  },
};

const app = new MoroCore(http2Options);

// Advanced Security Middleware
app.use(
  httpMiddleware.csrf({
    secret: 'your-csrf-secret-key',
    cookieName: '_morocsrf',
    headerName: 'x-moro-csrf-token',
  })
);

app.use(
  httpMiddleware.csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      upgradeInsecureRequests: true,
    },
    nonce: true,
    reportUri: '/csp-report',
  })
);

// Advanced Caching Middleware
app.use(
  httpMiddleware.advancedCache({
    maxAge: 3600,
    staleWhileRevalidate: 86400,
    vary: ['Accept-Encoding', 'User-Agent'],
    etag: 'strong',
    cdnHeaders: {
      cloudflare: true,
      fastly: true,
    },
  })
);

// HTTP/2 Server Push Middleware
app.use(
  httpMiddleware.http2Push({
    resources: [
      { path: '/static/app.css', as: 'style', type: 'text/css' },
      { path: '/static/app.js', as: 'script', type: 'application/javascript' },
    ],
    condition: req => req.path === '/' || req.path === '/dashboard',
  })
);

// Server-Sent Events Middleware
app.use(
  httpMiddleware.sse({
    heartbeat: 30000, // 30 seconds
    retry: 5000, // 5 seconds
    cors: true,
  })
);

// Range Request Middleware
app.use(
  httpMiddleware.range({
    acceptRanges: 'bytes',
    maxRanges: 10,
  })
);

// CSRF Token Endpoint
app.get('/csrf-token', (req, res) => {
  const token = (req as any).csrfToken();
  res.json({
    success: true,
    token,
    nonce: (req as any).cspNonce,
  });
});

// Server-Sent Events Demo
app.get('/events', (req, res) => {
  // SSE middleware handles the setup
  let counter = 0;

  const interval = setInterval(() => {
    (res as any).sendEvent(
      {
        message: `Event ${counter}`,
        timestamp: new Date().toISOString(),
        data: { counter, random: Math.random() },
      },
      'update',
      counter.toString()
    );

    counter++;

    if (counter > 100) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Range Request Demo for Large Files
app.get('/video/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../media', filename);

  try {
    const stats = await fs.promises.stat(filePath);
    await (res as any).sendRange(filePath, stats);
  } catch (error) {
    res.status(404).json({ success: false, error: 'Video not found' });
  }
});

// Advanced Caching Demo
app.get('/cached-data/:id', (req, res) => {
  const id = req.params.id;

  // Simulate expensive operation
  const data = {
    id,
    timestamp: new Date().toISOString(),
    computedValue: Math.random() * 1000,
    expensiveCalculation: Array.from({ length: 1000 }, (_, i) => i * 2).reduce((a, b) => a + b),
  };

  // Set advanced cache headers
  (res as any).cacheControl({
    public: true,
    maxAge: 300,
    staleWhileRevalidate: 3600,
    staleIfError: 86400,
  });

  // Generate ETag
  const etag = (res as any).generateETag(JSON.stringify(data));
  res.setHeader('ETag', etag);

  res.json({ success: true, data });
});

// CSRF Protected Form Submission
app.post('/submit-form', (req, res) => {
  // CSRF middleware automatically validates the token
  res.json({
    success: true,
    message: 'Form submitted successfully with CSRF protection',
    data: req.body,
    timestamp: new Date().toISOString(),
  });
});

// HTTP/2 Push Demo
app.get('/dashboard', (req, res) => {
  // Resources are automatically pushed via middleware
  res.json({
    success: true,
    message: 'Dashboard loaded with HTTP/2 server push',
    pushedResources: ['/static/app.css', '/static/app.js'],
    timestamp: new Date().toISOString(),
  });
});

// CSP Report Endpoint
app.post('/csp-report', (req, res) => {
  console.log('CSP Violation Report:', req.body);
  res.status(204).end();
});

// WebSocket with Advanced Features
const io = app.getIOServer();

io.on('connection', socket => {
  console.log(`Client connected with custom ID: ${socket.id}`);

  // Send compressed message if large
  (socket as any).compressedEmit('welcome', {
    message: 'Welcome to advanced WebSocket features!',
    features: ['compression', 'custom-ids', 'binary-support'],
    largeData: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `item-${i}` })),
  });

  // Heartbeat mechanism
  const heartbeat = setInterval(() => {
    (socket as any).heartbeat();
  }, 30000);

  socket.on('disconnect', () => {
    clearInterval(heartbeat);
    console.log('Client disconnected');
  });

  // Handle binary data
  socket.on('binary-data', (buffer: Buffer) => {
    console.log(`Received binary data: ${buffer.length} bytes`);
    socket.emit('binary-response', Buffer.from(`Processed ${buffer.length} bytes`));
  });
});

// Health Check with Advanced Features
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    features: {
      http2: !!http2Options.http2,
      websocketCompression: !!http2Options.websocket?.compression,
      csrf: 'enabled',
      csp: 'enabled',
      caching: 'advanced',
      sse: 'enabled',
      rangeRequests: 'enabled',
    },
    timestamp: new Date().toISOString(),
  });
});

const PORT = parseInt(process.env.PORT || '3006');
app.listen(PORT, undefined, () => {
  console.log(
    `Advanced Features Demo running on ${http2Options.http2 ? 'https' : 'http'}://localhost:${PORT}`
  );
  console.log(`
🔥 Advanced Features Available:
  GET  /csrf-token      - Get CSRF token and CSP nonce
  GET  /events          - Server-Sent Events stream
  GET  /video/:filename - Range request demo (partial content)
  GET  /cached-data/:id - Advanced caching demo
  POST /submit-form     - CSRF protected form
  GET  /dashboard       - HTTP/2 server push demo
  POST /csp-report      - CSP violation reports
  GET  /health          - Health check with feature status
  
🌐 WebSocket Features:
  - Custom ID generation
  - Message compression
  - Binary data support
  - Heartbeat mechanism
  
Security Features:
  - CSRF protection with tokens
  - Content Security Policy with nonce
  - Secure headers
  
 Performance Features:
  - HTTP/2 server push
  - Advanced caching with stale-while-revalidate
  - WebSocket compression
  - Range requests for large files
  `);
});

export default app;
