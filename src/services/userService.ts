// User Management Service
export interface User {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
}

const USERS_KEY = 'tradelink_users';
const CURRENT_USER_KEY = 'tradelink_current_user';

// Simple hash for demo (not production-safe)
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

function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function initDefaultAdmin(): void {
  const users = getUsers();
  if (users.length === 0) {
    const admin: User = {
      id: generateId(),
      username: 'admin',
      displayName: 'Administrateur',
      passwordHash: simpleHash('admin123'),
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    saveUsers([admin]);
  }
}

export function login(username: string, password: string): User | null {
  initDefaultAdmin();
  const users = getUsers();
  const user = users.find(u => u.username === username && u.passwordHash === simpleHash(password));
  if (user) {
    user.lastLogin = new Date().toISOString();
    saveUsers(users);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ id: user.id, username: user.username }));
    return user;
  }
  return null;
}

export function loginAsDemo(): User {
  const demoUser: User = {
    id: 'demo',
    username: 'demo',
    displayName: 'Utilisateur Démo',
    passwordHash: '',
    role: 'viewer',
    createdAt: new Date().toISOString(),
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
    const users = getUsers();
    return users.find(u => u.id === id) || null;
  } catch { return null; }
}

export function getAllUsers(): User[] {
  return getUsers().map(u => ({ ...u, passwordHash: '***' }));
}

export function createUser(username: string, displayName: string, password: string, role: 'admin' | 'user' | 'viewer'): User | null {
  const users = getUsers();
  if (users.find(u => u.username === username)) return null;
  const newUser: User = {
    id: generateId(),
    username,
    displayName,
    passwordHash: simpleHash(password),
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { ...newUser, passwordHash: '***' };
}

export function deleteUser(userId: string): boolean {
  if (userId === 'demo') return false;
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || user.passwordHash !== simpleHash(oldPassword)) return false;
  user.passwordHash = simpleHash(newPassword);
  saveUsers(users);
  return true;
}

export function resetPassword(userId: string, newPassword: string): boolean {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  user.passwordHash = simpleHash(newPassword);
  saveUsers(users);
  return true;
}

export function hasPermission(permission: 'create' | 'edit' | 'delete' | 'view'): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'user') return permission !== 'delete';
  return permission === 'view';
}
