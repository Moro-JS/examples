// Task Actions - Pure Business Logic
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock data for demonstration - in production this would come from database
const mockTasks: Task[] = [
  {
    id: uuidv4(),
    title: 'Learn MCP Protocol',
    description: 'Understand how Model Context Protocol works with AI agents',
    completed: false,
    priority: 'high',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: uuidv4(),
    title: 'Build MoroJS Server',
    description: 'Create an MCP server using MoroJS framework',
    completed: true,
    priority: 'medium',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-03')
  },
  {
    id: uuidv4(),
    title: 'Test with Claude',
    description: 'Test the MCP server with Claude Desktop',
    completed: false,
    priority: 'medium',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04')
  }
];

export async function getAllTasks(database: any): Promise<Task[]> {
  // In production, this would query the actual database
  return database?.tasks || mockTasks;
}

export async function getTaskById(id: string, database: any): Promise<Task | null> {
  const tasks = database?.tasks || mockTasks;
  return tasks.find((task: Task) => task.id === id) || null;
}

export async function createTask(
  taskData: CreateTaskRequest, 
  database: any, 
  events: any
): Promise<Task> {
  const tasks = database?.tasks || mockTasks;
  
  const newTask: Task = {
    id: uuidv4(),
    title: taskData.title,
    description: taskData.description || '',
    completed: false,
    priority: taskData.priority || 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  tasks.push(newTask);
  
  // Emit event for other modules
  if (events) {
    await events.emit('task:created', { task: newTask });
  }
  
  return newTask;
}

export async function updateTask(
  id: string, 
  updates: Partial<Omit<Task, 'id' | 'createdAt'>>, 
  database: any, 
  events: any
): Promise<Task | null> {
  const tasks = database?.tasks || mockTasks;
  const taskIndex = tasks.findIndex((task: Task) => task.id === id);
  
  if (taskIndex === -1) {
    return null;
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
    updatedAt: new Date()
  };
  
  tasks[taskIndex] = updatedTask;
  
  // Emit event for other modules
  if (events) {
    await events.emit('task:updated', { task: updatedTask });
  }

  return updatedTask;
}

export async function deleteTask(id: string, database: any, events: any): Promise<boolean> {
  const tasks = database?.tasks || mockTasks;
  const taskIndex = tasks.findIndex((task: Task) => task.id === id);
  
  if (taskIndex === -1) {
    return false;
  }

  const deletedTask = tasks[taskIndex];
  tasks.splice(taskIndex, 1);
  
  // Emit event for other modules
  if (events) {
    await events.emit('task:deleted', { task: deletedTask });
  }

  return true;
}

export async function getTasksByPriority(priority: Task['priority'], database: any): Promise<Task[]> {
  const tasks = database?.tasks || mockTasks;
  return tasks.filter((task: Task) => task.priority === priority);
}

export async function getCompletedTasks(database: any): Promise<Task[]> {
  const tasks = database?.tasks || mockTasks;
  return tasks.filter((task: Task) => task.completed);
}

export async function getPendingTasks(database: any): Promise<Task[]> {
  const tasks = database?.tasks || mockTasks;
  return tasks.filter((task: Task) => !task.completed);
}

export async function getTasksWithFilters(filters: TaskFilters, database: any): Promise<Task[]> {
  let tasks = database?.tasks || mockTasks;
  
  if (filters.completed !== undefined) {
    tasks = tasks.filter((task: Task) => task.completed === filters.completed);
  }
  
  if (filters.priority) {
    tasks = tasks.filter((task: Task) => task.priority === filters.priority);
  }
  
  if (filters.limit) {
    tasks = tasks.slice(0, filters.limit);
  }
  
  return tasks;
} 