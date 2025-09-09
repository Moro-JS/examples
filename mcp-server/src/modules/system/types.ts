// System Types - Clean Type Definitions
export interface SystemInfo {
  platform: string;
  memory: MemoryInfo;
  uptime: number;
  loadAverage: number[];
}

export interface MemoryInfo {
  total: number;
  used: number;
  free: number;
}

export interface UptimeInfo {
  totalSeconds: number;
  formatted: string;
  readable: string;
}

export interface LoadAverageInfo {
  '1min': string;
  '5min': string;
  '15min': string;
  interpretation: string;
}

export interface CpuInfo {
  model: string;
  cores: number;
  speed: string;
  architecture: string;
}

export type SystemCommand = 'memory' | 'uptime' | 'load' | 'cpu' | 'all'; 