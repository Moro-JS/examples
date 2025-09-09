import { Pool } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';

interface WebSocketConnection {
  ws: WebSocket;
  userId: string;
  roomId: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: Date;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
}

export class ChatService {
  private connections: Map<string, WebSocketConnection[]> = new Map();
  private db: Pool;
  private redis: RedisClientType;

  constructor() {
    this.db = new Pool({
      connectionString:
        process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/chat_app',
    });

    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.redis.connect().catch(console.error);
  }

  async joinRoom(roomId: string, userId: string, ws: WebSocket): Promise<void> {
    const connection: WebSocketConnection = { ws, userId, roomId };

    if (!this.connections.has(roomId)) {
      this.connections.set(roomId, []);
    }

    const roomConnections = this.connections.get(roomId)!;

    // Remove any existing connection for this user
    const existingIndex = roomConnections.findIndex(conn => conn.userId === userId);
    if (existingIndex !== -1) {
      roomConnections.splice(existingIndex, 1);
    }

    roomConnections.push(connection);

    // Update user presence in Redis
    await this.redis.sadd(`room:${roomId}:users`, userId);
    await this.redis.setex(`user:${userId}:last_seen`, 300, Date.now().toString());
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomConnections = this.connections.get(roomId);
    if (roomConnections) {
      const index = roomConnections.findIndex(conn => conn.userId === userId);
      if (index !== -1) {
        roomConnections.splice(index, 1);
      }

      if (roomConnections.length === 0) {
        this.connections.delete(roomId);
      }
    }

    // Remove user from Redis presence
    await this.redis.srem(`room:${roomId}:users`, userId);
  }

  broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void {
    const roomConnections = this.connections.get(roomId);
    if (!roomConnections) return;

    const messageString = JSON.stringify(message);

    roomConnections.forEach(connection => {
      if (excludeUserId && connection.userId === excludeUserId) return;

      try {
        connection.ws.send(messageString);
      } catch (error) {
        console.error('Failed to send message to user:', connection.userId, error);
        // Remove dead connection
        this.leaveRoom(roomId, connection.userId);
      }
    });
  }

  async handleChatMessage(roomId: string, userId: string, messageData: any): Promise<ChatMessage> {
    // Get user info
    const userResult = await this.db.query('SELECT username FROM users WHERE id = $1', [userId]);

    if (!userResult.rows[0]) {
      throw new Error('User not found');
    }

    const message: ChatMessage = {
      id: uuidv4(),
      roomId,
      userId,
      username: userResult.rows[0].username,
      content: messageData.content,
      type: messageData.type || 'text',
      createdAt: new Date(),
    };

    // Save message to database
    await this.db.query(
      `
      INSERT INTO messages (id, room_id, user_id, content, type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [message.id, message.roomId, message.userId, message.content, message.type, message.createdAt]
    );

    return message;
  }

  async getRecentMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const result = await this.db.query(
      `
      SELECT m.id, m.room_id, m.user_id, u.username, m.content, m.type, m.created_at
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2
    `,
      [roomId, limit]
    );

    return result.rows
      .map(row => ({
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        username: row.username,
        content: row.content,
        type: row.type,
        createdAt: row.created_at,
      }))
      .reverse();
  }

  async getMessages(
    roomId: string,
    options: { page: number; limit: number }
  ): Promise<{ messages: ChatMessage[]; total: number }> {
    const offset = (options.page - 1) * options.limit;

    const [messagesResult, countResult] = await Promise.all([
      this.db.query(
        `
        SELECT m.id, m.room_id, m.user_id, u.username, m.content, m.type, m.created_at
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2 OFFSET $3
      `,
        [roomId, options.limit, offset]
      ),

      this.db.query(
        `
        SELECT COUNT(*) as total
        FROM messages
        WHERE room_id = $1
      `,
        [roomId]
      ),
    ]);

    const messages = messagesResult.rows
      .map(row => ({
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        username: row.username,
        content: row.content,
        type: row.type,
        createdAt: row.created_at,
      }))
      .reverse();

    return {
      messages,
      total: parseInt(countResult.rows[0].total),
    };
  }

  async createMessage(
    roomId: string,
    userId: string,
    messageData: { content: string; type?: string }
  ): Promise<ChatMessage> {
    return this.handleChatMessage(roomId, userId, messageData);
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    await this.db.query(
      `
      INSERT INTO message_reads (message_id, user_id, read_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (message_id, user_id) DO NOTHING
    `,
      [messageId, userId]
    );
  }

  async getRoomUsers(
    roomId: string
  ): Promise<Array<{ id: string; username: string; isOnline: boolean }>> {
    // Get users from Redis (online users)
    const onlineUserIds = await this.redis.smembers(`room:${roomId}:users`);

    // Get all room members from database
    const result = await this.db.query(
      `
      SELECT DISTINCT u.id, u.username
      FROM users u
      JOIN room_members rm ON u.id = rm.user_id
      WHERE rm.room_id = $1
    `,
      [roomId]
    );

    return result.rows.map(user => ({
      id: user.id,
      username: user.username,
      isOnline: onlineUserIds.includes(user.id),
    }));
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    const result = await this.db.query(
      `
      SELECT r.id, r.name, r.description, r.created_by, r.created_at
      FROM rooms r
      JOIN room_members rm ON r.id = rm.room_id
      WHERE rm.user_id = $1
      ORDER BY r.created_at DESC
    `,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdBy: row.created_by,
      createdAt: row.created_at,
    }));
  }

  async createRoom(roomData: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<Room> {
    const roomId = uuidv4();

    await this.db.query('BEGIN');

    try {
      // Create room
      const roomResult = await this.db.query(
        `
        INSERT INTO rooms (id, name, description, created_by, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `,
        [roomId, roomData.name, roomData.description, roomData.createdBy]
      );

      // Add creator as room member
      await this.db.query(
        `
        INSERT INTO room_members (room_id, user_id, joined_at)
        VALUES ($1, $2, NOW())
      `,
        [roomId, roomData.createdBy]
      );

      await this.db.query('COMMIT');

      return {
        id: roomResult.rows[0].id,
        name: roomResult.rows[0].name,
        description: roomResult.rows[0].description,
        createdBy: roomResult.rows[0].created_by,
        createdAt: roomResult.rows[0].created_at,
      };
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }
}
