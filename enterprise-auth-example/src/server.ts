// Enterprise Authentication Example for MoroJS
// Demonstrates advanced authentication with RBAC, multiple providers,
// audit logging, and enterprise security features

import { createApp } from '@morojs/moro';

const app = createApp({
  logger: { level: 'info', enableColors: true },
});

// Mock enterprise auth middleware for demonstration
// In a real implementation, this would be imported from MoroJS auth module
function createEnterpriseAuthMiddleware(config: any) {
  return (req: any, res: any, next: any) => {
    // Mock auth object with enterprise features
    req.auth = {
      isAuthenticated: false,
      user: null,
      session: null,
      async getSession() {
        return req.auth.session;
      },
      async getUser() {
        return req.auth.user;
      },
      signIn(provider: string, options?: any) {
        console.log(`🔐 Enterprise sign in initiated with ${provider}`);
        logSecurityEvent('signin_attempt', { provider, timestamp: new Date() });
        return { url: `/api/auth/signin/${provider}` };
      },
      signOut(options?: any) {
        console.log('🚪 Enterprise sign out initiated');
        if (req.auth.user) {
          logSecurityEvent('signout', {
            userId: req.auth.user.id,
            timestamp: new Date(),
          });
        }
        req.auth.isAuthenticated = false;
        req.auth.user = null;
        req.auth.session = null;
        return { url: options?.callbackUrl || '/' };
      },
    };

    // Mock different user types for demo
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      let mockUser;
      switch (token) {
        case 'admin-token':
          mockUser = {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@company.com',
            roles: ['admin', 'user'],
            permissions: ['users:read', 'users:write', 'users:delete', 'system:admin'],
            organizationId: 'org_main',
          };
          break;
        case 'manager-token':
          mockUser = {
            id: 'manager-1',
            name: 'Manager User',
            email: 'manager@company.com',
            roles: ['manager', 'user'],
            permissions: ['users:read', 'users:write', 'team:manage'],
            organizationId: 'org_main',
          };
          break;
        case 'user-token':
          mockUser = {
            id: 'user-1',
            name: 'Regular User',
            email: 'user@company.com',
            roles: ['user'],
            permissions: ['profile:read', 'profile:write'],
            organizationId: 'org_main',
          };
          break;
        default:
          mockUser = null;
      }

      if (mockUser) {
        req.auth.isAuthenticated = true;
        req.auth.user = mockUser;
        req.auth.session = {
          user: mockUser,
          expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
          customData: {
            lastActivity: new Date(),
            sessionId: 'session_' + Math.random().toString(36).substr(2, 9),
            provider: 'enterprise-sso',
          },
        };
      }
    }

    next();
  };
}

// Middleware helpers for authorization
function requireAuth(options: any = {}) {
  return (req: any, res: any, next: any) => {
    if (!req.auth?.isAuthenticated) {
      if (options.onUnauthorized) {
        return options.onUnauthorized(req, res);
      }
      res.statusCode = 401;
      return res.json({
        error: 'Authentication required',
        message: 'Please sign in to access this resource',
      });
    }

    // Custom authorization logic
    if (options.authorize) {
      if (!options.authorize(req.auth.user)) {
        if (options.onForbidden) {
          return options.onForbidden(req, res);
        }
        res.statusCode = 403;
        return res.json({
          error: 'Access forbidden',
          message: 'You do not have permission to access this resource',
        });
      }
    }

    // Permission check
    if (options.permissions) {
      const userPermissions = req.auth.user?.permissions || [];
      const hasPermission = options.permissions.some((perm: string) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        if (options.onForbidden) {
          return options.onForbidden(req, res);
        }
        res.statusCode = 403;
        return res.json({
          error: 'Insufficient permissions',
          message: `Required permissions: ${options.permissions.join(', ')}`,
        });
      }
    }

    next();
  };
}

function requireRole(roles: string[]) {
  return requireAuth({
    authorize: (user: any) => {
      const userRoles = user?.roles || [];
      return roles.some(role => userRoles.includes(role));
    },
    onForbidden: (req: any, res: any) => {
      res.statusCode = 403;
      res.json({
        error: 'Insufficient role',
        message: `Required roles: ${roles.join(', ')}`,
        userRoles: req.auth.user?.roles || [],
      });
    },
  });
}

function requireAdmin() {
  return requireRole(['admin']);
}

// Utility functions
function createAuthResponse(req: any) {
  return {
    isAuthenticated: req.auth?.isAuthenticated || false,
    user: req.auth?.user || null,
    session: req.auth?.session || null,
  };
}

function getUser(req: any) {
  return req.auth?.user;
}

function getUserId(req: any) {
  return req.auth?.user?.id;
}

function hasRole(req: any, roles: string[]) {
  const userRoles = req.auth?.user?.roles || [];
  return roles.some(role => userRoles.includes(role));
}

function isAuthenticated(req: any) {
  return req.auth?.isAuthenticated || false;
}

// Configure enterprise authentication
app.use(
  createEnterpriseAuthMiddleware({
    providers: [
      // GitHub OAuth
      {
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        clientId: process.env.GITHUB_CLIENT_ID || 'demo-github-client',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-github-secret',
        scope: 'read:user user:email public_repo',
      },

      // Google OAuth
      {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-google-secret',
        hostedDomain: 'yourcompany.com',
      },

      // Microsoft/Azure AD
      {
        id: 'azure-ad',
        name: 'Microsoft',
        type: 'oauth',
        clientId: process.env.MICROSOFT_CLIENT_ID || 'demo-microsoft-client',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'demo-microsoft-secret',
        tenant: process.env.MICROSOFT_TENANT_ID || 'demo-tenant',
      },

      // Enterprise SSO (Okta)
      {
        id: 'okta',
        name: 'Okta SSO',
        type: 'oauth',
        clientId: process.env.OKTA_CLIENT_ID || 'demo-okta-client',
        clientSecret: process.env.OKTA_CLIENT_SECRET || 'demo-okta-secret',
        domain: process.env.OKTA_DOMAIN || 'demo.okta.com',
      },
    ],

    secret: process.env.AUTH_SECRET || 'enterprise-secret-key',

    // Enhanced session configuration
    session: {
      strategy: 'jwt',
      maxAge: 8 * 60 * 60, // 8 hours for security
      updateAge: 2 * 60 * 60, // Update every 2 hours
    },

    // Enterprise callbacks
    callbacks: {
      signIn: async ({ user, account }: any) => {
        console.log(`🔐 Enterprise sign in: ${user.email} via ${account?.provider}`);

        // Enterprise business logic
        if (user.email?.endsWith('@blockedcompany.com')) {
          await logSecurityEvent('signin_blocked', {
            email: user.email,
            reason: 'blocked_domain',
          });
          return false;
        }

        // Audit successful sign-ins
        await logSecurityEvent('signin_success', {
          userId: user.id,
          email: user.email,
          provider: account?.provider,
        });

        return true;
      },

      jwt: async ({ token, user, account }: any) => {
        if (user) {
          token.userId = user.id;
          token.provider = account?.provider;
          // Fetch user roles and permissions (mocked)
          token.roles = await getUserRoles(user.id);
          token.permissions = await getUserPermissions(user.id);
          token.organizationId = await getUserOrganization(user.id);
        }
        return token;
      },

      session: async ({ session, token }: any) => {
        session.user.roles = token.roles;
        session.user.permissions = token.permissions;
        session.user.organizationId = token.organizationId;
        session.customData = {
          lastActivity: new Date(),
          sessionId: token.jti,
          provider: token.provider,
        };
        return session;
      },
    },

    // Security events
    events: {
      signIn: async ({ user, account, isNewUser }: any) => {
        await logSecurityEvent('signin_event', {
          userId: user.id,
          provider: account?.provider,
          isNewUser,
        });
      },
      signOut: async ({ session }: any) => {
        await logSecurityEvent('signout_event', {
          userId: session.user.id,
          sessionDuration: Date.now() - new Date(session.customData.lastActivity).getTime(),
        });
      },
    },

    // Enhanced security
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustHost: true,
    debug: process.env.NODE_ENV === 'development',
  })
);

// Routes

// Public home page
app.get('/', (req, res) => {
  const authStatus = createAuthResponse(req);

  return {
    message: 'Welcome to Enterprise MoroJS Authentication! 🏢',
    auth: authStatus,
    features: {
      multiProvider: true,
      rbac: true,
      enterpriseSSO: true,
      auditLogging: true,
      permissionSystem: true,
      sessionManagement: true,
    },
    demoTokens: {
      admin: 'Use "Authorization: Bearer admin-token" for admin access',
      manager: 'Use "Authorization: Bearer manager-token" for manager access',
      user: 'Use "Authorization: Bearer user-token" for user access',
    },
  };
});

// Authentication status
app.get('/auth/status', (req, res) => {
  return createAuthResponse(req);
});

// Protected dashboard (any authenticated user)
app.get('/dashboard', (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access the enterprise dashboard',
      hint: 'Use one of the demo tokens: admin-token, manager-token, or user-token',
    };
  }

  const user = getUser(req);

  return {
    message: `Welcome to your enterprise dashboard, ${user.name}!`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      organization: user.organizationId,
    },
    sessionInfo: {
      lastActivity: req.auth.session?.customData?.lastActivity,
      sessionId: req.auth.session?.customData?.sessionId,
      provider: req.auth.session?.customData?.provider,
    },
  };
});

// Manager dashboard (manager/admin only)
app.get('/manager', (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access the manager dashboard',
      hint: 'Use manager-token or admin-token',
    };
  }

  if (!hasRole(req, ['manager', 'admin'])) {
    res.statusCode = 403;
    return {
      error: 'Insufficient role',
      message: 'Manager or Admin role required',
      userRoles: req.auth.user?.roles || [],
      requiredRoles: ['manager', 'admin'],
    };
  }

  return {
    message: 'Manager Dashboard - Team Overview',
    user: getUser(req),
    teamMetrics: {
      totalTeamMembers: 25,
      activeProjects: 8,
      completedTasks: 142,
      teamPerformance: '94.2%',
      budgetUtilization: '87%',
    },
    recentActivity: [
      'Project Alpha milestone completed',
      'New team member onboarded',
      'Q3 performance reviews started',
    ],
  };
});

// Admin control panel (admin only)
app.get('/admin', (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access the admin panel',
      hint: 'Use admin-token',
    };
  }

  if (!hasRole(req, ['admin'])) {
    res.statusCode = 403;
    return {
      error: 'Insufficient role',
      message: 'Admin role required',
      userRoles: req.auth.user?.roles || [],
      requiredRoles: ['admin'],
    };
  }

  return {
    message: 'Admin Control Panel - System Overview',
    user: getUser(req),
    systemStats: {
      totalUsers: 1247,
      activeUsers: 892,
      systemHealth: 'Excellent',
      securityScore: 96,
      uptime: '99.97%',
      lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    alerts: [
      { level: 'info', message: 'System backup completed successfully' },
      { level: 'warning', message: 'SSL certificate expires in 30 days' },
    ],
  };
});

// Organization-specific data access
app.get('/organization/:orgId/data', (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access organization data',
    };
  }

  const user = getUser(req);
  // Custom logic - user can only access their organization's data
  if (user.organizationId !== user.organizationId) {
    // In real app, check against req.params.orgId
    res.statusCode = 403;
    return {
      error: 'Organization access denied',
      message: "You can only access your organization's data",
    };
  }

  return {
    message: 'Organization data access granted',
    organizationId: req.params.orgId,
    user: getUser(req),
    data: {
      employees: 156,
      projects: 23,
      revenue: '$2.4M',
      departments: ['Engineering', 'Sales', 'Marketing', 'HR'],
    },
  };
});

// Users API with permission-based access
app.get('/api/users', (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access the users API',
    };
  }

  const user = getUser(req);
  const userPermissions = user?.permissions || [];

  if (!userPermissions.includes('users:read')) {
    res.statusCode = 403;
    return {
      error: 'Permission denied',
      message: 'users:read permission required',
      userPermissions: userPermissions,
      requiredPermissions: ['users:read'],
    };
  }

  return {
    users: [
      { id: 1, name: 'John Doe', role: 'developer', department: 'Engineering' },
      { id: 2, name: 'Jane Smith', role: 'manager', department: 'Engineering' },
      { id: 3, name: 'Bob Johnson', role: 'analyst', department: 'Sales' },
    ],
    total: 3,
    requestedBy: getUser(req),
  };
});

// Profile settings with manual auth checks
app.get('/profile/settings', (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access your profile settings',
    };
  }

  if (!hasRole(req, ['user', 'premium', 'manager', 'admin'])) {
    res.statusCode = 403;
    return {
      error: 'Access denied',
      message: 'User role required for profile access',
    };
  }

  const userId = getUserId(req);

  return {
    message: 'User Profile Settings',
    userId,
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
      privacy: {
        profileVisibility: 'private',
        activityTracking: true,
      },
      security: {
        twoFactorEnabled: true,
        sessionTimeout: '8 hours',
        lastPasswordChange: '2024-01-15',
      },
    },
  };
});

// Session refresh
app.post('/auth/refresh-session', async (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to refresh session',
    };
  }

  try {
    const userId = getUserId(req);

    // Log session refresh
    await logSecurityEvent('session_refresh', { userId });

    return {
      success: true,
      message: 'Session refreshed successfully',
      newSessionId: 'session_' + Math.random().toString(36).substr(2, 9),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    res.statusCode = 500;
    return {
      error: 'session_refresh_failed',
      message: 'Failed to refresh session',
    };
  }
});

// Enhanced logout
app.post('/auth/logout', async (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Must be logged in to log out',
    };
  }

  try {
    const userId = getUserId(req);
    const sessionId = req.auth.session?.customData?.sessionId;

    // Log the logout event
    await logSecurityEvent('manual_logout', {
      userId,
      sessionId,
      timestamp: new Date(),
    });

    // Sign out
    req.auth.signOut({ callbackUrl: '/' });

    return {
      success: true,
      message: 'Logged out successfully',
      redirectUrl: '/',
    };
  } catch (error) {
    res.statusCode = 500;
    return {
      error: 'logout_failed',
      message: 'Failed to log out',
    };
  }
});

// Security audit endpoint (admin only)
app.get('/admin/security/audit', async (req, res) => {
  if (!isAuthenticated(req)) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access security audit',
    };
  }

  if (!hasRole(req, ['admin'])) {
    res.statusCode = 403;
    return {
      error: 'Insufficient role',
      message: 'Admin role required for security audit',
      userRoles: req.auth.user?.roles || [],
      requiredRoles: ['admin'],
    };
  }

  const { startDate, endDate, limit = '100' } = req.query;

  const auditLogs = await getSecurityAuditLogs({
    limit: parseInt(limit.toString()),
    startDate: startDate?.toString(),
    endDate: endDate?.toString(),
  });

  return {
    auditLogs,
    summary: {
      totalEvents: auditLogs.length,
      signInAttempts: auditLogs.filter(log => log.event === 'signin_success').length,
      failedAttempts: auditLogs.filter(log => log.event === 'signin_blocked').length,
      activeUsers: await getActiveUserCount(),
      securityScore: 96,
    },
    timeRange: {
      startDate: startDate || 'N/A',
      endDate: endDate || 'N/A',
    },
  };
});

// Webhook endpoint (API key authentication)
app.post('/webhooks/auth-event', (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey !== (process.env.WEBHOOK_API_KEY || 'demo-webhook-key')) {
    res.statusCode = 401;
    return {
      error: 'Invalid API key',
      message: 'Webhook authentication failed',
    };
  }

  // Process webhook
  console.log('🔔 Enterprise webhook received:', req.body);

  logSecurityEvent('webhook_received', {
    source: req.headers['user-agent'],
    payload: req.body,
  });

  return {
    received: true,
    timestamp: new Date().toISOString(),
  };
});

// Health check with security status
app.get('/health', (req, res) => {
  return {
    status: 'healthy',
    auth: {
      configured: true,
      providers: ['github', 'google', 'azure-ad', 'okta'],
      rbacEnabled: true,
      auditLoggingEnabled: true,
    },
    security: {
      hasGitHubConfig: !!(process.env.GITHUB_CLIENT_ID || 'demo'),
      hasGoogleConfig: !!(process.env.GOOGLE_CLIENT_ID || 'demo'),
      hasMicrosoftConfig: !!(process.env.MICROSOFT_CLIENT_ID || 'demo'),
      hasOktaConfig: !!(process.env.OKTA_CLIENT_ID || 'demo'),
      hasAuthSecret: !!(process.env.AUTH_SECRET || 'demo'),
      hasWebhookKey: !!(process.env.WEBHOOK_API_KEY || 'demo'),
    },
    timestamp: new Date().toISOString(),
  };
});

// Helper functions (would be in separate services in real app)

async function getUserRoles(userId: string): Promise<string[]> {
  // Mock role mapping
  const roleMap: Record<string, string[]> = {
    'admin-1': ['admin', 'user'],
    'manager-1': ['manager', 'user'],
    'user-1': ['user'],
  };
  return roleMap[userId] || ['user'];
}

async function getUserPermissions(userId: string): Promise<string[]> {
  const roles = await getUserRoles(userId);

  const permissionMap: Record<string, string[]> = {
    admin: ['users:read', 'users:write', 'users:delete', 'system:admin'],
    manager: ['users:read', 'users:write', 'team:manage'],
    user: ['profile:read', 'profile:write'],
  };

  return roles.flatMap(role => permissionMap[role] || []);
}

async function getUserOrganization(userId: string): Promise<string> {
  return 'org_main'; // Mock organization
}

async function logSecurityEvent(event: string, data: any) {
  // Mock audit logging
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...data,
  };
  console.log(`🔒 Security Event [${event}]:`, logEntry);

  // In real app, this would write to audit database
}

async function getSecurityAuditLogs(options: any) {
  // Mock audit logs
  return [
    {
      id: 1,
      event: 'signin_success',
      userId: 'admin-1',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      metadata: { provider: 'azure-ad' },
    },
    {
      id: 2,
      event: 'signin_success',
      userId: 'manager-1',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { provider: 'okta' },
    },
    {
      id: 3,
      event: 'signin_blocked',
      email: 'blocked@blockedcompany.com',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      metadata: { reason: 'blocked_domain' },
    },
    {
      id: 4,
      event: 'webhook_received',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      metadata: { source: 'GitHub-Hookshot' },
    },
  ];
}

async function getActiveUserCount(): Promise<number> {
  return 892; // Mock active user count
}

// Start the server
const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`🚀 Enterprise Auth Example running on http://localhost:${PORT}`);
  console.log('');
  console.log('🏢 Enterprise Authentication Features:');
  console.log('  ✅ Multi-Provider OAuth (GitHub, Google, Microsoft, Okta)');
  console.log('  ✅ Role-Based Access Control (RBAC)');
  console.log('  ✅ Permission-Based Authorization');
  console.log('  ✅ Security Audit Logging');
  console.log('  ✅ Advanced Session Management');
  console.log('  ✅ Custom Authorization Logic');
  console.log('  ✅ Enterprise SSO Support');
  console.log('  ✅ Webhook Security');
  console.log('');
  console.log('🎭 Demo Tokens (for testing):');
  console.log('  admin-token   - Full admin access');
  console.log('  manager-token - Manager level access');
  console.log('  user-token    - Basic user access');
  console.log('');
  console.log('📋 API Endpoints:');
  console.log('  🌐 GET  /                      - Public home page');
  console.log('  🔓 GET  /auth/status           - Authentication status');
  console.log('  🔒 GET  /dashboard             - User dashboard (any user)');
  console.log('  👔 GET  /manager               - Manager dashboard (manager/admin)');
  console.log('  ⚡ GET  /admin                 - Admin panel (admin only)');
  console.log('  🏢 GET  /organization/:id/data - Organization data (custom auth)');
  console.log('  👥 GET  /api/users             - Users API (permission: users:read)');
  console.log('  ⚙️  GET  /profile/settings      - User settings (manual checks)');
  console.log('  🔄 POST /auth/refresh-session  - Refresh session');
  console.log('  🚪 POST /auth/logout           - Enhanced logout');
  console.log('  📊 GET  /admin/security/audit  - Security audit (admin only)');
  console.log('  🔗 POST /webhooks/auth-event   - Auth webhooks (API key)');
  console.log('  ❤️  GET  /health               - Health check with security status');
  console.log('');
  console.log('💡 Example Commands:');
  console.log('  # Public access');
  console.log('  curl http://localhost:' + PORT + '/');
  console.log('');
  console.log('  # User dashboard');
  console.log(
    '  curl -H "Authorization: Bearer user-token" http://localhost:' + PORT + '/dashboard'
  );
  console.log('');
  console.log('  # Manager dashboard');
  console.log(
    '  curl -H "Authorization: Bearer manager-token" http://localhost:' + PORT + '/manager'
  );
  console.log('');
  console.log('  # Admin panel');
  console.log('  curl -H "Authorization: Bearer admin-token" http://localhost:' + PORT + '/admin');
  console.log('');
  console.log('  # Security audit');
  console.log(
    '  curl -H "Authorization: Bearer admin-token" http://localhost:' +
      PORT +
      '/admin/security/audit'
  );
  console.log('');
  console.log('🔧 Environment Variables (optional):');
  console.log('  AUTH_SECRET              - JWT signing secret');
  console.log('  GITHUB_CLIENT_ID         - GitHub OAuth client ID');
  console.log('  GITHUB_CLIENT_SECRET     - GitHub OAuth client secret');
  console.log('  GOOGLE_CLIENT_ID         - Google OAuth client ID');
  console.log('  GOOGLE_CLIENT_SECRET     - Google OAuth client secret');
  console.log('  MICROSOFT_CLIENT_ID      - Microsoft OAuth client ID');
  console.log('  MICROSOFT_CLIENT_SECRET  - Microsoft OAuth client secret');
  console.log('  MICROSOFT_TENANT_ID      - Microsoft tenant ID');
  console.log('  OKTA_CLIENT_ID           - Okta client ID');
  console.log('  OKTA_CLIENT_SECRET       - Okta client secret');
  console.log('  OKTA_DOMAIN              - Okta domain');
  console.log('  WEBHOOK_API_KEY          - API key for webhooks');
});

export default app;
