// User Management Service - Firebase Sync
import { db, saveDocument, loadCollection, deleteDocument, COLLECTIONS } from './firebase';

export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

const CURRENT_USER_KEY = 'tradelink_current_user';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

function generateId(): string {
  return 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

let cachedUsers: User[] | null = null;

async function getUsersFromFirebase(): Promise<User[]> {
  if (cachedUsers) return cachedUsers;
  try {
    const data = await loadCollection<User>(COLLECTIONS.USERS);
    cachedUsers = data;
    return data;
  } catch { return []; }
}

function getUsersLocal(): User[] {
  try {
    const data = localStorage.getItem('tradelink_users');
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveUsersLocal(users: User[]) {
  localStorage.setItem('tradelink_users', JSON.stringify(users));
  cachedUsers = users;
}

export async function initDefaultAdmin(): Promise<void> {
  const users = await getUsersFromFirebase();
  if (users.length === 0) {
    const admin: User = {
      id: generateId(),
      username: 'admin',
      displayName: 'Administrateur',
      passwordHash: simpleHash('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    try {
      await saveDocument(COLLECTIONS.USERS, admin);
      cachedUsers = [admin];
    } catch {
      saveUsersLocal([admin]);
    }
  }
}

export function initDefaultAdminSync(): void {
  const users = getUsersLocal();
  if (users.length === 0) {
    const admin: User = {
      id: generateId(),
      username: 'admin',
      displayName: 'Administrateur',
      passwordHash: simpleHash('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    saveUsersLocal([admin]);
    // Also save to Firebase in background
    saveDocument(COLLECTIONS.USERS, admin).catch(() => {});
  }
}

export function login(username: string, password: string): User | null {
  initDefaultAdminSync();
  const users = getUsersLocal();
  const user = users.find(u => u.username === username && u.passwordHash === simpleHash(password));
  if (user) {
    user.lastLogin = new Date().toISOString();
    saveUsersLocal(users);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: user.id, username: user.username }));
    // Sync to Firebase in background
    saveDocument(COLLECTIONS.USERS, user).catch(() => {});
    return user;
  }
  return null;
}

export function loginAsDemo(): User {
  const demoUser: User = {
    id: 'demo', username: 'demo', displayName: 'Utilisateur Démo',
    passwordHash: '', role: 'viewer', createdAt: new Date().toISOString(),
  };
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: 'demo', username: 'demo' }));
  return demoUser;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem('tradelink_access');
  localStorage.removeItem('tradelink_demo');
}

export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    const { id } = JSON.parse(data);
    if (id === 'demo') return { id: 'demo', username: 'demo', displayName: 'Démo', passwordHash: '', role: 'viewer', createdAt: '' };
    const users = getUsersLocal();
    return users.find(u => u.id === id) || null;
  } catch { return null; }
}

export function getAllUsers(): User[] {
  return getUsersLocal().map(u => ({ ...u, passwordHash: '***' }));
}

export function createUser(username: string, displayName: string, password: string, role: 'admin' | 'user' | 'viewer'): User | null {
  const users = getUsersLocal();
  if (users.find(u => u.username === username)) return null;
  const newUser: User = {
    id: generateId(), username, displayName,
    passwordHash: simpleHash(password), role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsersLocal(users);
  // Sync to Firebase in background
  saveDocument(COLLECTIONS.USERS, newUser).catch(() => {});
  return { ...newUser, passwordHash: '***' };
}

export function deleteUser(userId: string): boolean {
  if (userId === 'demo') return false;
  const users = getUsersLocal();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveUsersLocal(filtered);
  // Delete from Firebase in background
  deleteDocument(COLLECTIONS.USERS, userId).catch(() => {});
  return true;
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
  const users = getUsersLocal();
  const user = users.find(u => u.id === userId);
  if (!user || user.passwordHash !== simpleHash(oldPassword)) return false;
  user.passwordHash = simpleHash(newPassword);
  saveUsersLocal(users);
  saveDocument(COLLECTIONS.USERS, user).catch(() => {});
  return true;
}

export function resetPassword(userId: string, newPassword: string): boolean {
  const users = getUsersLocal();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  user.passwordHash = simpleHash(newPassword);
  saveUsersLocal(user);
  saveDocument(COLLECTIONS.USERS, user).catch(() => {});
  return true;
}

export function hasPermission(permission: 'create' | 'edit' | 'delete' | 'view'): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'user') return permission !== 'delete';
  return permission === 'view';
}
