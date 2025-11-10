// HTTP/2 Server Example with Server Push and Stream Priorities
// This example demonstrates the full HTTP/2 capabilities of MoroJS

import { createApp } from '@morojs/moro';
import { http2, cors, requestLogger } from '@morojs/moro';
import * as fs from 'fs';
import * as path from 'path';

// Generate self-signed certificates for development
// In production, use proper SSL certificates
// Run: openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
//      -keyout localhost-key.pem -out localhost-cert.pem

const certPath = path.join(process.cwd(), 'localhost-key.pem');
const keyPath = path.join(process.cwd(), 'localhost-cert.pem');

const app = createApp({
  // Enable HTTP/2 with advanced configuration
  http2: {
    allowHTTP1: true, // Support HTTP/1.1 fallback
    settings: {
      enablePush: true, // Enable server push
      maxConcurrentStreams: 100,
      initialWindowSize: 65535,
      maxFrameSize: 16384,
    },
  },

  // SSL certificates required for HTTP/2
  https:
    fs.existsSync(certPath) && fs.existsSync(keyPath)
      ? {
          key: fs.readFileSync(certPath),
          cert: fs.readFileSync(keyPath),
        }
      : undefined,

  logger: {
    level: 'debug',
  },
});

// Use HTTP/2 Server Push middleware with auto-detection
app.use(
  http2.push({
    autoDetect: true, // Automatically detect and push CSS/JS from HTML
    resources: [
      // Manually configure resources to push
      { path: '/styles/main.css', as: 'style', type: 'text/css', priority: 200 },
      { path: '/scripts/app.js', as: 'script', type: 'application/javascript', priority: 150 },
      { path: '/images/logo.png', as: 'image', type: 'image/png', priority: 100 },
    ],
    condition: req => {
      // Only push for HTML pages
      return req.path === '/' || req.path.endsWith('.html');
    },
  })
);

// CORS middleware
app.use(cors());

// Logging middleware
app.use(requestLogger());

// Home route - demonstrates HTTP/2 server push
app.get('/', (req, res) => {
  // Check HTTP version
  const httpVersion = req.httpVersion || '1.1';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>HTTP/2 Demo</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <h1>HTTP/2 Server Demo</h1>
  <p>This page was served using HTTP/${httpVersion}</p>

  <div class="features">
    <h2>HTTP/2 Features Enabled:</h2>
    <ul>
      <li>Server Push (resources pushed automatically)</li>
      <li>Stream Multiplexing</li>
      <li>Stream Prioritization</li>
      <li>Header Compression (HPACK)</li>
      <li>Binary Protocol</li>
    </ul>
  </div>

  <div class="info">
    <h2>Request Info:</h2>
    <ul>
      <li>HTTP Version: ${httpVersion}</li>
      <li>Method: ${req.method}</li>
      <li>Path: ${req.path}</li>
      <li>Headers: ${Object.keys(req.headers).length} total</li>
    </ul>
  </div>

  <script src="/scripts/app.js"></script>
</body>
</html>
  `;

  // Set high priority for HTML response
  if (res.setPriority) {
    res.setPriority({ weight: 256, exclusive: false });
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// API endpoint with stream priority
app.get('/api/data', (req, res) => {
  // Set high priority for API responses
  if (res.setPriority) {
    res.setPriority({ weight: 200 });
  }

  res.json({
    success: true,
    data: {
      message: 'HTTP/2 API endpoint',
      httpVersion: req.httpVersion || '1.1',
      features: {
        serverPush: true,
        multiplexing: true,
        prioritization: true,
        headerCompression: true,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Manual server push example
app.get('/push-demo', (req, res) => {
  // Manually push resources before sending response
  if (res.push) {
    // Push CSS with high priority
    const cssStream = res.push('/styles/demo.css', {
      headers: { 'content-type': 'text/css' },
      priority: 200,
    });
    if (cssStream) {
      cssStream.end('body { font-family: Arial; background: #f0f0f0; }');
    }

    // Push JS with medium priority
    const jsStream = res.push('/scripts/demo.js', {
      headers: { 'content-type': 'application/javascript' },
      priority: 150,
    });
    if (jsStream) {
      jsStream.end('console.log("Pushed via HTTP/2 Server Push!");');
    }
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Manual Push Demo</title>
  <link rel="stylesheet" href="/styles/demo.css">
</head>
<body>
  <h1>Manual Server Push Demo</h1>
  <p>CSS and JS were pushed before this HTML!</p>
  <script src="/scripts/demo.js"></script>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Static file routes
app.get('/styles/:file', (req, res) => {
  const css = `
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .features, .info {
      background: rgba(255, 255, 255, 0.1);
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    ul {
      list-style: none;
      padding-left: 0;
    }
    li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    h2 {
      font-size: 1.5em;
      margin-top: 0;
    }
  `;

  // Set lower priority for CSS (already pushed)
  if (res.setPriority) {
    res.setPriority({ weight: 50 });
  }

  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(css);
});

app.get('/scripts/:file', (req, res) => {
  const js = `
    console.log('HTTP/2 Server Running');
    console.log('HTTP Version: ' + (window.performance?.getEntriesByType?.('navigation')?.[0]?.nextHopProtocol || 'unknown'));

    document.addEventListener('DOMContentLoaded', () => {
      console.log('Page loaded successfully with HTTP/2');
    });
  `;

  // Set lower priority for JS (already pushed)
  if (res.setPriority) {
    res.setPriority({ weight: 50 });
  }

  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(js);
});

// Stream priority demo
app.get('/priority-test', async (req, res) => {
  // Critical data - highest priority
  if (res.setPriority) {
    res.setPriority({ weight: 256, exclusive: true });
  }

  res.json({
    message: 'This response has the highest priority',
    priority: 'critical',
    weight: 256,
    exclusive: true,
  });
});

// Background data - low priority
app.get('/background-data', (req, res) => {
  // Non-critical data - lowest priority
  if (res.setPriority) {
    res.setPriority({ weight: 1 });
  }

  res.json({
    message: 'This is background data with low priority',
    priority: 'low',
    weight: 1,
    exclusive: false,
  });
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 HTTP/2 Server Running');
  console.log('='.repeat(60));
  console.log(`\nServer listening on https://localhost:${PORT}`);
  console.log('\nHTTP/2 Features:');
  console.log('  ✓ Server Push enabled');
  console.log('  ✓ Stream prioritization enabled');
  console.log('  ✓ Header compression (HPACK) enabled');
  console.log('  ✓ Multiplexing enabled');
  console.log('\nRoutes:');
  console.log(`  - https://localhost:${PORT}/             (Auto push demo)`);
  console.log(`  - https://localhost:${PORT}/push-demo    (Manual push demo)`);
  console.log(`  - https://localhost:${PORT}/api/data     (API endpoint)`);
  console.log(`  - https://localhost:${PORT}/priority-test (Priority demo)`);
  console.log('\nNote: Accept self-signed certificate in browser');
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('\n⚠️  WARNING: SSL certificates not found!');
    console.log('Generate certificates with:');
    console.log('  openssl req -x509 -newkey rsa:2048 -nodes -sha256 \\');
    console.log("    -subj '/CN=localhost' \\");
    console.log('    -keyout localhost-key.pem \\');
    console.log('    -out localhost-cert.pem');
  }
  console.log('='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down HTTP/2 server gracefully...');
  await app.close();
  console.log('Server closed');
  process.exit(0);
});

// Export for testing
export default app;
