import { createApp, validate, z } from '@morojs/moro';
import { ProductService } from './services/ProductService';
import { CartService } from './services/CartService';
import { OrderService } from './services/OrderService';
import { AuthService } from './services/AuthService';
import { PaymentService } from './services/PaymentService';

import dotenv from 'dotenv';
dotenv.config();

const app = createApp({
  cors: true,
  compression: true,
  helmet: true,
});

const productService = new ProductService();
const cartService = new CartService();
const orderService = new OrderService();
const authService = new AuthService();
const paymentService = new PaymentService();

// Add authentication middleware globally if needed
app.use(async (req: any, res: any, next: () => void) => {
  // Add context object to request
  req.context = {};
  next();
});

// Auth endpoints
app.post(
  '/auth/register',
  validate(
    {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }),
    },
    async (req, res) => {
      const user = await authService.register(req.body);
      return { user, token: authService.generateToken(user.id) };
    }
  )
);

app.post(
  '/auth/login',
  validate(
    {
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
    },
    async (req, res) => {
      const user = await authService.login(req.body.email, req.body.password);
      return { user, token: authService.generateToken(user.id) };
    }
  )
);

// Product endpoints - using chainable API for better type handling
app
  .get('/products')
  .query(
    z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      minPrice: z.coerce.number().optional(),
      maxPrice: z.coerce.number().optional(),
      inStock: z.boolean().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().max(50).default(20),
      sortBy: z.enum(['price', 'name', 'created_at']).default('created_at'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
  )
  .handler(async (req: any, res: any) => {
    const products = await productService.getProducts(req.query);
    return products;
  });

app.get(
  '/products/:id',
  validate(
    {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    async (req, res) => {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        res.status(404);
        return { success: false, error: 'Product not found' };
      }
      return product;
    }
  )
);

app.get('/categories', (req, res) => {
  return productService.getCategories();
});

// Cart endpoints (require authentication) - Apply auth middleware manually
app.get('/cart', async (req: any, res: any) => {
  try {
    await authService.authenticate(req, () => {});
    const cart = await cartService.getCart(req.user.id);
    return cart;
  } catch (error) {
    res.status(401);
    return { success: false, error: 'Unauthorized' };
  }
});

app.post(
  '/cart/items',
  validate(
    {
      body: z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive().max(10),
      }),
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        const cartItem = await cartService.addToCart(
          req.user.id,
          req.body.productId,
          req.body.quantity
        );
        return cartItem;
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

app.put(
  '/cart/items/:productId',
  validate(
    {
      params: z.object({
        productId: z.string().uuid(),
      }),
      body: z.object({
        quantity: z.number().positive().max(10),
      }),
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        const cartItem = await cartService.updateCartItem(
          req.user.id,
          req.params.productId,
          req.body.quantity
        );
        return cartItem;
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

app.delete(
  '/cart/items/:productId',
  validate(
    {
      params: z.object({
        productId: z.string().uuid(),
      }),
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        await cartService.removeFromCart(req.user.id, req.params.productId);
        return { success: true };
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

app.delete('/cart', async (req: any, res: any) => {
  try {
    await authService.authenticate(req, () => {});
    await cartService.clearCart(req.user.id);
    return { success: true };
  } catch (error) {
    res.status(401);
    return { success: false, error: 'Unauthorized' };
  }
});

// Checkout and orders
app.post(
  '/checkout',
  validate(
    {
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
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        const order = await orderService.createOrder(req.user.id, req.body);
        return order;
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

app
  .get('/orders')
  .query(
    z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().max(50).default(10),
      status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
    })
  )
  .handler(async (req: any, res: any) => {
    try {
      await authService.authenticate(req, () => {});
      const orders = await orderService.getUserOrders(req.user.id, req.query);
      return orders;
    } catch (error) {
      res.status(401);
      return { success: false, error: 'Unauthorized' };
    }
  });

app.get(
  '/orders/:id',
  validate(
    {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        const order = await orderService.getOrder(req.params.id, req.user.id);
        return order;
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

// Payment webhook (Stripe)
app.post(
  '/webhooks/stripe',
  validate(
    {
      body: z.any(), // Raw body needed for Stripe signature verification
    },
    async (req, res) => {
      await paymentService.handleWebhook(req.body, req.headers['stripe-signature']);
      return { received: true };
    }
  )
);

// Admin endpoints (simplified for demo)
app.post(
  '/admin/products',
  validate(
    {
      body: z.object({
        name: z.string().min(1),
        description: z.string(),
        price: z.number().positive(),
        categoryId: z.string().uuid(),
        inventory: z.number().nonnegative(),
        images: z.array(z.string()).optional(),
      }),
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        await authService.requireAdmin(req, () => {});
        const product = await productService.createProduct(req.body, req.user.id);
        return product;
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

app.put(
  '/admin/products/:id',
  validate(
    {
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
    },
    async (req: any, res: any) => {
      try {
        await authService.authenticate(req, () => {});
        await authService.requireAdmin(req, () => {});
        const product = await productService.updateProduct(req.params.id, req.body);
        return product;
      } catch (error) {
        res.status(401);
        return { success: false, error: 'Unauthorized' };
      }
    }
  )
);

// Health check
app.get('/health', (req, res) => ({
  status: 'healthy',
  timestamp: new Date().toISOString(),
  services: {
    database: 'connected',
    redis: 'connected',
    stripe: 'configured',
  },
}));

const PORT = parseInt(process.env.PORT || '3000');

app.listen(PORT, () => {
  console.log(`🛒 E-commerce API running on port ${PORT}`);
  console.log(`API endpoint: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
