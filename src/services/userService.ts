// User Management Service - Firebase Sync
import { COLLECTIONS } from './firebase';
import { syncToFirestore, deleteFromFirestore, loadCollection, getFromStorage, saveToStorage } from './firebaseSync';

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
const USERS_KEY = 'tradelink_users';

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

function getUsersLocal(): User[] {
  return getFromStorage<User>(USERS_KEY);
}

function saveUsersLocal(users: User[]) {
  saveToStorage(USERS_KEY, users);
}

export async function initDefaultAdmin(): Promise<void> {
  const users = getUsersLocal();
  if (users.length === 0) {
    const admin: User = {
      id: generateId(), username: 'admin', displayName: 'Administrateur',
      passwordHash: simpleHash('admin123'), role: 'admin',
      createdAt: new Date().toISOString(),
    };
    saveUsersLocal([admin]);
    syncToFirestore(COLLECTIONS.USERS, admin, USERS_KEY);
  }
}

export function initDefaultAdminSync(): void {
  const users = getUsersLocal();
  if (users.length === 0) {
    const admin: User = {
      id: generateId(), username: 'admin', displayName: 'Administrateur',
      passwordHash: simpleHash('admin123'), role: 'admin',
      createdAt: new Date().toISOString(),
    };
    saveUsersLocal([admin]);
    syncToFirestore(COLLECTIONS.USERS, admin, USERS_KEY);
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
    syncToFirestore(COLLECTIONS.USERS, user, USERS_KEY);
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
  syncToFirestore(COLLECTIONS.USERS, newUser, USERS_KEY);
  return { ...newUser, passwordHash: '***' };
}

export function deleteUser(userId: string): boolean {
  if (userId === 'demo') return false;
  const users = getUsersLocal();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveUsersLocal(filtered);
  deleteFromFirestore(COLLECTIONS.USERS, userId);
  return true;
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
  const users = getUsersLocal();
  const user = users.find(u => u.id === userId);
  if (!user || user.passwordHash !== simpleHash(oldPassword)) return false;
  user.passwordHash = simpleHash(newPassword);
  saveUsersLocal(users);
  syncToFirestore(COLLECTIONS.USERS, user, USERS_KEY);
  return true;
}

export function resetPassword(userId: string, newPassword: string): boolean {
  const users = getUsersLocal();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  user.passwordHash = simpleHash(newPassword);
  saveUsersLocal(users);
  syncToFirestore(COLLECTIONS.USERS, user, USERS_KEY);
  return true;
}

export function hasPermission(permission: 'create' | 'edit' | 'delete' | 'view'): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'user') return permission !== 'delete';
  return permission === 'view';
}
