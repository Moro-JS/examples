# Real-time Chat Application

A complete real-time chat application built with MoroJS, featuring WebSockets, user authentication, and message persistence.

## Features

- **User Authentication** - JWT-based authentication with registration and login
- **Real-time Messaging** - Instant message delivery via WebSockets
- **Room-based Chat** - Create and join different chat rooms
- **User Presence** - See who's online in each room
- **Typing Indicators** - Real-time typing status
- **Message History** - Persistent message storage with pagination
- **Read Receipts** - Track message read status
- **Modern UI Ready** - API ready for frontend integration

## Tech Stack

- **Backend**: MoroJS (Node.js framework)
- **WebSockets**: Built-in MoroJS WebSocket support
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for user presence and session management
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schema validation

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/Moro-JS/examples.git
   cd examples/real-time-chat
   npm install
   ```

2. **Setup environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis URLs
   ```

3. **Setup database:**

   ```bash
   # Create database
   createdb chat_app

   # Run schema
   psql -d chat_app -f database/schema.sql

   # Optional: Run seed data
   npm run db:seed
   ```

4. **Start development server:**

   ```bash
   npm run dev
   ```

5. **Test the application:**

   ```bash
   # Register a user
   curl -X POST http://localhost:3000/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'

   # Login
   curl -X POST http://localhost:3000/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "test@example.com", "password": "password123"}'
   ```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Rooms

- `GET /rooms` - Get user's rooms
- `POST /rooms` - Create new room

### Messages

- `GET /rooms/:roomId/messages` - Get room messages (paginated)
- `POST /rooms/:roomId/messages` - Send message to room

### WebSocket

- `WS /chat/:roomId?token=JWT_TOKEN` - Join room for real-time chat

## WebSocket Events

### Client to Server

```javascript
// Send message
{
  "type": "chat_message",
  "content": "Hello world!",
  "messageType": "text"
}

// Start typing
{
  "type": "typing_start"
}

// Stop typing
{
  "type": "typing_stop"
}

// Mark message as read
{
  "type": "message_read",
  "messageId": "uuid"
}
```

### Server to Client

```javascript
// New message
{
  "type": "new_message",
  "message": {
    "id": "uuid",
    "content": "Hello world!",
    "username": "testuser",
    "createdAt": "2023-01-01T00:00:00Z"
  }
}

// User joined
{
  "type": "user_joined",
  "user": {"id": "uuid", "username": "testuser"},
  "users": [...],
  "timestamp": "2023-01-01T00:00:00Z"
}

// User typing
{
  "type": "user_typing",
  "userId": "uuid",
  "username": "testuser",
  "isTyping": true
}
```

## Database Schema

The application uses the following main tables:

- **users** - User accounts and authentication
- **rooms** - Chat rooms
- **room_members** - User membership in rooms
- **messages** - Chat messages with history
- **message_reads** - Read receipt tracking

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

### Project Structure

```
src/
├── services/
│   ├── AuthService.ts     # Authentication logic
│   └── ChatService.ts     # Chat functionality
├── server.ts              # Main application entry
database/
├── schema.sql             # Database schema
├── seeds/                 # Sample data
└── migrations/            # Database migrations
```

## Frontend Integration

This API is designed to work with any frontend framework. Here's a basic WebSocket client example:

```javascript
// Connect to chat room
const token = localStorage.getItem('authToken');
const ws = new WebSocket(\`ws://localhost:3000/chat/\${roomId}?token=\${token}\`);

// Listen for messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'new_message':
      displayMessage(data.message);
      break;
    case 'user_joined':
      updateUserList(data.users);
      break;
    case 'user_typing':
      showTypingIndicator(data.username, data.isTyping);
      break;
  }
};

// Send message
function sendMessage(content) {
  ws.send(JSON.stringify({
    type: 'chat_message',
    content: content
  }));
}
```

## Production Deployment

For production deployment:

1. **Environment Variables:**

   ```bash
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key
   DATABASE_URL=postgresql://user:pass@host:port/db
   REDIS_URL=redis://host:port
   ```

2. **Database Setup:**
   - Use connection pooling
   - Enable SSL for PostgreSQL
   - Set up Redis persistence

3. **Security:**
   - Use strong JWT secrets
   - Enable CORS properly
   - Use HTTPS/WSS in production
   - Rate limit API endpoints

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
