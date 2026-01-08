import bcrypt from 'bcrypt';
import { User } from '../../shared/types';

// In-memory user store for development
// In production, this would be replaced with a proper database
const users: User[] = [
  {
    id: 1,
    username: 'admin',
    password: '', // Will be set below
    role: { id: 1, name: 'admin', level: 3, description: 'Administrator' },
    name: 'Administrator',
    email: 'admin@example.com',
    isActive: true,
    languagePreference: 'EN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    username: 'manager',
    password: '', // Will be set below
    role: { id: 2, name: 'manager', level: 2, description: 'Manager' },
    name: 'Manager User',
    email: 'manager@example.com',
    isActive: true,
    languagePreference: 'EN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    username: 'staff',
    password: '', // Will be set below
    role: { id: 3, name: 'staff', level: 1, description: 'Staff' },
    name: 'Staff User',
    email: 'staff@example.com',
    isActive: true,
    languagePreference: 'EN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

];

// Initialize default passwords (in production, these would be properly managed)
async function initializeUsers() {
  const saltRounds = 10;
  
  users[0].password = await bcrypt.hash('admin123', saltRounds);
  users[1].password = await bcrypt.hash('manager123', saltRounds);
  users[2].password = await bcrypt.hash('staff123', saltRounds);
  
  console.log('✅ User passwords initialized');
}

// Track initialization status
let isInitialized = false;
const initPromise = initializeUsers().then(() => {
  isInitialized = true;
}).catch(console.error);

// Ensure initialization is complete before operations
async function ensureInitialized() {
  if (!isInitialized) {
    await initPromise;
  }
}

export async function findUserByUsername(username: string): Promise<User | null> {
  await ensureInitialized();
  const user = users.find(u => u.username === username);
  return user || null;
}

export async function findUserById(id: string): Promise<User | null> {
  await ensureInitialized();
  const user = users.find(u => u.id === parseInt(id));
  return user || null;
}

export async function validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  await ensureInitialized();
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password || '', saltRounds);
  
  const newUser: User = {
    ...userData,
    id: users.length + 1,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  users.push(newUser);
  return newUser;
}