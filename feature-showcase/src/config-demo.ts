// Configuration System Demo - Type-Safe Environment Configuration
import { 
  createApp, 
  z, 
  getConfig, 
  createModuleConfig, 
  getEnvVar, 
  isDevelopment, 
  isProduction 
} from '@morojs/moro';

const app = createApp();

// ============================================
// 1. Access Global Configuration
// ============================================
const globalConfig = app.getConfig();

console.log('Global Configuration Loaded:');
console.log(`  - Environment: ${globalConfig.server.environment}`);
console.log(`  - Port: ${globalConfig.server.port}`);
console.log(`  - Cache Enabled: ${globalConfig.modules.cache.enabled}`);
console.log(`  - Rate Limit: ${globalConfig.modules.rateLimit.defaultRequests}/min`);
console.log(`  - CORS Enabled: ${globalConfig.security.cors.enabled}`);

// ============================================
// 2. Module-Specific Configuration
// ============================================
const UserModuleConfigSchema = z.object({
  cache: z.object({
    ttl: z.coerce.number().default(600) // Users cache longer
  }),
  rateLimit: z.object({
    requests: z.coerce.number().default(50), // Users have stricter rate limits
    window: z.coerce.number().default(60000)
  }),
  features: z.object({
    registration: z.coerce.boolean().default(true),
    passwordReset: z.coerce.boolean().default(true),
    emailVerification: z.coerce.boolean().default(false)
  }),
  security: z.object({
    passwordMinLength: z.coerce.number().min(6).default(8),
    requireSpecialChars: z.coerce.boolean().default(false),
    sessionTimeout: z.coerce.number().default(3600000) // 1 hour
  })
});

// Create module config with environment overrides
const userModuleConfig = createModuleConfig(
  UserModuleConfigSchema,
  {
    cache: { ttl: 600 },
    rateLimit: { requests: 50, window: 60000 },
    features: {
      registration: true,
      passwordReset: true,
      emailVerification: false
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: false,
      sessionTimeout: 3600000
    }
  },
  'USER_' // Environment prefix: USER_CACHE_TTL, USER_RATE_LIMIT_REQUESTS, etc.
);

console.log('\n👤 User Module Configuration:');
console.log(`  - Cache TTL: ${userModuleConfig.cache.ttl}s`);
console.log(`  - Rate Limit: ${userModuleConfig.rateLimit.requests}/${userModuleConfig.rateLimit.window}ms`);
console.log(`  - Registration Enabled: ${userModuleConfig.features.registration}`);
console.log(`  - Password Min Length: ${userModuleConfig.security.passwordMinLength}`);

// ============================================
// 3. Environment-Aware Logic
// ============================================
console.log('\nEnvironment Detection:');
console.log(`  - Is Development: ${isDevelopment()}`);
console.log(`  - Is Production: ${isProduction()}`);

if (isDevelopment()) {
  console.log('  - Development mode: Enhanced logging, debug features enabled');
  app.use((req, res, next) => {
    console.log(`[DEV] ${req.method} ${req.path}`);
    next();
  });
}

if (isProduction()) {
  console.log('  - Production mode: Optimized for performance and security');
}

// ============================================
// 4. Type-Safe Environment Variable Access
// ============================================
const customPort = getEnvVar('CUSTOM_PORT', 8080, (val) => parseInt(val));
const enableDebug = getEnvVar('DEBUG_ENABLED', false);
const appName = getEnvVar('APP_NAME', 'Moro Demo App');

console.log('\n Custom Environment Variables:');
console.log(`  - Custom Port: ${customPort} (type: ${typeof customPort})`);
console.log(`  - Debug Enabled: ${enableDebug} (type: ${typeof enableDebug})`);
console.log(`  - App Name: ${appName}`);

// ============================================
// 5. Routes Using Configuration
// ============================================

// Configuration endpoint
app.get('/config')
  .describe('Get application configuration')
  .tag('system')
  .handler((req, res) => {
    const config = app.getConfig();
    
    return {
      success: true,
      data: {
        environment: config.server.environment,
        server: {
          port: config.server.port,
          host: config.server.host
        },
        features: {
          cacheEnabled: config.modules.cache.enabled,
          rateLimitEnabled: config.modules.rateLimit.enabled,
          corsEnabled: config.security.cors.enabled
        },
        performance: {
          compressionEnabled: config.performance.compression.enabled,
          circuitBreakerEnabled: config.performance.circuitBreaker.enabled
        }
      }
    };
  });

// Health check with configuration info
app.get('/health')
  .describe('Health check with configuration status')
  .tag('system')
  .handler((req, res) => {
    const config = app.getConfig();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.server.environment,
      version: '1.0.0',
      configuration: {
        loaded: true,
        environment: config.server.environment,
        features: Object.keys(config.modules).length
      }
    };
  });

// Users endpoint using module configuration
app.post('/users')
  .body(z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(userModuleConfig.security.passwordMinLength)
  }))
  .rateLimit({ 
    requests: userModuleConfig.rateLimit.requests, 
    window: userModuleConfig.rateLimit.window 
  })
  .cache({ ttl: userModuleConfig.cache.ttl })
  .describe('Create user with module-specific configuration')
  .tag('users')
  .handler((req, res) => {
    const { name, email, password } = req.body;
    
    // Password validation based on configuration
    if (userModuleConfig.security.requireSpecialChars) {
      const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharRegex.test(password)) {
        return {
          success: false,
          error: 'Password must contain special characters'
        };
      }
    }
    
    return {
      success: true,
      message: 'User created successfully',
      data: {
        id: Math.floor(Math.random() * 1000),
        name,
        email,
        features: {
          registrationEnabled: userModuleConfig.features.registration,
          emailVerificationRequired: userModuleConfig.features.emailVerification
        }
      },
      configuration: {
        cacheExpiry: userModuleConfig.cache.ttl,
        rateLimitApplied: `${userModuleConfig.rateLimit.requests}/${userModuleConfig.rateLimit.window}ms`
      }
    };
  });

// Configuration validation demo
app.get('/validate-config')
  .describe('Demonstrate configuration validation')
  .tag('demo')
  .handler((req, res) => {
    try {
      const config = app.getConfig();
      
      const validationResults = {
        server: {
          portValid: config.server.port >= 1 && config.server.port <= 65535,
          environmentValid: ['development', 'staging', 'production'].includes(config.server.environment)
        },
        security: {
          corsConfigured: config.security.cors.enabled,
          helmetEnabled: config.security.helmet.enabled
        },
        performance: {
          compressionLevel: config.performance.compression.level,
          circuitBreakerThreshold: config.performance.circuitBreaker.failureThreshold
        }
      };
      
      return {
        success: true,
        message: 'Configuration validation completed',
        results: validationResults,
        allValid: Object.values(validationResults.server).every(Boolean) &&
                  Object.values(validationResults.security).every(Boolean)
      };
    } catch (error) {
      return {
        success: false,
        error: 'Configuration validation failed',
        details: String(error)
      };
    }
  });

// ============================================
// 6. Start Server with Configuration
// ============================================
const port = globalConfig.server.port;
const host = globalConfig.server.host;

app.listen(port, () => {
  console.log(`\nMoro Configuration Demo running!`);
  console.log(`   Server: http://${host}:${port}`);
  console.log(`   Environment: ${globalConfig.server.environment}`);
  console.log(`\nAvailable Endpoints:`);
  console.log(`   GET  /config          - View application configuration`);
  console.log(`   GET  /health          - Health check with config info`);
  console.log(`   POST /users           - Create user (with module config)`);
  console.log(`   GET  /validate-config - Configuration validation demo`);
  console.log(`\nTry these commands:`);
  console.log(`   curl http://localhost:${port}/config`);
  console.log(`   curl http://localhost:${port}/health`);
  console.log(`   curl -X POST http://localhost:${port}/users -H "Content-Type: application/json" -d '{"name":"John","email":"john@example.com","password":"secret123"}'`);
  
  if (isDevelopment()) {
    console.log(`\nDevelopment Tips:`);
    console.log(`   - Set USER_CACHE_TTL=1200 to override user cache TTL`);
    console.log(`   - Set USER_RATE_LIMIT_REQUESTS=20 to reduce user rate limits`);
    console.log(`   - Set DEBUG_ENABLED=true for extra debug info`);
    console.log(`   - Check .env.example for all available configuration options`);
  }
}); 