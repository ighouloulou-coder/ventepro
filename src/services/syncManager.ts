import {
  saveDocument,
  deleteDocument,
  COLLECTIONS,
} from './firebase';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// ============================================
// 🔄 Sync Manager — Bridge localStorage ↔ Firestore
// ============================================

type Unsubscribe = () => void;

class SyncManager {
  private unsubscribeMap: Map<string, Unsubscribe> = new Map();
  private isOnline: boolean = navigator.onLine;
  private pendingSync: Map<string, string> = new Map();

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushPendingSync();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async save<T extends { id: string }>(
    collectionName: string,
    data: T,
    localStorageKey: string
  ): Promise<void> {
    const items = this.getLocalStorage<T>(localStorageKey);
    const index = items.findIndex((i) => i.id === data.id);
    if (index >= 0) {
      items[index] = data;
    } else {
      items.push(data);
    }
    this.setLocalStorage(localStorageKey, items);

    if (this.isOnline) {
      try {
        await saveDocument(collectionName, data);
      } catch (error) {
        this.pendingSync.set(data.id, collectionName);
      }
    } else {
      this.pendingSync.set(data.id, collectionName);
    }
  }

  async remove(
    collectionName: string,
    id: string,
    localStorageKey: string
  ): Promise<void> {
    const items = this.getLocalStorage<{ id: string }>(localStorageKey);
    const filtered = items.filter((i) => i.id !== id);
    this.setLocalStorage(localStorageKey, filtered);

    if (this.isOnline) {
      try {
        await deleteDocument(collectionName, id);
      } catch (error) {
        console.warn(`Suppression Firebase échouée:`, error);
      }
    }
  }

  startListening<T extends { id: string }>(
    collectionName: string,
    localStorageKey: string,
    onUpdate?: (data: T[]) => void
  ): void {
    if (this.unsubscribeMap.has(collectionName)) {
      return;
    }

    if (!db) return;

    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const data: T[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as T[];
        this.setLocalStorage(localStorageKey, data);
        onUpdate?.(data);
        window.dispatchEvent(
          new CustomEvent('data-sync', {
            detail: { collection: collectionName, data },
          })
        );
      }
    );

    this.unsubscribeMap.set(collectionName, unsubscribe);
  }

  stopAllListeners(): void {
    this.unsubscribeMap.forEach((unsub) => unsub());
    this.unsubscribeMap.clear();
  }

  private getLocalStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocalStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private async flushPendingSync(): Promise<void> {
    if (this.pendingSync.size === 0) return;

    for (const [id, collectionName] of this.pendingSync) {
      try {
        const localStorageKey = this.getStorageKeyForCollection(collectionName);
        if (localStorageKey) {
          const items = this.getLocalStorage<{ id: string }>(localStorageKey);
          const item = items.find((i) => i.id === id);
          if (item) {
            await saveDocument(collectionName, item);
          }
        }
      } catch (error) {
        console.warn(`Retry sync échoué pour ${id}:`, error);
      }
    }

    this.pendingSync.clear();
  }

  private getStorageKeyForCollection(col: string): string | null {
    const mapping: Record<string, string> = {
      [COLLECTIONS.PRODUCTS]: 'tradelink_products',
      [COLLECTIONS.CLIENTS]: 'tradelink_clients',
      [COLLECTIONS.INVOICES]: 'tradelink_invoices',
      [COLLECTIONS.QUOTES]: 'tradelink_quotes',
      [COLLECTIONS.ORDERS]: 'tradelink_orders',
      [COLLECTIONS.DELIVERIES]: 'tradelink_deliveries',
      [COLLECTIONS.PRICE_TIERS]: 'tradelink_price_tiers',
      [COLLECTIONS.SUPPLIERS]: 'tradelink_suppliers',
      [COLLECTIONS.SUPPLIER_ORDERS]: 'tradelink_supplier_orders',
      [COLLECTIONS.SUPPLIER_INVOICES]: 'tradelink_supplier_invoices',
      [COLLECTIONS.SUPPLIER_DELIVERIES]: 'tradelink_supplier_deliveries',
    };
    return mapping[col] || null;
  }
}

export const syncManager = new SyncManager();

export function initSync(): void {
  syncManager.startListening(COLLECTIONS.PRODUCTS, 'tradelink_products');
  syncManager.startListening(COLLECTIONS.CLIENTS, 'tradelink_clients');
  syncManager.startListening(COLLECTIONS.INVOICES, 'tradelink_invoices');
  syncManager.startListening(COLLECTIONS.QUOTES, 'tradelink_quotes');
  syncManager.startListening(COLLECTIONS.ORDERS, 'tradelink_orders');
  syncManager.startListening(COLLECTIONS.DELIVERIES, 'tradelink_deliveries');
  syncManager.startListening(COLLECTIONS.PRICE_TIERS, 'tradelink_price_tiers');
  syncManager.startListening(COLLECTIONS.SUPPLIERS, 'tradelink_suppliers');
  syncManager.startListening(COLLECTIONS.SUPPLIER_ORDERS, 'tradelink_supplier_orders');
  syncManager.startListening(COLLECTIONS.SUPPLIER_INVOICES, 'tradelink_supplier_invoices');
  syncManager.startListening(COLLECTIONS.SUPPLIER_DELIVERIES, 'tradelink_supplier_deliveries');
}
