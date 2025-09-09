import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  createdAt: Date;
}

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class AuthService {
  private db: Pool;
  private jwtSecret: string;

  constructor() {
    this.db = new Pool({
      connectionString:
        process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db',
    });

    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  async register(userData: CreateUserData): Promise<User> {
    // Check if user already exists
    const existingUser = await this.db.query('SELECT id FROM users WHERE email = $1', [
      userData.email,
    ]);

    if (existingUser.rows.length > 0) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const userId = uuidv4();
    const result = await this.db.query(
      `
      INSERT INTO users (id, email, first_name, last_name, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, $5, 'customer', NOW())
      RETURNING id, email, first_name, last_name, role, created_at
    `,
      [userId, userData.email, userData.firstName, userData.lastName, hashedPassword]
    );

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at,
    };
  }

  async login(email: string, password: string): Promise<User> {
    // Get user by email
    const result = await this.db.query(
      'SELECT id, email, first_name, last_name, password_hash, role, created_at FROM users WHERE email = $1',
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
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      createdAt: user.created_at,
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
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at,
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

  // Admin role middleware
  requireAdmin = async (context: any, next: any) => {
    if (!context.user) {
      throw new Error('Authentication required');
    }

    if (context.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    await next();
  };
}
