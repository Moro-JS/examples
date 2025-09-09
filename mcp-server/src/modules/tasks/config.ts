// Task Configuration - Pure Settings
export const config = {
  cache: {
    ttl: 300  // Cache tasks for 5 minutes
  },
  rateLimit: {
    requests: 50,
    window: 60000  // 50 requests per minute
  },
  database: {
    path: './database'
  },
  mcp: {
    tools: [
      'create-task',
      'list-tasks', 
      'update-task',
      'delete-task'
    ],
    resources: [
      'tasks://all',
      'tasks://pending',
      'tasks://completed'
    ],
    prompts: [
      'task-summary'
    ]
  },
  metadata: {
    description: 'Task management system with full CRUD operations',
    author: 'MoroJS Team',
    tags: ['tasks', 'mcp', 'productivity']
  }
}; 