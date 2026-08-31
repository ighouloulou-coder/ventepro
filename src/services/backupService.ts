// Backup Service - Auto backup to Firebase
import { db, saveDocument, loadCollection, COLLECTIONS } from './firebase';
import { productStorage, clientStorage, invoiceStorage, quoteStorage, orderStorage, deliveryStorage } from './storage';

export interface BackupData {
  id: string;
  name: string;
  timestamp: string;
  products: any[];
  clients: any[];
  invoices: any[];
  quotes: any[];
  orders: any[];
  deliveries: any[];
  size: string;
}

const BACKUP_KEY = 'tradelink_backups';
const AUTO_BACKUP_KEY = 'tradelink_auto_backup_interval';

function generateId(): string {
  return 'bkp_' + Date.now().toString(36);
}

function getBackupsLocal(): BackupData[] {
  try {
    const data = localStorage.getItem(BACKUP_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveBackupsLocal(backups: BackupData[]) {
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(-20)));
}

export async function createBackup(name?: string): Promise<BackupData> {
  const products = productStorage.getAll();
  const clients = clientStorage.getAll();
  const invoices = invoiceStorage.getAll();
  const quotes = quoteStorage.getAll();
  const orders = orderStorage.getAll();
  const deliveries = deliveryStorage.getAll();
  
  const backup: BackupData = {
    id: generateId(),
    name: name || 'Backup ' + new Date().toLocaleDateString('fr-FR'),
    timestamp: new Date().toISOString(),
    products, clients, invoices, quotes, orders, deliveries,
    size: JSON.stringify({ products, clients, invoices, quotes, orders, deliveries }).length + ' bytes',
  };
  
  const backups = getBackupsLocal();
  backups.push(backup);
  saveBackupsLocal(backups);
  
  // Sync to Firebase
  try {
    await saveDocument(COLLECTIONS.BACKUPS, backup as any);
  } catch {}
  
  return backup;
}

export function getBackups(): BackupData[] {
  return getBackupsLocal().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function loadBackupsFromFirebase(): Promise<BackupData[]> {
  try {
    const fbBackups = await loadCollection<BackupData>(COLLECTIONS.BACKUPS);
    if (fbBackups.length > 0) {
      saveBackupsLocal(fbBackups);
      return fbBackups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    }
    return getBackups();
  } catch { return getBackups(); }
}

export function restoreBackup(backupId: string): boolean {
  const backups = getBackupsLocal();
  const backup = backups.find(b => b.id === backupId);
  if (!backup) return false;
  
  try {
    if (backup.products.length) localStorage.setItem('tradelink_products', JSON.stringify(backup.products));
    if (backup.clients.length) localStorage.setItem('tradelink_clients', JSON.stringify(backup.clients));
    if (backup.invoices.length) localStorage.setItem('tradelink_invoices', JSON.stringify(backup.invoices));
    if (backup.quotes.length) localStorage.setItem('tradelink_quotes', JSON.stringify(backup.quotes));
    if (backup.orders.length) localStorage.setItem('tradelink_orders', JSON.stringify(backup.orders));
    if (backup.deliveries.length) localStorage.setItem('tradelink_deliveries', JSON.stringify(backup.deliveries));
    return true;
  } catch { return false; }
}

export function deleteBackup(backupId: string) {
  const backups = getBackupsLocal().filter(b => b.id !== backupId);
  saveBackupsLocal(backups);
}

export function exportBackupToFile(backupId: string) {
  const backups = getBackupsLocal();
  const backup = backups.find(b => b.id === backupId);
  if (!backup) return;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backup.name.replace(/[^a-zA-Z0-9]/g, '_') + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackupFromFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;
        backup.id = generateId();
        backup.timestamp = new Date().toISOString();
        const backups = getBackupsLocal();
        backups.push(backup);
        saveBackupsLocal(backups);
        saveDocument(COLLECTIONS.BACKUPS, backup as any).catch(() => {});
        resolve(true);
      } catch { resolve(false); }
    };
    reader.readAsText(file);
  });
}

// Auto-backup scheduler
let autoBackupTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoBackup(intervalMinutes: number = 60) {
  stopAutoBackup();
  localStorage.setItem(AUTO_BACKUP_KEY, String(intervalMinutes));
  autoBackupTimer = setInterval(() => {
    createBackup('Auto-backup');
  }, intervalMinutes * 60 * 1000);
}

export function stopAutoBackup() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
}

export function getAutoBackupInterval(): number {
  return parseInt(localStorage.getItem(AUTO_BACKUP_KEY) || '0');
}

export function initAutoBackup() {
  const interval = getAutoBackupInterval();
  if (interval > 0) startAutoBackup(interval);
}
