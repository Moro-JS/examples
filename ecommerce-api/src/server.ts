import { createApp } from '@morojs/moro';
import { ProductService } from './services/ProductService';
import { CartService } from './services/CartService';
import { OrderService } from './services/OrderService';
import { AuthService } from './services/AuthService';
import { PaymentService } from './services/PaymentService';
import { z } from 'zod';

const app = createApp({
  database: {
    default: {
      type: 'postgresql',
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/ecommerce_db',
    },
    cache: {
      type: 'redis',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
  },

  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  features: {
    fileUploads: {
      enabled: true,
      maxSize: '5MB',
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  },
});

const productService = new ProductService();
const cartService = new CartService();
const orderService = new OrderService();
const authService = new AuthService();
const paymentService = new PaymentService();

// Auth endpoints
app.post('/auth/register', {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  }),
  handler: async ({ body }) => {
    const user = await authService.register(body);
    return { user, token: authService.generateToken(user.id) };
  },
});

app.post('/auth/login', {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
  handler: async ({ body }) => {
    const user = await authService.login(body.email, body.password);
    return { user, token: authService.generateToken(user.id) };
  },
});

// Product endpoints
app.get('/products', {
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    inStock: z.boolean().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(50).default(20),
    sortBy: z.enum(['price', 'name', 'created_at']).default('created_at'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
  handler: async ({ query }) => {
    const products = await productService.getProducts(query);
    return products;
  },
});

app.get('/products/:id', {
  params: z.object({
    id: z.string().uuid(),
  }),
  handler: async ({ params }) => {
    const product = await productService.getProductById(params.id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  },
});

app.get('/categories', {
  handler: async () => {
    const categories = await productService.getCategories();
    return categories;
  },
});

// Cart endpoints (require authentication)
app.get('/cart', {
  middleware: [authService.authenticate],
  handler: async ({ context }) => {
    const cart = await cartService.getCart(context.user.id);
    return cart;
  },
});

app.post('/cart/items', {
  middleware: [authService.authenticate],
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive().max(10),
  }),
  handler: async ({ body, context }) => {
    const cartItem = await cartService.addToCart(context.user.id, body.productId, body.quantity);
    return cartItem;
  },
});

app.put('/cart/items/:productId', {
  middleware: [authService.authenticate],
  params: z.object({
    productId: z.string().uuid(),
  }),
  body: z.object({
    quantity: z.number().positive().max(10),
  }),
  handler: async ({ params, body, context }) => {
    const cartItem = await cartService.updateCartItem(
      context.user.id,
      params.productId,
      body.quantity
    );
    return cartItem;
  },
});

app.delete('/cart/items/:productId', {
  middleware: [authService.authenticate],
  params: z.object({
    productId: z.string().uuid(),
  }),
  handler: async ({ params, context }) => {
    await cartService.removeFromCart(context.user.id, params.productId);
    return { success: true };
  },
});

app.delete('/cart', {
  middleware: [authService.authenticate],
  handler: async ({ context }) => {
    await cartService.clearCart(context.user.id);
    return { success: true };
  },
});

// Checkout and orders
app.post('/checkout', {
  middleware: [authService.authenticate],
  body: z.object({
    shippingAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string().default('US'),
    }),
    paymentMethodId: z.string(), // Stripe Payment Method ID
    couponCode: z.string().optional(),
  }),
  handler: async ({ body, context }) => {
    const order = await orderService.createOrder(context.user.id, body);
    return order;
  },
});

app.get('/orders', {
  middleware: [authService.authenticate],
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().max(50).default(10),
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  }),
  handler: async ({ query, context }) => {
    const orders = await orderService.getUserOrders(context.user.id, query);
    return orders;
  },
});

app.get('/orders/:id', {
  middleware: [authService.authenticate],
  params: z.object({
    id: z.string().uuid(),
  }),
  handler: async ({ params, context }) => {
    const order = await orderService.getOrder(params.id, context.user.id);
    return order;
  },
});

// Payment webhook (Stripe)
app.post('/webhooks/stripe', {
  body: z.any(), // Raw body needed for Stripe signature verification
  handler: async ({ body, headers }) => {
    await paymentService.handleWebhook(body, headers['stripe-signature']);
    return { received: true };
  },
});

// Admin endpoints (simplified for demo)
app.post('/admin/products', {
  middleware: [authService.authenticate, authService.requireAdmin],
  body: z.object({
    name: z.string().min(1),
    description: z.string(),
    price: z.number().positive(),
    categoryId: z.string().uuid(),
    inventory: z.number().nonnegative(),
    images: z.array(z.string()).optional(),
  }),
  handler: async ({ body, context }) => {
    const product = await productService.createProduct(body, context.user.id);
    return product;
  },
});

app.put('/admin/products/:id', {
  middleware: [authService.authenticate, authService.requireAdmin],
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    inventory: z.number().nonnegative().optional(),
    active: z.boolean().optional(),
  }),
  handler: async ({ params, body }) => {
    const product = await productService.updateProduct(params.id, body);
    return product;
  },
});

// Health check
app.get('/health', {
  handler: () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      stripe: 'configured',
    },
  }),
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🛒 E-commerce API running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
