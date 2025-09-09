// Health Actions - Pure Business Logic
import { HealthStatus, ServiceHealth } from './types';

// Pure business logic functions
export async function getHealthStatus(): Promise<HealthStatus> {
  const startTime = process.hrtime();

  // Mock service health checks
  const services: ServiceHealth[] = [
    {
      name: 'database',
      status: 'up',
      responseTime: Math.random() * 10,
      lastCheck: new Date(),
    },
    {
      name: 'cache',
      status: 'up',
      responseTime: Math.random() * 5,
      lastCheck: new Date(),
    },
    {
      name: 'external-api',
      status: Math.random() > 0.1 ? 'up' : 'degraded',
      responseTime: Math.random() * 100,
      lastCheck: new Date(),
    },
  ];

  // Determine overall status
  const hasDown = services.some(s => s.status === 'down');
  const hasDegraded = services.some(s => s.status === 'degraded');

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (hasDown) status = 'unhealthy';
  else if (hasDegraded) status = 'degraded';

  return {
    status,
    timestamp: new Date(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services,
  };
}

export async function getSimpleHealth(): Promise<{ status: string; timestamp: Date }> {
  return {
    status: 'ok',
    timestamp: new Date(),
  };
}
