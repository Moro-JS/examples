# Queue Example

Demonstrates message queue functionality with MoroJS, including job management, processing, monitoring, and integration with HTTP routes.

## Features

- Multiple queue adapters (memory, bull, rabbitmq, sqs, kafka)
- Job processing with progress tracking
- Priority queues
- Bulk job operations
- Job status and metrics
- Queue control (pause/resume)
- Retry logic with exponential backoff
- Scheduled and delayed jobs

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

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| `POST` | `/api/queue/email`                 | Add email job             |
| `POST` | `/api/queue/critical`              | Add critical priority job |
| `POST` | `/api/queue/background`            | Add background job        |
| `POST` | `/api/queue/bulk`                  | Add multiple jobs         |
| `GET`  | `/api/queue/jobs/:queue/:id`       | Get job status            |
| `GET`  | `/api/queue/metrics/:queue`        | Get queue metrics         |
| `GET`  | `/api/queue/status/:queue`         | Get queue status          |
| `POST` | `/api/queue/:queue/pause`          | Pause queue               |
| `POST` | `/api/queue/:queue/resume`         | Resume queue              |
| `POST` | `/api/queue/:queue/jobs/:id/retry` | Retry failed job          |
| `GET`  | `/health`                          | Health check              |

## Testing

### Add Email Job

```bash
curl -X POST http://localhost:3000/api/queue/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Welcome",
    "body": "Welcome to our platform!"
  }'
```

### Add Critical Job

```bash
curl -X POST http://localhost:3000/api/queue/critical \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Process payment",
    "priority": 1
  }'
```

### Add Background Job

```bash
curl -X POST http://localhost:3000/api/queue/background \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Generate report",
    "steps": 10
  }'
```

### Add Bulk Jobs

```bash
curl -X POST http://localhost:3000/api/queue/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "queue": "emails",
    "jobs": [
      {"to": "user1@example.com", "subject": "Hello", "body": "Message 1"},
      {"to": "user2@example.com", "subject": "Hello", "body": "Message 2"},
      {"to": "user3@example.com", "subject": "Hello", "body": "Message 3"}
    ]
  }'
```

### Get Job Status

```bash
curl http://localhost:3000/api/queue/jobs/emails/job-id-here
```

### Get Queue Metrics

```bash
curl http://localhost:3000/api/queue/metrics/emails
```

### Get Queue Status

```bash
curl http://localhost:3000/api/queue/status/emails
```

### Pause Queue

```bash
curl -X POST http://localhost:3000/api/queue/emails/pause
```

### Resume Queue

```bash
curl -X POST http://localhost:3000/api/queue/emails/resume
```

### Retry Failed Job

```bash
curl -X POST http://localhost:3000/api/queue/emails/jobs/job-id-here/retry
```

## Queue Adapters

The example uses the `memory` adapter by default. To use a production adapter, uncomment and configure one in `src/server.ts`:

### Bull (Redis-based)

```typescript
app.queueInit('emails', {
  adapter: 'bull',
  connection: {
    host: 'localhost',
    port: 6379,
    password: 'redis-password',
  },
  concurrency: 10,
});
```

### RabbitMQ

```typescript
app.queueInit('tasks', {
  adapter: 'rabbitmq',
  connection: {
    host: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
  },
  concurrency: 20,
});
```

### AWS SQS

```typescript
app.queueInit('events', {
  adapter: 'sqs',
  connection: {
    region: 'us-east-1',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue',
  },
  concurrency: 10,
});
```

### Kafka

```typescript
app.queueInit('streams', {
  adapter: 'kafka',
  connection: {
    brokers: ['localhost:9092'],
    groupId: 'my-consumer-group',
  },
  concurrency: 50,
});
```

## Concepts Demonstrated

- **Queue Registration**: Setting up queues with different adapters
- **Job Processing**: Processing jobs with progress tracking
- **Priority Queues**: High-priority job handling
- **Bulk Operations**: Adding multiple jobs at once
- **Job Status**: Checking job status and progress
- **Queue Metrics**: Monitoring queue performance
- **Queue Control**: Pausing and resuming queues
- **Retry Logic**: Automatic retry with exponential backoff
- **Scheduled Jobs**: Cron-based job scheduling
- **Delayed Jobs**: Jobs with delay before processing

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version

## Next Steps

- Explore [Queue Guide](../examples/QUEUE_GUIDE.md) for complete documentation
- Try different adapters for production use
- Implement dead letter queues for failed jobs
- Add monitoring and alerting for queue health
