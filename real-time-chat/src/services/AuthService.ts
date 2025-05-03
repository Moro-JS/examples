import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

interface CreateUserData {
  username: string;
  email: string;
  password: string;
}

export class AuthService {
  private db: Pool;
  private jwtSecret: string;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/chat_app'
    });
    
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  async register(userData: CreateUserData): Promise<User> {
    // Check if user already exists
    const existingUser = await this.db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [userData.email, userData.username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email or username');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const userId = uuidv4();
    const result = await this.db.query(`
      INSERT INTO users (id, username, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, username, email, created_at
    `, [userId, userData.username, userData.email, hashedPassword]);

    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      createdAt: result.rows[0].created_at
    };
  }

  async login(email: string, password: string): Promise<User> {
    // Get user by email
    const result = await this.db.query(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.created_at
    };
  }

  generateToken(userId: string): string {
    return jwt.sign({ userId }, this.jwtSecret, { expiresIn: '7d' });
  }

  verifyToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return { userId: decoded.userId };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      createdAt: result.rows[0].created_at
    };
  }

  // Middleware for HTTP authentication
  authenticate = async (context: any, next: any) => {
    const authHeader = context.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authentication required');
    }

    const token = authHeader.substring(7);
    
    try {
      const { userId } = this.verifyToken(token);
      const user = await this.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      context.user = user;
      await next();
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  };

  // Middleware for WebSocket authentication
  authenticateWS = async (context: any, next: any) => {
    // For WebSocket, we'll get the token from query params or headers
    const token = context.query?.token || context.headers?.authorization?.substring(7);
    
    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const { userId } = this.verifyToken(token);
      const user = await this.getUserById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      context.user = user;
      await next();
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  };
} 