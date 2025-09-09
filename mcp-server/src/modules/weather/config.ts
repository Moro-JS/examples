// Weather Configuration - Pure Settings
export const config = {
  cache: {
    ttl: 900, // Cache weather data for 15 minutes
  },
  rateLimit: {
    requests: 20,
    window: 60000, // 20 requests per minute
  },
  database: {
    path: './database',
  },
  mcp: {
    tools: ['get-weather', 'search-locations'],
    resources: ['weather://locations'],
    prompts: ['weather-advice'],
  },
  metadata: {
    description: 'Weather information service with forecast data',
    author: 'MoroJS Team',
    tags: ['weather', 'forecast', 'mcp'],
  },
};
