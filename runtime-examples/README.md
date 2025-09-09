# MoroJS Runtime Examples

This directory contains examples showing how to use MoroJS across different runtime environments while maintaining the same API and developer experience.

## Overview

MoroJS now supports multiple runtime environments through a unified interface:

- **Node.js** (default) - Traditional Node.js HTTP server
- **Vercel Edge** - Vercel Edge Functions
- **AWS Lambda** - AWS Lambda functions with API Gateway
- **Cloudflare Workers** - Cloudflare Workers

## Key Features

✅ **Same API everywhere** - Your route definitions work identically across all runtimes
✅ **Zero breaking changes** - Existing Node.js code continues to work unchanged
✅ **Runtime-specific optimizations** - Each adapter is optimized for its environment
✅ **Type safety** - Full TypeScript support for all runtime environments
✅ **Automatic request/response adaptation** - Seamless conversion between runtime formats

## Quick Start

### Node.js (Default - No Changes Required)

```typescript
import { createApp } from '@morojs/moro';

const app = createApp();

app.get('/', (req, res) => {
  return { message: 'Hello World!' };
});

app.listen(3000);
```

### Vercel Edge Functions

```typescript
import { createAppEdge } from '@morojs/moro';

const app = createAppEdge();

app.get('/', (req, res) => {
  return { message: 'Hello from the Edge!' };
});

export default app.getHandler(); // Export for Vercel
```

### AWS Lambda

```typescript
import { createAppLambda } from '@morojs/moro';

const app = createAppLambda();

app.get('/', (req, res) => {
  return { message: 'Hello from Lambda!' };
});

export const handler = app.getHandler(); // Export for Lambda
```

### Cloudflare Workers

```typescript
import { createAppWorker } from '@morojs/moro';

const app = createAppWorker();

app.get('/', (req, res) => {
  return { message: 'Hello from Workers!' };
});

export default {
  async fetch(request, env, ctx) {
    return app.getHandler()(request, env, ctx);
  },
};
```

## Runtime-Specific Features

### Node.js

- Full HTTP server capabilities
- WebSocket support
- File system access
- Process management

### Vercel Edge

- Global edge deployment
- Fast cold starts
- Streaming responses
- Geographic routing

### AWS Lambda

- Auto-scaling
- Pay-per-request
- VPC integration
- Event-driven architecture

### Cloudflare Workers

- Global edge network
- Instant deployment
- KV storage integration
- Durable Objects support

## Configuration Options

You can also use the generic `createApp()` with runtime configuration:

```typescript
import { createApp } from '@morojs/moro';

const app = createApp({
  runtime: {
    type: 'vercel-edge', // 'node' | 'vercel-edge' | 'aws-lambda' | 'cloudflare-workers'
    options: {
      // Runtime-specific options
    },
  },
});
```

## Migration Guide

### From Node.js to Other Runtimes

1. **Change the import**:

   ```typescript
   // From
   import { createApp } from '@morojs/moro';

   // To (for example, Vercel Edge)
   import { createAppEdge } from '@morojs/moro';
   ```

2. **Replace `listen()` with `getHandler()`**:

   ```typescript
   // From
   app.listen(3000);

   // To
   export default app.getHandler();
   ```

3. **Update deployment configuration** (see individual examples)

4. **Test runtime-specific features** (optional)

### Runtime Limitations

- **File system access**: Limited in edge/serverless environments
- **WebSockets**: Not available in Lambda/Edge (use alternative solutions)
- **Long-running processes**: Not suitable for serverless environments
- **State persistence**: Use external storage in serverless environments

## Best Practices

1. **Keep handlers stateless** - Don't rely on global state
2. **Use environment variables** - For configuration across runtimes
3. **Optimize for cold starts** - Minimize initialization code
4. **Handle errors gracefully** - Each runtime has different error handling
5. **Test locally** - Use runtime-specific development tools

## Development Workflow

1. **Develop locally** with Node.js runtime
2. **Test with target runtime** using local simulators
3. **Deploy to staging** environment
4. **Monitor performance** and adjust as needed

## Examples in This Directory

- `node-example.ts` - Traditional Node.js server
- `vercel-edge-example.ts` - Vercel Edge Functions
- `aws-lambda-example.ts` - AWS Lambda with API Gateway
- `cloudflare-worker-example.ts` - Cloudflare Workers

Each example includes deployment instructions and runtime-specific configurations.

## Need Help?

- [MoroJS Documentation](https://morojs.com)
- [Report Issues](https://github.com/morojs/moro/issues)
- [Community Discord](https://discord.gg/morojs)
- [Email Support](mailto:support@morojs.com)
