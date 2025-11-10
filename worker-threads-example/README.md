# Worker Threads Example

Demonstrates automatic worker thread usage with MoroJS, showing how to intelligently offload heavy computations to worker threads based on load.

## Features

- Automatic worker thread scaling based on load
- JWT operations with worker thread offloading
- Heavy computation with automatic offloading
- Configurable worker thread pool
- Smart load-based execution strategy

## Usage

### For Moro Framework Development

When working in the MoroJS monorepo (has `../../MoroJS` directory):

```bash
npm install  # Uses local MoroJS source automatically
npm run dev  # Real-time TypeScript development
```

### For External Developers

When using this example standalone:

```bash
npm run switch:npm  # Installs moro from npm
npm run dev         # Runs with published package
```

## API Endpoints

| Method | Endpoint              | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| `GET`  | `/auth/verify/:token` | JWT verification with automatic worker scaling |
| `POST` | `/api/process-data`   | Heavy computation with automatic offloading    |

## Testing

```bash
# Test JWT verification
curl http://localhost:3000/auth/verify/your-token-here

# Test data processing
curl -X POST http://localhost:3000/api/process-data \
  -H "Content-Type: application/json" \
  -d '[1, 2, 3, 4, 5]'
```

## Concepts Demonstrated

- **Automatic Worker Thread Scaling**: Worker threads are used automatically when load exceeds thresholds
- **Load-Based Execution**: Smart decision making between synchronous and worker thread execution
- **Worker Thread Pool**: Configurable pool of worker threads for parallel processing
- **Performance Optimization**: Offload CPU-intensive tasks to maintain main thread responsiveness

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
