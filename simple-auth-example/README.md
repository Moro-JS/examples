# Simple Authentication Example

A straightforward MoroJS demonstration showing basic Auth.js integration with OAuth providers, session management, and protected routes.

## Features

- 🔐 **OAuth Integration**: GitHub and Google authentication
- 🛡️ **Session Management**: Secure JWT-based sessions
- 🔒 **Protected Routes**: Authentication-required endpoints
- 🔄 **Programmatic Auth**: Sign in/out via API
- 🧪 **Demo Mode**: Test without real OAuth setup
- ❤️ **Health Checks**: Monitor authentication status

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
npm run switch:npm  # Switch to published package
npm run dev         # Start development server
```

## Quick Demo

No OAuth setup required! Use demo tokens to test authentication:

```bash
# Start the server
npm run dev

# Test public endpoint
curl http://localhost:3000/

# Test protected endpoint (unauthenticated)
curl http://localhost:3000/dashboard

# Test protected endpoint (authenticated)
curl -H "Authorization: Bearer demo-token" http://localhost:3000/dashboard
```

## API Endpoints

| Method | Endpoint       | Description                | Auth Required |
| ------ | -------------- | -------------------------- | ------------- |
| `GET`  | `/`            | Home page with auth status | No            |
| `GET`  | `/auth/status` | Authentication status      | No            |
| `GET`  | `/dashboard`   | User dashboard             | Yes           |
| `GET`  | `/api/me`      | Current user information   | Yes           |
| `POST` | `/api/signin`  | Programmatic sign in       | No            |
| `POST` | `/api/signout` | Programmatic sign out      | Yes           |
| `GET`  | `/health`      | Health check               | No            |

## Demo Mode

For testing without real OAuth providers, use the demo token:

```bash
# Add this header to simulate authentication
Authorization: Bearer demo-token
```

This will authenticate you as:

- **Name**: Demo User
- **Email**: demo@example.com
- **Provider**: GitHub

## Real OAuth Setup

To use real OAuth providers, set these environment variables:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Secret
AUTH_SECRET=your_jwt_secret_key
```

### Getting OAuth Credentials

**GitHub:**

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set callback URL to `http://localhost:3000/api/auth/callback/github`

**Google:**

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID
3. Set authorized redirect URI to `http://localhost:3000/api/auth/callback/google`

## Testing Examples

```bash
# Check authentication status
curl http://localhost:3000/auth/status

# Access dashboard with demo token
curl -H "Authorization: Bearer demo-token" http://localhost:3000/dashboard

# Get user information
curl -H "Authorization: Bearer demo-token" http://localhost:3000/api/me

# Programmatic sign in
curl -X POST http://localhost:3000/api/signin \
  -H "Content-Type: application/json" \
  -d '{"provider": "github", "callbackUrl": "/dashboard"}'

# Programmatic sign out
curl -X POST http://localhost:3000/api/signout \
  -H "Authorization: Bearer demo-token" \
  -H "Content-Type: application/json" \
  -d '{"callbackUrl": "/"}'

# Health check
curl http://localhost:3000/health
```

## Example Responses

### Home Page

```json
{
  "message": "Welcome to Simple Auth Example! 🚀",
  "auth": {
    "isAuthenticated": false,
    "user": null
  },
  "features": [
    "✅ GitHub OAuth integration",
    "✅ Google OAuth integration",
    "✅ Session management",
    "✅ Custom authentication callbacks",
    "✅ Protected routes"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Dashboard (Authenticated)

```json
{
  "message": "Welcome to your dashboard, Demo User!",
  "user": {
    "id": "demo-user",
    "name": "Demo User",
    "email": "demo@example.com",
    "image": "https://avatars.githubusercontent.com/u/1?v=4"
  },
  "sessionInfo": {
    "expires": "2024-01-16T02:30:00.000Z",
    "loginTime": "2024-01-15T18:30:00.000Z",
    "provider": "github"
  }
}
```

## Key Concepts Demonstrated

- **OAuth Flow**: Complete OAuth 2.0 integration with multiple providers
- **Session Management**: JWT-based sessions with custom data
- **Route Protection**: Middleware-based authentication checks
- **Custom Callbacks**: Business logic for sign-in validation
- **Error Handling**: Proper HTTP status codes and error messages
- **Demo Mode**: Testing without external dependencies

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart on file changes
- `npm run build` - Build for production
- `npm run start` - Run built version
- `npm run switch:local` - Use local MoroJS source
- `npm run switch:npm` - Use published MoroJS package

## Security Notes

- Demo tokens are for testing only - never use in production
- Always use HTTPS in production
- Store OAuth secrets securely
- Use strong JWT secrets
- Implement proper session expiration
- Monitor authentication events

## Next Steps

- Explore [Enterprise Auth Example](../enterprise-auth-example) for RBAC and advanced features
- Check out [Feature Showcase](../feature-showcase) for more MoroJS patterns
- Try [Microservices](../microservice) for distributed authentication

## Troubleshooting

**Authentication not working?**

- Check that demo token is properly formatted: `Bearer demo-token`
- Verify Auth.js middleware is properly configured
- Ensure OAuth credentials are correct (if using real providers)

**Routes returning 401?**

- Make sure to include Authorization header
- Check that the token hasn't expired
- Verify the endpoint requires authentication

**OAuth setup issues?**

- Double-check callback URLs match exactly
- Ensure OAuth apps are enabled
- Verify client ID and secret are correct
