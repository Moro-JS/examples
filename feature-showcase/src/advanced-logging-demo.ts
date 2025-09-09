// Advanced Logging Demo
// Demonstrates enterprise-grade logging capabilities integrated into feature showcase

import { createApp, createFrameworkLogger, z } from '@morojs/moro';
import { mkdirSync } from 'fs';

/**
 * Configure Advanced Logging System
 * This demonstrates the logging capabilities available in Moro
 */
export function setupAdvancedLogging() {
  // Create specialized loggers for different components
  const apiLogger = createFrameworkLogger('API');
  const dbLogger = createFrameworkLogger('Database');
  const authLogger = createFrameworkLogger('Auth');
  const cacheLogger = createFrameworkLogger('Cache');

  // Create logs directory if it doesn't exist
  try {
    mkdirSync('./logs', { recursive: true });
  } catch (e) {
    // Directory already exists
  }

  return {
    apiLogger,
    dbLogger,
    authLogger,
    cacheLogger,
  };
}

/**
 * Add logging demonstration routes to an existing app
 */
export function addLoggingDemoRoutes(app: any) {
  const { apiLogger, dbLogger, authLogger, cacheLogger } = setupAdvancedLogging();

  // Logging demonstration endpoints
  app
    .get('/demo/logging')
    .describe('Demonstrate various logging levels and features')
    .tag('demo', 'logging')
    .handler(async (req, res) => {
      const startTime = Date.now();

      // Demonstrate different log levels
      apiLogger.debug('Debug message from API logger', 'Demo', { user: 'demo-user' });
      apiLogger.info('Info message with metadata', 'Demo', {
        endpoint: '/demo/logging',
        method: 'GET',
        timestamp: new Date().toISOString(),
      });
      apiLogger.warn('Warning message example', 'Demo', {
        reason: 'demonstration',
        impact: 'none',
      });

      // Simulate database operations with timing
      const dbStart = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
      const dbTime = Date.now() - dbStart;

      dbLogger.info('Database query completed', 'Query', {
        query: 'SELECT * FROM demo_table',
        duration: dbTime,
        rowsAffected: 5,
      });

      // Simulate auth operation
      authLogger.info('User authentication', 'Auth', {
        userId: 'demo-123',
        method: 'token',
        success: true,
      });

      // Simulate cache operation
      cacheLogger.debug('Cache lookup', 'Cache', {
        key: 'demo-cache-key',
        hit: false,
        ttl: 300,
      });

      const totalTime = Date.now() - startTime;

      apiLogger.info('Request completed', 'Demo', {
        totalDuration: totalTime,
        components: ['auth', 'database', 'cache'],
      });

      return {
        message: 'Logging demonstration completed',
        duration: totalTime,
        logsSent: 'Check console for colored, structured logs',
        features: [
          'Colored console output',
          'Structured metadata',
          'Context-based loggers',
          'Performance timing',
          'Multiple log levels',
          'Component separation',
        ],
      };
    });

  // Error logging demonstration
  app
    .get('/demo/logging/error')
    .describe('Demonstrate error logging with stack traces')
    .tag('demo', 'logging')
    .handler(async (req, res) => {
      try {
        // Simulate an error
        throw new Error('This is a demonstration error');
      } catch (error) {
        apiLogger.error('Demonstration error occurred', 'ErrorDemo', {
          error: error.message,
          stack: error.stack,
          endpoint: '/demo/logging/error',
          handled: true,
        });

        return {
          message: 'Error logged successfully',
          error: 'Check console for full error details with stack trace',
          logLevel: 'error',
        };
      }
    });

  // Performance logging demonstration
  app
    .get('/demo/logging/performance')
    .describe('Demonstrate performance monitoring and timing')
    .tag('demo', 'logging')
    .handler(async (req, res) => {
      const operationStart = Date.now();

      // Use the logger's built-in timing
      apiLogger.time('demo-operation');

      // Simulate slow operation
      const delay = parseInt(req.query.delay as string) || 200;
      await new Promise(resolve => setTimeout(resolve, delay));

      apiLogger.timeEnd('demo-operation', 'Performance', {
        operation: 'demo-slow-operation',
        simulatedDelay: delay,
      });

      const duration = Date.now() - operationStart;

      return {
        message: 'Performance logging demonstration',
        operationDuration: duration,
        note: 'Check console for timing information with context',
      };
    });

  // Component-specific logging demonstration
  app
    .get('/demo/logging/components')
    .describe('Demonstrate component-specific loggers')
    .tag('demo', 'logging')
    .handler(async (req, res) => {
      // Each component logger maintains its own context
      apiLogger.info('API request received', 'Request', {
        endpoint: '/demo/logging/components',
        userAgent: req.headers['user-agent'],
      });

      dbLogger.info('Database connection established', 'Connection', {
        host: 'localhost',
        database: 'demo_db',
        connectionTime: '45ms',
      });

      authLogger.info('User authorization check', 'Authorization', {
        userId: 'demo-user',
        permissions: ['read', 'write'],
        result: 'granted',
      });

      cacheLogger.info('Cache operation', 'Cache', {
        operation: 'get',
        key: 'user:demo-user',
        result: 'miss',
        fallbackToDb: true,
      });

      return {
        message: 'Component logging demonstration completed',
        note: 'Each component has its own colored context in the console',
        components: ['API', 'Database', 'Auth', 'Cache'],
      };
    });

  return {
    apiLogger,
    dbLogger,
    authLogger,
    cacheLogger,
  };
}

/**
 * Standalone demo server (for development/testing)
 */
export function createLoggingDemoServer() {
  const app = createApp();

  addLoggingDemoRoutes(app);

  app.get('/', (req, res) => {
    return {
      message: 'Advanced Logging Demo Server',
      endpoints: [
        'GET /demo/logging - Main logging demonstration',
        'GET /demo/logging/error - Error logging demo',
        'GET /demo/logging/performance - Performance timing demo',
        'GET /demo/logging/components - Component-specific logging demo',
      ],
      note: 'All logs appear in the console with colors and structure',
    };
  });

  return app;
}

// Export for use in feature showcase
export default {
  setupAdvancedLogging,
  addLoggingDemoRoutes,
  createLoggingDemoServer,
};
