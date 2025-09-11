# Enterprise Authentication Example

An advanced MoroJS demonstration showcasing enterprise-grade authentication with Role-Based Access Control (RBAC), multiple OAuth providers, audit logging, and comprehensive security features.

## Features

- 🏢 **Enterprise SSO**: Support for Okta, Azure AD, and other enterprise providers
- 👥 **Role-Based Access Control**: Admin, Manager, and User roles with hierarchical permissions
- 🔐 **Multi-Provider OAuth**: GitHub, Google, Microsoft, LinkedIn, and enterprise SSO
- 📋 **Permission System**: Granular permission-based authorization
- 📊 **Audit Logging**: Comprehensive security event tracking
- 🔄 **Advanced Sessions**: Enhanced session management with security features
- 🔗 **Webhook Security**: API key-based webhook authentication
- 🛡️ **Custom Authorization**: Flexible authorization logic for complex scenarios

## Usage

### For Moro Framework Development

When working in the MoroJS monorepo:

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

Test different access levels with demo tokens:

```bash
# Start the server
npm run dev

# Test as regular user
curl -H "Authorization: Bearer user-token" http://localhost:3001/dashboard

# Test as manager
curl -H "Authorization: Bearer manager-token" http://localhost:3001/manager

# Test as admin
curl -H "Authorization: Bearer admin-token" http://localhost:3001/admin
```

## Demo Tokens

| Token           | Role          | Permissions     | Description              |
| --------------- | ------------- | --------------- | ------------------------ |
| `admin-token`   | Admin, User   | All permissions | Full system access       |
| `manager-token` | Manager, User | Team management | Team and user management |
| `user-token`    | User          | Profile only    | Basic user access        |

## API Endpoints

### Public Endpoints

| Method | Endpoint       | Description                       |
| ------ | -------------- | --------------------------------- |
| `GET`  | `/`            | Home page with feature overview   |
| `GET`  | `/auth/status` | Authentication status             |
| `GET`  | `/health`      | Health check with security status |

### Protected Endpoints

| Method | Endpoint                 | Required Role/Permission | Description                 |
| ------ | ------------------------ | ------------------------ | --------------------------- |
| `GET`  | `/dashboard`             | Any authenticated user   | User dashboard              |
| `GET`  | `/manager`               | Manager or Admin         | Team management dashboard   |
| `GET`  | `/admin`                 | Admin only               | System administration panel |
| `GET`  | `/organization/:id/data` | Organization member      | Organization-specific data  |
| `GET`  | `/api/users`             | `users:read` permission  | User list API               |
| `GET`  | `/profile/settings`      | User role                | Profile settings            |
| `POST` | `/auth/refresh-session`  | Any authenticated user   | Session refresh             |
| `POST` | `/auth/logout`           | Any authenticated user   | Enhanced logout             |
| `GET`  | `/admin/security/audit`  | Admin only               | Security audit logs         |

### Webhook Endpoints

| Method | Endpoint               | Authentication | Description                   |
| ------ | ---------------------- | -------------- | ----------------------------- |
| `POST` | `/webhooks/auth-event` | API Key        | Authentication event webhooks |

## Role-Based Access Control

### Roles Hierarchy

```
Admin
├── Full system access
├── All permissions
└── Can manage all users and data

Manager
├── Team management access
├── User read/write permissions
└── Can manage team members

User
├── Basic profile access
└── Can read/write own profile
```

### Permissions System

```javascript
// Permission examples
{
  admin: ['users:read', 'users:write', 'users:delete', 'system:admin'],
  manager: ['users:read', 'users:write', 'team:manage'],
  user: ['profile:read', 'profile:write']
}
```

## Testing Examples

### Authentication Tests

```bash
# Test public access
curl http://localhost:3001/

# Test user dashboard
curl -H "Authorization: Bearer user-token" http://localhost:3001/dashboard

# Test manager dashboard
curl -H "Authorization: Bearer manager-token" http://localhost:3001/manager

# Test admin panel
curl -H "Authorization: Bearer admin-token" http://localhost:3001/admin
```

### Permission-Based Tests

```bash
# Access users API (requires users:read permission)
curl -H "Authorization: Bearer admin-token" http://localhost:3001/api/users

# Try with insufficient permissions (should fail)
curl -H "Authorization: Bearer user-token" http://localhost:3001/api/users
```

### Security Audit Tests

```bash
# View security audit logs (admin only)
curl -H "Authorization: Bearer admin-token" http://localhost:3001/admin/security/audit

# Filter audit logs by date
curl -H "Authorization: Bearer admin-token" \
  "http://localhost:3001/admin/security/audit?startDate=2024-01-01&limit=50"
```

### Webhook Tests

```bash
# Send webhook with API key
curl -X POST http://localhost:3001/webhooks/auth-event \
  -H "X-API-Key: demo-webhook-key" \
  -H "Content-Type: application/json" \
  -d '{"event": "user_login", "userId": "123"}'

# Try without API key (should fail)
curl -X POST http://localhost:3001/webhooks/auth-event \
  -H "Content-Type: application/json" \
  -d '{"event": "test"}'
```

## Example Responses

### User Dashboard

```json
{
  "message": "Welcome to your enterprise dashboard, Regular User!",
  "user": {
    "id": "user-1",
    "name": "Regular User",
    "email": "user@company.com",
    "roles": ["user"],
    "permissions": ["profile:read", "profile:write"],
    "organization": "org_main"
  },
  "sessionInfo": {
    "lastActivity": "2024-01-15T10:30:00.000Z",
    "sessionId": "session_abc123",
    "provider": "enterprise-sso"
  }
}
```

### Manager Dashboard

```json
{
  "message": "Manager Dashboard - Team Overview",
  "user": {
    /* manager user info */
  },
  "teamMetrics": {
    "totalTeamMembers": 25,
    "activeProjects": 8,
    "completedTasks": 142,
    "teamPerformance": "94.2%",
    "budgetUtilization": "87%"
  },
  "recentActivity": [
    "Project Alpha milestone completed",
    "New team member onboarded",
    "Q3 performance reviews started"
  ]
}
```

### Security Audit Response

```json
{
  "auditLogs": [
    {
      "id": 1,
      "event": "signin_success",
      "userId": "admin-1",
      "timestamp": "2024-01-15T09:30:00.000Z",
      "metadata": { "provider": "azure-ad" }
    }
  ],
  "summary": {
    "totalEvents": 4,
    "signInAttempts": 2,
    "failedAttempts": 1,
    "activeUsers": 892,
    "securityScore": 96
  }
}
```

## Environment Variables

### OAuth Providers

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft/Azure AD
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_TENANT_ID=your_tenant_id

# Okta SSO
OKTA_CLIENT_ID=your_okta_client_id
OKTA_CLIENT_SECRET=your_okta_client_secret
OKTA_DOMAIN=your_company.okta.com

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### Security Configuration

```bash
# JWT Secret (required)
AUTH_SECRET=your_very_secure_jwt_secret

# Webhook API Key
WEBHOOK_API_KEY=your_webhook_api_key

# Environment
NODE_ENV=development
```

## Enterprise Provider Setup

### Azure AD / Microsoft 365

1. Go to Azure Portal → App registrations
2. Create new registration
3. Set redirect URI: `http://localhost:3001/api/auth/callback/azure-ad`
4. Note Application (client) ID and create client secret
5. Configure API permissions for Microsoft Graph

### Okta SSO

1. Go to Okta Admin Console → Applications
2. Create new OIDC application
3. Set redirect URI: `http://localhost:3001/api/auth/callback/okta`
4. Note Client ID and create Client Secret
5. Configure user access and groups

## Security Features

### Audit Logging

All security events are automatically logged:

- Sign-in attempts (successful and failed)
- Sign-out events
- Permission denials
- Webhook calls
- Session management events

### Session Security

- JWT-based sessions with secure cookies
- Configurable session timeouts (8 hours default)
- Session refresh capabilities
- Automatic session cleanup

### Authorization Patterns

```javascript
// Role-based authorization
app.get('/admin', requireAdmin(), handler);

// Permission-based authorization
app.get(
  '/api/users',
  requireAuth({
    permissions: ['users:read'],
  }),
  handler
);

// Custom authorization logic
app.get(
  '/data',
  requireAuth({
    authorize: user => user.organizationId === 'allowed_org',
  }),
  handler
);
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run dev:watch` - Start with auto-restart
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run switch:local` - Use local MoroJS source
- `npm run switch:npm` - Use published package

## Security Best Practices

### Production Checklist

- [ ] Use HTTPS in production
- [ ] Set strong `AUTH_SECRET` (32+ characters)
- [ ] Configure OAuth providers with production URLs
- [ ] Enable secure cookies (`useSecureCookies: true`)
- [ ] Set up proper CORS policies
- [ ] Monitor audit logs regularly
- [ ] Implement rate limiting
- [ ] Use environment-specific configurations

### Monitoring

The example includes comprehensive logging for:

- Authentication events
- Authorization failures
- Session management
- Security violations
- System health

## Architecture Patterns

### Middleware Composition

```javascript
// Multiple middleware layers
app.get(
  '/protected',
  requireAuth(), // Authentication
  requireRole(['admin']), // Role check
  auditMiddleware(), // Audit logging
  handler // Business logic
);
```

### Custom Authorization

```javascript
// Complex authorization logic
const organizationAuth = requireAuth({
  authorize: async (user, req) => {
    const orgId = req.params.orgId;
    return await userCanAccessOrganization(user.id, orgId);
  },
  onForbidden: (req, res) => {
    auditUnauthorizedAccess(req);
    return res.status(403).json({ error: 'Access denied' });
  },
});
```

## Troubleshooting

### Common Issues

**403 Forbidden errors:**

- Check user roles and permissions
- Verify token is for correct user type
- Review authorization logic

**Audit logs not appearing:**

- Check console output for logged events
- Verify security event functions are called
- Review middleware order

**OAuth setup issues:**

- Verify callback URLs match exactly
- Check client IDs and secrets
- Ensure proper scopes are configured

### Debug Mode

Set `NODE_ENV=development` to enable:

- Detailed authentication logs
- Enhanced error messages
- Security event debugging

## Next Steps

- Explore [Simple Auth Example](../simple-auth-example) for basic patterns
- Check out [Feature Showcase](../feature-showcase) for more MoroJS features
- Try [Microservices](../microservice) for distributed enterprise auth
- Review [Real-time Chat](../real-time-chat) for authenticated WebSocket connections

## Contributing

This example demonstrates enterprise authentication patterns for MoroJS. Contributions welcome for:

- Additional OAuth providers
- Enhanced security features
- Better audit logging
- Performance optimizations
- Documentation improvements
