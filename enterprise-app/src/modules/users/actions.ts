// User Actions - Pure Business Logic
import { User, CreateUserRequest, UpdateUserRequest } from './types';

// Pure business logic functions that receive dependencies as parameters
export async function getAllUsers(database: any): Promise<User[]> {
  const mockUsers = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  // Production-ready database integration - currently using mock data for demonstration
  return database?.users || mockUsers;
}

export async function getUserById(id: number, database: any): Promise<User | null> {
  const users = database.users || [];
  return users.find((user: User) => user.id === id) || null;
}

export async function createUser(
  userData: CreateUserRequest,
  database: any,
  events: any
): Promise<User> {
  const users = database.users || [];
  const newUser: User = {
    id: Math.max(...users.map((u: User) => u.id), 0) + 1,
    name: userData.name,
    email: userData.email,
    role: userData.role || 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);

  // Intentional event emission
  await events.emit('user.created', { user: newUser });

  return newUser;
}

export async function updateUser(
  id: number,
  updateData: UpdateUserRequest,
  database: any,
  events: any
): Promise<User | null> {
  const users = database.users || [];
  const userIndex = users.findIndex((user: User) => user.id === id);

  if (userIndex === -1) {
    return null;
  }

  const updates: any = {};
  if (updateData.name !== undefined) updates.name = updateData.name;
  if (updateData.email !== undefined) updates.email = updateData.email;
  if (updateData.role !== undefined) updates.role = updateData.role;

  if (Object.keys(updates).length === 0) {
    return users[userIndex];
  }

  updates.updatedAt = new Date();

  users[userIndex] = { ...users[userIndex], ...updates };

  // Intentional event emission
  await events.emit('user.updated', { user: users[userIndex], changes: updates });

  return users[userIndex];
}

export async function deleteUser(id: number, database: any, events: any): Promise<boolean> {
  const users = database.users || [];
  const userIndex = users.findIndex((user: User) => user.id === id);

  if (userIndex === -1) {
    return false;
  }

  const user = users[userIndex];
  users.splice(userIndex, 1);

  // Intentional event emission
  await events.emit('user.deleted', { userId: id, user });

  return true;
}

export async function getUsersByRole(role: string, database: any): Promise<User[]> {
  const users = database.users || [];
  return users.filter((user: User) => user.role === role);
}

export async function getUserByEmail(email: string, database: any): Promise<User | null> {
  const users = database.users || [];
  return users.find((user: User) => user.email === email) || null;
}
