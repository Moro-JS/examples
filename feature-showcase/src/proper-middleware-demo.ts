// Proper Middleware Demo - Using Built-in Middleware Architecture
import { createApp, builtInMiddleware } from '@morojs/moro';
import path from 'path';

const app = createApp();

// Use the properly organized built-in middleware
app.use(
  builtInMiddleware.cookie({
    secret: 'your-cookie-secret',
  })
);

app.use(
  builtInMiddleware.csrf({
    secret: 'your-csrf-secret',
    cookieName: '_morocsrf',
    headerName: 'x-moro-csrf-token',
  })
);

app.use(
  builtInMiddleware.csp({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
    nonce: true,
    reportUri: '/csp-report',
  })
);

app.use(
  builtInMiddleware.cache({
    maxAge: 3600,
    staleWhileRevalidate: 86400,
    vary: ['Accept-Encoding', 'User-Agent'],
    etag: 'strong',
  })
);

app.use(
  builtInMiddleware.sse({
    heartbeat: 30000,
    retry: 5000,
    cors: true,
  })
);

// Routes demonstrating proper middleware usage
app.get('/csrf-token', (req, res) => {
  const token = (req as any).csrfToken();
  res.json({
    success: true,
    token,
    nonce: (req as any).cspNonce,
  });
});

app.get('/events', (req, res) => {
  // SSE middleware handles the setup automatically
  let counter = 0;

  const interval = setInterval(() => {
    (res as any).sendEvent(
      {
        message: `Properly organized middleware event ${counter}`,
        timestamp: new Date().toISOString(),
        counter,
      },
      'update',
      counter.toString()
    );

    counter++;

    if (counter > 50) {
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.get('/cached-data/:id', (req, res) => {
  const id = req.params.id;

  const data = {
    id,
    message: 'This response uses properly organized caching middleware',
    timestamp: new Date().toISOString(),
    computedValue: Math.random() * 1000,
  };

  // Advanced cache middleware provides these methods
  (res as any).cacheControl({
    public: true,
    maxAge: 300,
    staleWhileRevalidate: 3600,
  });

  const etag = (res as any).generateETag(JSON.stringify(data));
  res.setHeader('ETag', etag);

  res.json({ success: true, data });
});

app.post('/protected-form', (req, res) => {
  // CSRF middleware automatically validates the token
  res.json({
    success: true,
    message: 'Form submitted with proper CSRF protection',
    data: req.body,
    cookies: req.cookies,
  });
});

app.post('/csp-report', (req, res) => {
  console.log('CSP Violation Report:', req.body);
  res.status(204).end();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Proper middleware architecture demo',
    middlewareUsed: [
      'cookie - for cookie parsing/setting',
      'csrf - for CSRF protection',
      'csp - for Content Security Policy',
      'advancedCache - for sophisticated caching',
      'sse - for Server-Sent Events',
    ],
    timestamp: new Date().toISOString(),
  });
});

const PORT = parseInt(process.env.PORT || '3007');
app.listen(PORT, undefined, () => {
  console.log(` Proper Middleware Demo running on http://localhost:${PORT}`);
  console.log(`
Properly Organized Built-in Middleware:
  /built-in/cookie.ts         - Cookie parsing & setting
  /built-in/csrf.ts           - CSRF protection
  /built-in/csp.ts            - Content Security Policy
  /built-in/sse.ts            - Server-Sent Events
  /built-in/advanced-cache.ts - Advanced caching

Available Endpoints:
  GET  /csrf-token       - Get CSRF token
  GET  /events           - Server-Sent Events
  GET  /cached-data/:id  - Advanced caching demo
  POST /protected-form   - CSRF protected endpoint
  POST /csp-report       - CSP violation reports
  GET  /health           - Middleware status

This demonstrates the CORRECT architecture:
  Middleware in /built-in/ folder
  Following existing patterns
  Proper hook-based integration
  Consistent with auth, cors, validation, etc.
  `);
});

export default app;
