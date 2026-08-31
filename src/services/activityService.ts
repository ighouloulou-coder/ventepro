// Activity Logging Service - Firebase Sync
import { db, saveDocument, loadCollection, COLLECTIONS } from './firebase';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'view' | 'export' | 'approve' | 'reject';
  entity: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}

const ACTIVITY_KEY = 'tradelink_activity';
const LOGS_PER_PAGE = 50;

function generateId(): string {
  return 'act_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function getLogsLocal(): ActivityLog[] {
  try {
    const data = localStorage.getItem(ACTIVITY_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveLogsLocal(logs: ActivityLog[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(logs.slice(-500)));
}

export async function logActivity(
  userId: string,
  userName: string,
  action: ActivityLog['action'],
  entity: string,
  entityId?: string,
  details?: string
): Promise<void> {
  const log: ActivityLog = {
    id: generateId(),
    userId, userName, action, entity, entityId, details,
    timestamp: new Date().toISOString(),
  };
  
  const logs = getLogsLocal();
  logs.push(log);
  saveLogsLocal(logs);
  
  // Sync to Firebase in background
  saveDocument(COLLECTIONS.ACTIVITY, log as any).catch(() => {});
}

export function getLogsLocalSync(): ActivityLog[] {
  return getLogsLocal();
}

export async function loadLogsFromFirebase(): Promise<ActivityLog[]> {
  try {
    const fbLogs = await loadCollection<ActivityLog>(COLLECTIONS.ACTIVITY);
    if (fbLogs.length > 0) {
      saveLogsLocal(fbLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      return fbLogs;
    }
    return getLogsLocal();
  } catch { return getLogsLocal(); }
}

export function getRecentLogs(count: number = 20): ActivityLog[] {
  return getLogsLocal().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, count);
}

export function getLogsByUser(userId: string): ActivityLog[] {
  return getLogsLocal().filter(l => l.userId === userId);
}

export function getLogsByEntity(entity: string): ActivityLog[] {
  return getLogsLocal().filter(l => l.entity === entity);
}

export function getLogsStats() {
  const logs = getLogsLocal();
  const now = new Date();
  const today = logs.filter(l => {
    const d = new Date(l.timestamp);
    return d.toDateString() === now.toDateString();
  });
  const thisWeek = logs.filter(l => {
    const d = new Date(l.timestamp);
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });
  
  const actionCounts: Record<string, number> = {};
  logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });
  
  const userCounts: Record<string, number> = {};
  logs.forEach(l => { userCounts[l.userName] = (userCounts[l.userName] || 0) + 1; });
  
  const entityCounts: Record<string, number> = {};
  logs.forEach(l => { entityCounts[l.entity] = (entityCounts[l.entity] || 0) + 1; });
  
  return {
    total: logs.length,
    today: today.length,
    thisWeek: thisWeek.length,
    byAction: actionCounts,
    byUser: userCounts,
    byEntity: entityCounts,
  };
}

export function clearOldLogs(daysToKeep: number = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const logs = getLogsLocal().filter(l => new Date(l.timestamp) > cutoff);
  saveLogsLocal(logs);
}

// Auto-log helper for common actions
export function autoLog(action: ActivityLog['action'], entity: string, entityId?: string, details?: string) {
  const user = (() => {
    try {
      const data = localStorage.getItem('tradelink_current_user');
      if (!data) return null;
      return JSON.parse(data);
    } catch { return null; }
  })();
  if (user) {
    logActivity(user.id, user.username || 'Unknown', action, entity, entityId, details);
  }
}
