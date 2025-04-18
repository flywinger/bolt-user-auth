import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface BoltHistoryDB extends DBSchema {
  chats: {
    key: string;
    value: {
      id: string;
      title?: string;
      description?: string;
      timestamp: string;
      updatedAt?: number;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        timestamp: string;
      }>;
    };
  };
  users: {
    key: string;
    value: {
      id: string;
      username: string;
      password: string; // Hashed password
      email?: string;
      createdAt: number;
      lastLogin?: number;
    };
    indexes: { 'by-username': string };
  };
  sessions: {
    key: string;
    value: {
      id: string;
      userId: string;
      token: string;
      createdAt: number;
      expiresAt: number;
    };
    indexes: { 'by-token': string; 'by-user': string };
  };
}

let db: IDBPDatabase<BoltHistoryDB> | null = null;

export async function openDatabase(): Promise<IDBPDatabase<BoltHistoryDB> | null> {
  try {
    if (db) return db;

    db = await openDB<BoltHistoryDB>('boltHistory', 2, {
      upgrade(database, oldVersion, newVersion) {
        // Create or update chat store
        if (!database.objectStoreNames.contains('chats')) {
          database.createObjectStore('chats', { keyPath: 'id' });
        }

        // Create users store with username index
        if (!database.objectStoreNames.contains('users')) {
          const userStore = database.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-username', 'username', { unique: true });
        }

        // Create sessions store with token and user indexes
        if (!database.objectStoreNames.contains('sessions')) {
          const sessionStore = database.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-token', 'token', { unique: true });
          sessionStore.createIndex('by-user', 'userId', { unique: false });
        }
      },
    });

    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    return null;
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}
