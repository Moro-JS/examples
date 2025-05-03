import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  inventory: number;
  images: string[];
  active: boolean;
  createdAt: Date;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

interface ProductSearchQuery {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page: number;
  limit: number;
  sortBy: 'price' | 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
}

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  inventory: number;
  images?: string[];
}

export class ProductService {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db'
    });
  }

  async getProducts(query: ProductSearchQuery): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    const offset = (query.page - 1) * query.limit;
    
    let whereClause = 'WHERE p.active = true';
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Build WHERE clause dynamically
    if (query.category) {
      whereClause += ` AND c.name ILIKE $${paramIndex}`;
      queryParams.push(`%${query.category}%`);
      paramIndex++;
    }

    if (query.search) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      queryParams.push(`%${query.search}%`);
      paramIndex++;
    }

    if (query.minPrice !== undefined) {
      whereClause += ` AND p.price >= $${paramIndex}`;
      queryParams.push(query.minPrice);
      paramIndex++;
    }

    if (query.maxPrice !== undefined) {
      whereClause += ` AND p.price <= $${paramIndex}`;
      queryParams.push(query.maxPrice);
      paramIndex++;
    }

    if (query.inStock) {
      whereClause += ` AND i.quantity > 0`;
    }

    // Order clause
    const orderClause = `ORDER BY p.${query.sortBy} ${query.sortOrder.toUpperCase()}`;

    // Get products
    const productsQuery = `
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id, c.name as category_name,
        i.quantity as inventory, p.images, p.active, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(query.limit, offset);

    const [productsResult, countResult] = await Promise.all([
      this.db.query(productsQuery, queryParams),
      this.db.query(`
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        ${whereClause}
      `, queryParams.slice(0, -2)) // Remove limit and offset params for count
    ]);

    const products = productsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      categoryId: row.category_id,
      categoryName: row.category_name,
      inventory: row.inventory || 0,
      images: row.images || [],
      active: row.active,
      createdAt: row.created_at
    }));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / query.limit);

    return {
      products,
      total,
      page: query.page,
      totalPages
    };
  }

  async getProductById(productId: string): Promise<Product | null> {
    const result = await this.db.query(`
      SELECT 
        p.id, p.name, p.description, p.price, p.category_id, c.name as category_name,
        i.quantity as inventory, p.images, p.active, p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1 AND p.active = true
    `, [productId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      categoryId: row.category_id,
      categoryName: row.category_name,
      inventory: row.inventory || 0,
      images: row.images || [],
      active: row.active,
      createdAt: row.created_at
    };
  }

  async getCategories(): Promise<Category[]> {
    const result = await this.db.query(`
      SELECT id, name, description, active
      FROM categories
      WHERE active = true
      ORDER BY name
    `);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      active: row.active
    }));
  }

  async createProduct(productData: CreateProductData, createdBy: string): Promise<Product> {
    const productId = uuidv4();

    await this.db.query('BEGIN');

    try {
      // Create product
      const productResult = await this.db.query(`
        INSERT INTO products (id, name, description, price, category_id, images, active, created_at, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), $7)
        RETURNING *
      `, [
        productId,
        productData.name,
        productData.description,
        productData.price,
        productData.categoryId,
        JSON.stringify(productData.images || []),
        createdBy
      ]);

      // Create inventory record
      await this.db.query(`
        INSERT INTO inventory (product_id, quantity, updated_at)
        VALUES ($1, $2, NOW())
      `, [productId, productData.inventory]);

      await this.db.query('COMMIT');

      // Get the complete product with category info
      const product = await this.getProductById(productId);
      return product!;
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  async updateProduct(productId: string, updates: Partial<CreateProductData & { active: boolean }>): Promise<Product> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      values.push(updates.name);
      paramIndex++;
    }

    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex}`);
      values.push(updates.description);
      paramIndex++;
    }

    if (updates.price !== undefined) {
      setClauses.push(`price = $${paramIndex}`);
      values.push(updates.price);
      paramIndex++;
    }

    if (updates.active !== undefined) {
      setClauses.push(`active = $${paramIndex}`);
      values.push(updates.active);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      throw new Error('No updates provided');
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(productId);

    await this.db.query(`
      UPDATE products 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
    `, values);

    // Update inventory if provided
    if (updates.inventory !== undefined) {
      await this.db.query(`
        UPDATE inventory
        SET quantity = $1, updated_at = NOW()
        WHERE product_id = $2
      `, [updates.inventory, productId]);
    }

    const product = await this.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async checkInventory(productId: string, requestedQuantity: number): Promise<boolean> {
    const result = await this.db.query(
      'SELECT quantity FROM inventory WHERE product_id = $1',
      [productId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].quantity >= requestedQuantity;
  }

  async updateInventory(productId: string, quantityChange: number): Promise<void> {
    await this.db.query(`
      UPDATE inventory
      SET quantity = quantity + $1, updated_at = NOW()
      WHERE product_id = $2
    `, [quantityChange, productId]);
  }
} 