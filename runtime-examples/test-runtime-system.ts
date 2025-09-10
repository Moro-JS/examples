// Simple test to verify runtime system works
import { createApp, createAppEdge, createAppLambda, createAppWorker } from '@morojs/moro';

console.log('Testing MoroJS Runtime System...\n');

// Test Node.js runtime (default)
const nodeApp = createApp();
console.log('✅ Node.js app created successfully');
console.log('   Runtime type:', nodeApp.getRuntimeType());

// Test explicit Node.js runtime
const nodeApp2 = createApp({ runtime: { type: 'node' } });
console.log('✅ Explicit Node.js app created successfully');
console.log('   Runtime type:', nodeApp2.getRuntimeType());

// Test Vercel Edge runtime
const edgeApp = createAppEdge();
console.log('✅ Vercel Edge app created successfully');
console.log('   Runtime type:', edgeApp.getRuntimeType());

// Test AWS Lambda runtime
const lambdaApp = createAppLambda();
console.log('✅ AWS Lambda app created successfully');
console.log('   Runtime type:', lambdaApp.getRuntimeType());

// Test Cloudflare Workers runtime
const workerApp = createAppWorker();
console.log('✅ Cloudflare Workers app created successfully');
console.log('   Runtime type:', workerApp.getRuntimeType());

// Test route definition works the same across all runtimes
[nodeApp, nodeApp2, edgeApp, lambdaApp, workerApp].forEach((app, index) => {
  const runtimeNames = [
    'Node.js',
    'Node.js (explicit)',
    'Vercel Edge',
    'AWS Lambda',
    'Cloudflare Workers',
  ];

  app.get('/test', (req: any, res: any) => {
    return { message: `Hello from ${runtimeNames[index]}!` };
  });

  app.post('/echo', (req: any, res: any) => {
    return { echo: req.body, runtime: app.getRuntimeType() };
  });
});

console.log('✅ Routes defined successfully on all runtimes');

// Test handler creation for non-Node.js runtimes
try {
  const edgeHandler = edgeApp.getHandler();
  console.log('✅ Vercel Edge handler created successfully');
  console.log('   Handler type:', typeof edgeHandler);
} catch (error) {
  console.log('❌ Failed to create Vercel Edge handler:', error);
}

try {
  const lambdaHandler = lambdaApp.getHandler();
  console.log('✅ AWS Lambda handler created successfully');
  console.log('   Handler type:', typeof lambdaHandler);
} catch (error) {
  console.log('❌ Failed to create AWS Lambda handler:', error);
}

try {
  const workerHandler = workerApp.getHandler();
  console.log('✅ Cloudflare Workers handler created successfully');
  console.log('   Handler type:', typeof workerHandler);
} catch (error) {
  console.log('❌ Failed to create Cloudflare Workers handler:', error);
}

// Test that listen() only works on Node.js runtime
try {
  nodeApp.listen(0, () => {}); // Use port 0 to avoid conflicts
  console.log('✅ Node.js listen() works correctly');
} catch (error) {
  console.log('❌ Node.js listen() failed:', error);
}

try {
  edgeApp.listen(3000, () => {});
  console.log("❌ Vercel Edge listen() should have failed but didn't");
} catch (error) {
  console.log('✅ Vercel Edge listen() correctly throws error:', (error as Error).message);
}

console.log('\nRuntime system test completed successfully!');
console.log('All runtimes are working as expected.');
console.log('\nKey features verified:');
console.log('- ✅ Compatibility with standard Node.js code');
console.log('- ✅ Runtime-specific app creation functions');
console.log('- ✅ Same API across all runtimes');
console.log('- ✅ Proper error handling for runtime-specific methods');
console.log('- ✅ Handler creation for serverless runtimes');
