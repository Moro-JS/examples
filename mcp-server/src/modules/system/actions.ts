// System Actions - Pure Business Logic
import { totalmem, freemem, uptime, loadavg, type, release, arch, cpus } from 'os';
import { SystemInfo, MemoryInfo, UptimeInfo, LoadAverageInfo, CpuInfo } from './types';

export async function getSystemInfo(database: any): Promise<SystemInfo> {
  const totalMemory = totalmem();
  const freeMemory = freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    platform: `${type()} ${release()} (${arch()})`,
    memory: {
      total: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100, // GB
      used: Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100,   // GB
      free: Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100    // GB
    },
    uptime: Math.round(uptime()),
    loadAverage: loadavg()
  };
}

export async function getMemoryInfo(database: any): Promise<MemoryInfo & { usagePercentage: string }> {
  const totalMemory = totalmem();
  const freeMemory = freemem();
  const usedMemory = totalMemory - freeMemory;

  return {
    total: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100,
    used: Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100,
    free: Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100,
    usagePercentage: `${Math.round((usedMemory / totalMemory) * 100)}%`
  };
}

export async function getUptimeInfo(database: any): Promise<UptimeInfo> {
  const uptimeSeconds = uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return {
    totalSeconds: uptimeSeconds,
    formatted: `${days}d ${hours}h ${minutes}m`,
    readable: `${days} days, ${hours} hours, ${minutes} minutes`
  };
}

export async function getLoadAverageInfo(database: any): Promise<LoadAverageInfo> {
  const load = loadavg();
  return {
    '1min': load[0].toFixed(2),
    '5min': load[1].toFixed(2),
    '15min': load[2].toFixed(2),
    interpretation: interpretLoadAverage(load[0])
  };
}

export async function getCpuInfo(database: any): Promise<CpuInfo> {
  const cpuData = cpus();
  return {
    model: cpuData[0]?.model || 'Unknown',
    cores: cpuData.length,
    speed: `${cpuData[0]?.speed || 0} MHz`,
    architecture: arch()
  };
}

function interpretLoadAverage(load: number): string {
  const cores = cpus().length;
  const ratio = load / cores;

  if (ratio < 0.7) return 'Low load - system performing well';
  if (ratio < 1.0) return 'Moderate load - system busy but responsive';
  if (ratio < 1.5) return 'High load - system may be slow';
  return 'Very high load - system overloaded';
} 