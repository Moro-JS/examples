# E-commerce API Example

A complete e-commerce backend API built with MoroJS, featuring product catalog, shopping cart, payment processing with Stripe, and order management.

## Features

- 🛍**Product Catalog** - Browse products with search, filtering, and categories
- 🛒 **Shopping Cart** - Add, update, remove items with session persistence
- 💳 **Payment Processing** - Secure payments via Stripe integration
- **Order Management** - Complete order lifecycle with tracking
- 👤 **User Authentication** - JWT-based auth with registration and login
- 🏪 **Inventory Management** - Stock tracking and availability
- 🎫 **Coupon System** - Discount codes and promotions
- **Admin Dashboard** - Product and order management endpoints
- **API-First** - RESTful API ready for any frontend

## Tech Stack

- **Backend**: MoroJS (Node.js framework)
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis for session and cart management
- **Payments**: Stripe for secure transaction processing
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schema validation
- **File Uploads**: Multer for product images

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Stripe Account (for payments)

### Installation

1. **Clone and install:**
   ```bash
   git clone https://github.com/MoroJS/examples.git
   cd examples/ecommerce-api
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup:**
   ```bash
   createdb ecommerce_db
   psql -d ecommerce_db -f database/schema.sql
   npm run db:seed  # Load sample products
   ```

4. **Start development:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Products
- `GET /products` - Get products (with filtering)
- `GET /products/:id` - Get single product
- `GET /categories` - Get all categories

### Shopping Cart
- `GET /cart` - Get user's cart
- `POST /cart/items` - Add item to cart
- `PUT /cart/items/:productId` - Update item quantity
- `DELETE /cart/items/:productId` - Remove item
- `DELETE /cart` - Clear cart

### Orders
- `POST /checkout` - Create order and process payment
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get specific order

### Webhooks
- `POST /webhooks/stripe` - Stripe payment webhooks

## Example Usage

### Register and Login
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "securepass123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "securepass123"
  }'
```

### Browse Products
```bash
# Get all products
curl http://localhost:3000/products

# Search products
curl "http://localhost:3000/products?search=laptop&category=electronics&minPrice=500"

# Get categories
curl http://localhost:3000/categories
```

### Shopping Cart
```bash
# Add to cart (requires auth token)
curl -X POST http://localhost:3000/cart/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "uuid-here", "quantity": 2}'

# View cart
curl http://localhost:3000/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Checkout
```bash
curl -X POST http://localhost:3000/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    },
    "paymentMethodId": "pm_card_visa"
  }'
```

## Database Schema

Key tables:
- **users** - Customer accounts
- **categories** - Product categories
- **products** - Product catalog
- **inventory** - Stock management
- **cart_items** - Shopping cart contents
- **orders** - Order records
- **order_items** - Order line items
- **coupons** - Discount codes

## Payment Processing

This example integrates with Stripe for secure payment processing:

1. **Setup Stripe:**
   - Create Stripe account
   - Get API keys (publishable and secret)
   - Configure webhook endpoints

2. **Payment Flow:**
   - Frontend collects payment method
   - Backend creates PaymentIntent
   - Stripe processes payment
   - Webhook confirms payment
   - Order status updated

3. **Security:**
   - Never store card details
   - Use Stripe's secure tokenization
   - Validate webhooks with signatures

## Development

### Available Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed sample data

### Project Structure
```
src/
├── services/
│   ├── AuthService.ts      # Authentication
│   ├── ProductService.ts   # Product management
│   ├── CartService.ts      # Shopping cart
│   ├── OrderService.ts     # Order processing
│   └── PaymentService.ts   # Stripe integration
├── server.ts               # Main application
database/
├── schema.sql              # Database schema
├── seeds/                  # Sample data
└── migrations/             # Schema changes
```

## Frontend Integration

This API works with any frontend framework. Example with JavaScript:

```javascript
// Product search
async function searchProducts(query) {
  const response = await fetch(`/products?search=${query}`);
  return response.json();
}

// Add to cart
async function addToCart(productId, quantity) {
  const response = await fetch('/cart/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, quantity })
  });
  return response.json();
}

// Checkout with Stripe
async function checkout(shippingAddress, paymentMethodId) {
  const response = await fetch('/checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ shippingAddress, paymentMethodId })
  });
  return response.json();
}
```

## Production Deployment

### Environment Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_SECRET=your-super-secret-key
```

### Security Checklist
- [ ] Use HTTPS/TLS in production
- [ ] Validate all user inputs
- [ ] Rate limit API endpoints
- [ ] Secure JWT secrets
- [ ] Enable CORS properly
- [ ] Use environment variables for secrets
- [ ] Set up proper logging
- [ ] Configure monitoring

## Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details. 