// Simple Authentication Example for MoroJS
// Demonstrates basic Auth.js integration with GitHub and Google providers

import { createApp } from '@morojs/moro';

const app = createApp({
  logger: { level: 'info', enableColors: true },
});

// Mock auth middleware for demonstration
// In a real implementation, this would be imported from MoroJS auth module
function createAuthMiddleware(config: any) {
  return (req: any, res: any, next: any) => {
    // Mock auth object - in real implementation this would come from Auth.js
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
        console.log(`🔐 Sign in initiated with ${provider}`);
        return { url: `/api/auth/signin/${provider}` };
      },
      signOut(options?: any) {
        console.log('🚪 Sign out initiated');
        req.auth.isAuthenticated = false;
        req.auth.user = null;
        req.auth.session = null;
        return { url: options?.callbackUrl || '/' };
      },
    };

    // Mock authentication state for demo
    if (req.headers.authorization === 'Bearer demo-token') {
      req.auth.isAuthenticated = true;
      req.auth.user = {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
      };
      req.auth.session = {
        user: req.auth.user,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        customData: {
          loginTime: new Date(),
          provider: 'github',
        },
      };
    }

    next();
  };
}

// Configure authentication with multiple providers
app.use(
  createAuthMiddleware({
    providers: [
      // GitHub Provider
      {
        id: 'github',
        name: 'GitHub',
        type: 'oauth',
        authorization: 'https://github.com/login/oauth/authorize',
        token: 'https://github.com/login/oauth/access_token',
        userinfo: 'https://api.github.com/user',
        clientId: process.env.GITHUB_CLIENT_ID || 'demo-github-client',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-github-secret',
      },

      // Google Provider
      {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        authorization: 'https://accounts.google.com/oauth/authorize',
        token: 'https://oauth2.googleapis.com/token',
        userinfo: 'https://www.googleapis.com/oauth2/v2/userinfo',
        clientId: process.env.GOOGLE_CLIENT_ID || 'demo-google-client',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'demo-google-secret',
      },
    ],

    secret: process.env.AUTH_SECRET || 'demo-secret-key',
    basePath: '/api/auth',

    // Callbacks for custom logic
    callbacks: {
      async signIn({ user, account }: { user: any; account: any }) {
        console.log(`✅ User ${user.email} signing in via ${account?.provider}`);

        // Custom business logic - block certain domains
        if (user.email?.endsWith('@blocked.com')) {
          console.log(`❌ Blocked sign-in attempt: ${user.email}`);
          return false;
        }

        return true;
      },

      async session({ session, token }: { session: any; token: any }) {
        // Add custom data to session
        session.customData = {
          loginTime: new Date(),
          provider: token.provider,
        };
        return session;
      },
    },
  })
);

// Routes

// Home page - shows authentication status
app.get('/', (req, res) => {
  return {
    message: 'Welcome to Simple Auth Example! 🚀',
    auth: {
      isAuthenticated: req.auth?.isAuthenticated || false,
      user: req.auth?.user || null,
    },
    features: [
      '✅ GitHub OAuth integration',
      '✅ Google OAuth integration',
      '✅ Session management',
      '✅ Custom authentication callbacks',
      '✅ Protected routes',
    ],
    timestamp: new Date().toISOString(),
  };
});

// Authentication status endpoint
app.get('/auth/status', (req, res) => {
  if (!req.auth) {
    return {
      error: 'Auth middleware not working',
      isAuthenticated: false,
    };
  }

  return {
    isAuthenticated: req.auth.isAuthenticated,
    user: req.auth.user,
    session: req.auth.session,
    authMethods: {
      getSession: typeof req.auth.getSession,
      getUser: typeof req.auth.getUser,
      signIn: typeof req.auth.signIn,
      signOut: typeof req.auth.signOut,
    },
  };
});

// Protected dashboard (requires authentication)
app.get('/dashboard', (req, res) => {
  if (!req.auth?.isAuthenticated) {
    res.statusCode = 401;
    return {
      error: 'Authentication required',
      message: 'Please sign in to access the dashboard',
      signInUrl: '/api/auth/signin',
      hint: 'For demo: add "Authorization: Bearer demo-token" header',
    };
  }

  return {
    message: `Welcome to your dashboard, ${req.auth.user?.name}!`,
    user: {
      id: req.auth.user.id,
      name: req.auth.user.name,
      email: req.auth.user.email,
      image: req.auth.user.image,
    },
    sessionInfo: {
      expires: req.auth.session?.expires,
      loginTime: req.auth.session?.customData?.loginTime,
      provider: req.auth.session?.customData?.provider,
    },
  };
});

// API endpoint for user info
app.get('/api/me', async (req, res) => {
  const session = await req.auth?.getSession();

  if (!session) {
    res.statusCode = 401;
    return {
      error: 'No active session',
      hint: 'For demo: add "Authorization: Bearer demo-token" header',
    };
  }

  return {
    user: session.user,
    sessionExpiry: session.expires,
    customData: session.customData,
  };
});

// Sign in endpoint (programmatic)
app.post('/api/signin', (req, res) => {
  const { provider, callbackUrl } = req.body || {};

  if (!provider) {
    res.statusCode = 400;
    return { error: 'Provider is required' };
  }

  const validProviders = ['github', 'google'];
  if (!validProviders.includes(provider)) {
    res.statusCode = 400;
    return {
      error: 'Invalid provider',
      validProviders,
    };
  }

  const signInResult = req.auth?.signIn(provider, { callbackUrl });

  return {
    success: true,
    redirectUrl: signInResult?.url,
    message: `Redirecting to ${provider} for authentication`,
    provider,
  };
});

// Sign out endpoint (programmatic)
app.post('/api/signout', (req, res) => {
  const { callbackUrl } = req.body || {};

  if (!req.auth?.isAuthenticated) {
    res.statusCode = 400;
    return { error: 'Not authenticated' };
  }

  const signOutResult = req.auth.signOut({ callbackUrl: callbackUrl || '/' });

  return {
    success: true,
    redirectUrl: signOutResult?.url,
    message: 'Successfully signed out',
  };
});

// Health check
app.get('/health', (req, res) => {
  return {
    status: 'healthy',
    auth: {
      configured: !!req.auth,
      hasGitHubConfig: !!(process.env.GITHUB_CLIENT_ID || 'demo'),
      hasGoogleConfig: !!(process.env.GOOGLE_CLIENT_ID || 'demo'),
      hasAuthSecret: !!(process.env.AUTH_SECRET || 'demo'),
    },
    timestamp: new Date().toISOString(),
  };
});

// Start the server
const PORT = parseInt(process.env.PORT || '3000', 10);

app.listen(PORT, () => {
  console.log(`🚀 Simple Auth Example running on http://localhost:${PORT}`);
  console.log('');
  console.log('🔐 Authentication Features:');
  console.log('  ✅ GitHub OAuth (demo)');
  console.log('  ✅ Google OAuth (demo)');
  console.log('  ✅ Session management');
  console.log('  ✅ Protected routes');
  console.log('  ✅ Custom authentication logic');
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log('  🌐 GET  /                  - Home page with auth status');
  console.log('  🔍 GET  /auth/status       - Authentication status');
  console.log('  🔒 GET  /dashboard         - Protected dashboard');
  console.log('  👤 GET  /api/me            - Current user info');
  console.log('  🔑 POST /api/signin        - Programmatic sign in');
  console.log('  🚪 POST /api/signout       - Programmatic sign out');
  console.log('  ❤️  GET  /health           - Health check');
  console.log('');
  console.log('🧪 Demo Mode:');
  console.log('  Add "Authorization: Bearer demo-token" header to simulate authentication');
  console.log('');
  console.log('🔧 Environment Variables (optional):');
  console.log('  AUTH_SECRET         - JWT signing secret');
  console.log('  GITHUB_CLIENT_ID    - GitHub OAuth client ID');
  console.log('  GITHUB_CLIENT_SECRET - GitHub OAuth client secret');
  console.log('  GOOGLE_CLIENT_ID    - Google OAuth client ID');
  console.log('  GOOGLE_CLIENT_SECRET - Google OAuth client secret');
  console.log('');
  console.log('💡 Try these commands:');
  console.log('  curl http://localhost:' + PORT + '/');
  console.log(
    '  curl -H "Authorization: Bearer demo-token" http://localhost:' + PORT + '/dashboard'
  );
});

export default app;
