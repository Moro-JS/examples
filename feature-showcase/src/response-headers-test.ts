// Response Headers Test - Verify all response methods set proper headers
import { createApp } from '@morojs/moro';

const app = createApp();

// Test res.json() - should set application/json; charset=utf-8
app.get('/test/json', (req, res) => {
  res.json({ message: 'JSON response test', success: true });
});

// Test res.send() with string - should auto-detect and set text/plain; charset=utf-8
app.get('/test/send-text', (req, res) => {
  res.send('Plain text response');
});

// Test res.send() with JSON string - should auto-detect and set application/json; charset=utf-8
app.get('/test/send-json', (req, res) => {
  res.send('{"message": "JSON string response", "success": true}');
});

// Test res.send() with buffer - should set application/octet-stream
app.get('/test/send-buffer', (req, res) => {
  res.send(Buffer.from('Buffer response'));
});

// Test with manual Content-Type - should not override
app.get('/test/manual-type', (req, res) => {
  res.setHeader('Content-Type', 'application/xml');
  res.send('<xml>Manual content type</xml>');
});

// Test res.redirect() - should set Location header
app.get('/test/redirect', (req, res) => {
  res.redirect('/test/json');
});

// Test status chaining
app.get('/test/status', (req, res) => {
  res.status(201).json({ message: 'Created', id: 123 });
});

// Headers inspection endpoint
app.get('/test/headers/:method', (req, res) => {
  const method = req.params.method;
  const testUrl = `http://localhost:3010/test/${method}`;

  res.json({
    message: `Test the ${method} endpoint`,
    testUrl,
    instructions: `curl -I ${testUrl} to see headers`,
  });
});

// List all test endpoints
app.get('/test', (req, res) => {
  res.json({
    message: 'Response Headers Test Suite',
    endpoints: {
      json: '/test/json - JSON response with res.json()',
      'send-text': '/test/send-text - Text response with res.send()',
      'send-json': '/test/send-json - JSON string with res.send()',
      'send-buffer': '/test/send-buffer - Buffer with res.send()',
      'manual-type': '/test/manual-type - Manual Content-Type header',
      redirect: '/test/redirect - Redirect test',
      status: '/test/status - Status chaining',
      headers: '/test/headers/:method - Get test instructions',
    },
    usage: 'Use curl -I to check headers for each endpoint',
  });
});

const PORT = parseInt(process.env.PORT || '3010');
app.listen(PORT, () => {
  console.log(`Response Headers Test running on http://localhost:${PORT}`);
  console.log(`
Response Method Testing:

Test Endpoints:
  GET  /test                    - List all test endpoints
  GET  /test/json               - res.json() header test
  GET  /test/send-text          - res.send() text header test  
  GET  /test/send-json          - res.send() JSON detection test
  GET  /test/send-buffer        - res.send() buffer test
  GET  /test/manual-type        - Manual Content-Type test
  GET  /test/redirect           - res.redirect() test
  GET  /test/status             - Status chaining test

Header Verification:
  curl -I http://localhost:${PORT}/test/json
  curl -I http://localhost:${PORT}/test/send-text
  curl -I http://localhost:${PORT}/test/send-json

Expected Headers:
  JSON responses: Content-Type: application/json; charset=utf-8
  Text responses: Content-Type: text/plain; charset=utf-8
  Buffer responses: Content-Type: application/octet-stream
  Manual types: Content-Type: [user-specified]
  `);
});

export default app;
