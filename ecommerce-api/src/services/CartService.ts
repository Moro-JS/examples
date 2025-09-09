import { Pool } from 'pg';

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  updatedAt: Date;
}

export class CartService {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      connectionString:
        process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db',
    });
  }

  async getCart(userId: string): Promise<Cart> {
    const result = await this.db.query(
      `
      SELECT 
        ci.id, ci.user_id, ci.product_id, ci.quantity, ci.created_at, ci.updated_at,
        p.name as product_name, p.price as product_price, 
        (p.images->0)::text as product_image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND p.active = true
      ORDER BY ci.created_at DESC
    `,
      [userId]
    );

    const items: CartItem[] = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      productName: row.product_name,
      productPrice: parseFloat(row.product_price),
      productImage: row.product_image ? row.product_image.replace(/"/g, '') : undefined,
      quantity: row.quantity,
      subtotal: parseFloat(row.product_price) * row.quantity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const latestUpdate =
      items.length > 0
        ? new Date(Math.max(...items.map(item => item.updatedAt.getTime())))
        : new Date();

    return {
      items,
      totalItems,
      totalAmount,
      updatedAt: latestUpdate,
    };
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<CartItem> {
    // First check if product exists and has enough inventory
    const productResult = await this.db.query(
      `
      SELECT p.id, p.name, p.price, p.active, i.quantity as inventory,
             (p.images->0)::text as product_image
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1 AND p.active = true
    `,
      [productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Product not found or not available');
    }

    const product = productResult.rows[0];

    if (product.inventory < quantity) {
      throw new Error('Insufficient inventory');
    }

    // Check if item already exists in cart
    const existingItem = await this.db.query(
      `
      SELECT id, quantity
      FROM cart_items
      WHERE user_id = $1 AND product_id = $2
    `,
      [userId, productId]
    );

    if (existingItem.rows.length > 0) {
      // Update existing item
      const newQuantity = existingItem.rows[0].quantity + quantity;

      if (newQuantity > product.inventory) {
        throw new Error('Total quantity exceeds available inventory');
      }

      await this.db.query(
        `
        UPDATE cart_items
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2
      `,
        [newQuantity, existingItem.rows[0].id]
      );

      return {
        id: existingItem.rows[0].id,
        userId,
        productId,
        productName: product.name,
        productPrice: parseFloat(product.price),
        productImage: product.product_image ? product.product_image.replace(/"/g, '') : undefined,
        quantity: newQuantity,
        subtotal: parseFloat(product.price) * newQuantity,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      // Create new cart item
      const result = await this.db.query(
        `
        INSERT INTO cart_items (user_id, product_id, quantity, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, created_at, updated_at
      `,
        [userId, productId, quantity]
      );

      return {
        id: result.rows[0].id,
        userId,
        productId,
        productName: product.name,
        productPrice: parseFloat(product.price),
        productImage: product.product_image ? product.product_image.replace(/"/g, '') : undefined,
        quantity,
        subtotal: parseFloat(product.price) * quantity,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      };
    }
  }

  async updateCartItem(userId: string, productId: string, quantity: number): Promise<CartItem> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Check inventory
    const inventoryResult = await this.db.query(
      `
      SELECT i.quantity as inventory, p.name, p.price, 
             (p.images->0)::text as product_image
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.product_id = $1 AND p.active = true
    `,
      [productId]
    );

    if (inventoryResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    const inventory = inventoryResult.rows[0];

    if (inventory.inventory < quantity) {
      throw new Error('Insufficient inventory');
    }

    // Update cart item
    const result = await this.db.query(
      `
      UPDATE cart_items
      SET quantity = $1, updated_at = NOW()
      WHERE user_id = $2 AND product_id = $3
      RETURNING id, created_at, updated_at
    `,
      [quantity, userId, productId]
    );

    if (result.rows.length === 0) {
      throw new Error('Cart item not found');
    }

    return {
      id: result.rows[0].id,
      userId,
      productId,
      productName: inventory.name,
      productPrice: parseFloat(inventory.price),
      productImage: inventory.product_image ? inventory.product_image.replace(/"/g, '') : undefined,
      quantity,
      subtotal: parseFloat(inventory.price) * quantity,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
    };
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    const result = await this.db.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1 AND product_id = $2
    `,
      [userId, productId]
    );

    if (result.rowCount === 0) {
      throw new Error('Cart item not found');
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.db.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1
    `,
      [userId]
    );
  }

  async getCartTotal(userId: string): Promise<{ totalItems: number; totalAmount: number }> {
    const result = await this.db.query(
      `
      SELECT 
        SUM(ci.quantity) as total_items,
        SUM(ci.quantity * p.price) as total_amount
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1 AND p.active = true
    `,
      [userId]
    );

    return {
      totalItems: parseInt(result.rows[0].total_items) || 0,
      totalAmount: parseFloat(result.rows[0].total_amount) || 0,
    };
  }

  async validateCartInventory(userId: string): Promise<{ valid: boolean; issues: string[] }> {
    const cart = await this.getCart(userId);
    const issues: string[] = [];

    for (const item of cart.items) {
      const inventoryResult = await this.db.query(
        `
        SELECT quantity as inventory
        FROM inventory
        WHERE product_id = $1
      `,
        [item.productId]
      );

      if (inventoryResult.rows.length === 0) {
        issues.push(`Product ${item.productName} is no longer available`);
        continue;
      }

      const availableInventory = inventoryResult.rows[0].inventory;

      if (availableInventory < item.quantity) {
        issues.push(
          `Only ${availableInventory} units of ${item.productName} available (you have ${item.quantity} in cart)`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
