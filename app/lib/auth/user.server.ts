import { openDatabase } from '../persistence/db';
import { generateId, hashPassword, verifyPassword } from './auth.server';
import type { User } from './auth.server';

// Create a new user
export async function createUser(username: string, password: string, email?: string): Promise<User | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    // Check if username already exists
    const existingUser = await db.getFromIndex('users', 'by-username', username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await hashPassword(password);
    const userId = generateId();
    const now = Date.now();

    const user: User = {
      id: userId,
      username,
      password: hashedPassword,
      email,
      createdAt: now,
      lastLogin: now,
    };

    await db.add('users', user);
    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    return await db.get('users', id);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    return await db.getFromIndex('users', 'by-username', username);
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
}

// Verify login credentials
export async function verifyLogin(username: string, password: string): Promise<User | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) return null;

  // Update last login time
  const db = await openDatabase();
  if (db) {
    try {
      await db.put('users', {
        ...user,
        lastLogin: Date.now(),
      });
    } catch (error) {
      console.error('Error updating last login time:', error);
    }
  }

  return user;
}

// Update user
export async function updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User | null> {
  const db = await openDatabase();
  if (!db) return null;

  try {
    const user = await getUserById(id);
    if (!user) return null;

    // If updating password, hash it
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const updatedUser = { ...user, ...updates };
    await db.put('users', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;

  try {
    await db.delete('users', id);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// List all users (admin function)
export async function listUsers(): Promise<User[]> {
  const db = await openDatabase();
  if (!db) return [];

  try {
    return await db.getAll('users');
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
}
