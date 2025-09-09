// Todo Actions - Pure Business Logic
import { Todo, CreateTodoRequest, UpdateTodoRequest } from './types';

// Pure business logic functions that receive dependencies as parameters
export async function getAllTodos(database: any): Promise<Todo[]> {
  return database.todos || [];
}

export async function getTodoById(id: number, database: any): Promise<Todo | null> {
  const todos = database.todos || [];
  return todos.find((todo: Todo) => todo.id === id) || null;
}

export async function createTodo(
  data: CreateTodoRequest,
  database: any,
  events: any
): Promise<Todo> {
  const todos = database.todos || [];

  const newTodo: Todo = {
    id: Math.max(...todos.map((t: Todo) => t.id), 0) + 1,
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'medium',
    due_date: data.due_date ? new Date(data.due_date) : undefined,
    completed: false,
    created_at: new Date(),
    updated_at: new Date(),
  };

  todos.push(newTodo);

  // Intentional event emission
  await events.emit('todo.created', { todo: newTodo });

  return newTodo;
}

export async function updateTodo(
  id: number,
  data: UpdateTodoRequest,
  database: any,
  events: any
): Promise<Todo | null> {
  const todos = database.todos || [];
  const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

  if (todoIndex === -1) {
    return null;
  }

  const updates: any = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.description !== undefined) updates.description = data.description;
  if (data.completed !== undefined) updates.completed = data.completed;
  if (data.priority !== undefined) updates.priority = data.priority;
  if (data.due_date !== undefined) {
    updates.due_date = data.due_date ? new Date(data.due_date) : undefined;
  }

  if (Object.keys(updates).length === 0) {
    return todos[todoIndex];
  }

  updates.updated_at = new Date();
  todos[todoIndex] = { ...todos[todoIndex], ...updates };

  // Intentional event emission
  await events.emit('todo.updated', { todo: todos[todoIndex], changes: updates });

  return todos[todoIndex];
}

export async function deleteTodo(id: number, database: any, events: any): Promise<boolean> {
  const todos = database.todos || [];
  const todoIndex = todos.findIndex((todo: Todo) => todo.id === id);

  if (todoIndex === -1) {
    return false;
  }

  const todo = todos[todoIndex];
  todos.splice(todoIndex, 1);

  // Intentional event emission
  await events.emit('todo.deleted', { todoId: id });

  return true;
}

export async function getTodosByPriority(priority: string, database: any): Promise<Todo[]> {
  const todos = database.todos || [];
  return todos.filter((todo: Todo) => todo.priority === priority);
}

export async function getCompletedTodos(database: any): Promise<Todo[]> {
  const todos = database.todos || [];
  return todos.filter((todo: Todo) => todo.completed === true);
}

export async function getPendingTodos(database: any): Promise<Todo[]> {
  const todos = database.todos || [];
  return todos.filter((todo: Todo) => todo.completed === false);
}
