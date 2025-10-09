#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');
const https = require('https');
const { findExampleDirectories } = require('./utils');

console.log('🧪 Running integration tests for all examples...\n');

const examples = findExampleDirectories();

console.log(`Found ${examples.length} examples:`);
examples.forEach(example => console.log(`  • ${example}`));
console.log('');

let successCount = 0;
let errorCount = 0;
let skippedCount = 0;

// Test configurations for each example - based on ACTUAL ports from server files
const testConfigs = {
  'simple-api': {
    port: 3000, // From moro.config.ts
    endpoints: [
      { path: '/', method: 'GET', expectedStatus: 200 },
      { path: '/health', method: 'GET', expectedStatus: 200 },
      { path: '/users', method: 'GET', expectedStatus: 200 },
    ],
    timeout: 10000,
  },
  'feature-showcase': {
    port: 3001, // From server.ts - uses config.server.port
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'enterprise-app': {
    port: 3002, // From server.ts - parseInt(process.env.PORT || '3002')
    endpoints: [
      { path: '/', method: 'GET', expectedStatus: 200 },
      { path: '/health', method: 'GET', expectedStatus: 200 },
      { path: '/test-direct', method: 'GET', expectedStatus: 200 },
    ],
    timeout: 15000,
  },
  'enterprise-events': {
    port: 3003, // From server.ts - app.listen(3003)
    endpoints: [
      { path: '/', method: 'GET', expectedStatus: 200 },
      { path: '/users', method: 'GET', expectedStatus: 200 },
      { path: '/orders', method: 'GET', expectedStatus: 200 },
    ],
    timeout: 15000,
  },
  'ecommerce-api': {
    port: 3004, // Using different port to avoid conflict
    endpoints: [
      { path: '/health', method: 'GET', expectedStatus: 200 },
      // Removed /categories - requires database setup
    ],
    timeout: 20000,
  },
  'real-time-chat': {
    port: 3005, // Using different port to avoid conflict
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'mcp-server': {
    port: 3010, // From server.ts - startHTTPMode(port: number = 3010)
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'microservice/user-service': {
    port: 3001, // From serviceInfo.port in server.ts
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'microservice/order-service': {
    port: 3002, // From serviceInfo.port in server.ts
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'microservice/payment-service': {
    port: 3003, // From serviceInfo.port in server.ts
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'simple-auth-example': {
    port: 3000, // From server.ts - parseInt(process.env.PORT || '3000', 10)
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
  'enterprise-auth-example': {
    port: 3001, // From server.ts - parseInt(process.env.PORT || '3001', 10)
    endpoints: [{ path: '/', method: 'GET', expectedStatus: 200 }],
    timeout: 15000,
  },
};

/**
 * Make HTTP request to test endpoint
 */
function makeRequest(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      timeout: 5000,
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Wait for server to be ready
 */
function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkServer = () => {
      // Try root endpoint first, then health
      makeRequest(port, '/')
        .then(() => {
          resolve();
        })
        .catch(() => {
          makeRequest(port, '/health')
            .then(() => {
              resolve();
            })
            .catch(() => {
              if (Date.now() - startTime > timeout) {
                reject(new Error(`Server on port ${port} not ready after ${timeout}ms`));
              } else {
                setTimeout(checkServer, 1000);
              }
            });
        });
    };

    checkServer();
  });
}

/**
 * Test a single example
 */
async function testExample(example) {
  const config = testConfigs[example];

  if (!config) {
    console.log(`⏭️  Skipping ${example} - no test configuration`);
    return { status: 'skipped' };
  }

  console.log(`🧪 Testing ${example} on port ${config.port}...`);

  let serverProcess = null;

  try {
    // Start the server with correct port
    console.log(`   Starting server on port ${config.port}...`);

    // Special handling for MCP server
    let command, args;
    if (example === 'mcp-server') {
      command = 'npm';
      args = ['run', 'dev', '--', 'http'];
    } else {
      command = 'npm';
      args = ['run', 'dev'];
    }

    serverProcess = spawn(command, args, {
      cwd: example,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, PORT: config.port.toString() },
    });

    // Wait for server to be ready
    console.log(`   Waiting for server to be ready...`);
    await waitForServer(config.port, config.timeout);
    console.log(`   Server is ready!`);

    // Test endpoints
    console.log(`   Testing endpoints...`);
    for (const endpoint of config.endpoints) {
      try {
        const response = await makeRequest(config.port, endpoint.path, endpoint.method);

        if (response.statusCode === endpoint.expectedStatus) {
          console.log(`   ✅ ${endpoint.method} ${endpoint.path} - ${response.statusCode}`);
        } else {
          console.log(
            `   ❌ ${endpoint.method} ${endpoint.path} - Expected ${endpoint.expectedStatus}, got ${response.statusCode}`
          );
          throw new Error(
            `Endpoint ${endpoint.path} returned ${response.statusCode}, expected ${endpoint.expectedStatus}`
          );
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint.method} ${endpoint.path} - ${error.message}`);
        throw error;
      }
    }

    console.log(`✅ ${example} - All tests passed`);
    return { status: 'success' };
  } catch (error) {
    console.log(`❌ ${example} - Tests failed: ${error.message}`);
    return { status: 'error', error: error.message };
  } finally {
    // Kill the server
    if (serverProcess) {
      console.log(`   Stopping server...`);
      serverProcess.kill('SIGTERM');

      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Force kill if still running
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  for (const example of examples) {
    const result = await testExample(example);

    switch (result.status) {
      case 'success':
        successCount++;
        break;
      case 'error':
        errorCount++;
        break;
      case 'skipped':
        skippedCount++;
        break;
    }

    console.log(''); // Add spacing between tests
  }

  // Print summary
  console.log('='.repeat(50));
  console.log(`🎉 Integration testing complete!`);
  console.log(`✅ Success: ${successCount} examples`);
  console.log(`⏭️  Skipped: ${skippedCount} examples (no test configuration)`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount} examples`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test terminated');
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
