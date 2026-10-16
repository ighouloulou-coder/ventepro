// ============================================
// 🔥 FIREBASE SYNC - Service unifié pour TOUS les data
// ============================================
import { db, loadCollection, saveDocument, deleteDocument, COLLECTIONS } from './firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

// ============================================
// 📦 Toutes les collections à synchroniser
// ============================================
const ALL_COLLECTIONS = [
  // Core business
  { collection: COLLECTIONS.PRODUCTS, key: 'tradelink_products', label: 'Produits' },
  { collection: COLLECTIONS.CLIENTS, key: 'tradelink_clients', label: 'Clients' },
  { collection: COLLECTIONS.INVOICES, key: 'tradelink_invoices', label: 'Factures' },
  { collection: COLLECTIONS.QUOTES, key: 'tradelink_quotes', label: 'Devis' },
  { collection: COLLECTIONS.ORDERS, key: 'tradelink_orders', label: 'Commandes' },
  { collection: COLLECTIONS.DELIVERIES, key: 'tradelink_deliveries', label: 'Livraisons' },
  { collection: COLLECTIONS.PRICE_TIERS, key: 'tradelink_price_tiers', label: 'Grilles tarifaires' },
  
  // Suppliers
  { collection: COLLECTIONS.SUPPLIERS, key: 'tradelink_suppliers', label: 'Fournisseurs' },
  { collection: COLLECTIONS.SUPPLIER_ORDERS, key: 'tradelink_supplier_orders', label: 'Commandes fournisseurs' },
  { collection: COLLECTIONS.SUPPLIER_INVOICES, key: 'tradelink_supplier_invoices', label: 'Factures fournisseurs' },
  { collection: COLLECTIONS.SUPPLIER_DELIVERIES, key: 'tradelink_supplier_deliveries', label: 'Livraisons fournisseurs' },
  
  // Users & Settings
  { collection: COLLECTIONS.USERS, key: 'tradelink_users', label: 'Utilisateurs' },
  { collection: COLLECTIONS.SETTINGS, key: 'tradelink_settings', label: 'Paramètres' },
  
  // Communication & Activity
  { collection: COLLECTIONS.WORKFLOWS, key: 'tradelink_workflows', label: 'Workflows' },
  { collection: COLLECTIONS.ACTIVITY, key: 'tradelink_activity', label: 'Journal d\'activité' },
  { collection: COLLECTIONS.BACKUPS, key: 'tradelink_backups', label: 'Sauvegardes' },
];

// ============================================
// 🗄️ LocalStorage helpers
// ============================================
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================
// 🔄 Dispatch custom event pour sync UI
// ============================================
function dispatchSyncEvent(collectionName: string) {
  window.dispatchEvent(new CustomEvent('data-sync', { 
    detail: { collection: collectionName, timestamp: Date.now() } 
  }));
}

// ============================================
// ☁️ CHARGEMENT depuis Firestore
// ============================================
async function loadCollectionFromFirestore(colName: string, storageKey: string): Promise<boolean> {
  if (!db) {
    console.error(`❌ [${colName}] Firebase db est null !`);
    return false;
  }
  
  // ⛔ Pas de lecture Firestore sans session Firebase : évite tout le spam
  // « Missing or insufficient permissions » et les requêtes qui échouent en boucle.
  const auth = getAuth();
  if (!auth.currentUser) {
    return false;
  }
  
  try {
    const data = await loadCollection<any>(colName);
    saveToStorage(storageKey, data);
    console.log(`✅ [${colName}] ${data.length} documents chargés depuis Firestore`);
    return true;
  } catch (e: any) {
    console.error(`❌ [${colName}] Erreur chargement:`, e.message || e);
    return false;
  }
}

// ============================================
// 💾 ÉCRITURE vers Firestore (avec fallback localStorage)
// ============================================
export async function syncToFirestore<T extends { id: string }>(
  collectionName: string, 
  data: T, 
  _storageKey: string
): Promise<void> {
  if (!db) {
    console.error(`❌ [SAVE] Firebase db null ! Sauvegarde locale uniquement`);
    return;
  }
  
  // ⛔ Pas d'écriture Firestore sans session Firebase (sinon permissions en boucle)
  if (!getAuth().currentUser) {
    return;
  }
  
  try {
    await saveDocument(collectionName, data);
    console.log(`✅ [SAVE] ${collectionName}/${data.id} sauvegardé dans Firestore`);
  } catch (e: any) {
    console.error(`❌ [SAVE] Erreur ${collectionName}:`, e.message || e);
  }
}

export async function deleteFromFirestore(
  collectionName: string, 
  id: string
): Promise<void> {
  if (!db) return;
  if (!getAuth().currentUser) return;
  
  try {
    await deleteDocument(collectionName, id);
    console.log(`✅ [DELETE] ${collectionName}/${id} supprimé de Firestore`);
  } catch (e: any) {
    console.error(`❌ [DELETE] Erreur ${collectionName}:`, e.message || e);
  }
}

// ============================================
// 🚀 CHARGEMENT INITIAL de TOUTES les collections
// ============================================
async function loadAllCollections(): Promise<void> {
  console.log('☁️ === CHARGEMENT COMPLET DEPUIS FIRESTORE ===');
  
  let ok = 0;
  let fail = 0;
  
  for (const col of ALL_COLLECTIONS) {
    if (await loadCollectionFromFirestore(col.collection, col.key)) {
      ok++;
      dispatchSyncEvent(col.collection);
    } else {
      fail++;
    }
  }
  
  console.log(`☁️ === CHARGEMENT TERMINÉ : ${ok} OK, ${fail} ÉCHEC ===`);
}

// ============================================
// ⏰ POLLING : Recharger TOUTES les 30 secondes
// ============================================
let isPolling = false;

async function pollAllCollections(): Promise<void> {
  if (isPolling) return;
  isPolling = true;
  
  try {
    for (const col of ALL_COLLECTIONS) {
      if (await loadCollectionFromFirestore(col.collection, col.key)) {
        dispatchSyncEvent(col.collection);
      }
    }
  } finally {
    isPolling = false;
  }
}

// ============================================
// 🔄 SYNCHRONISATION EN TEMPS RÉEL (optionnel - écoute les changements)
// ============================================
let unsubscribers: (() => void)[] = [];

export function startRealtimeSync(): void {
  if (!db) {
    console.warn('⚠️ Firebase non initialisé pour le sync temps réel');
    return;
  }
  
  console.log('🔄 Démarrage de la synchronisation temps réel...');
  
  for (const col of ALL_COLLECTIONS) {
    try {
      const colRef = collection(db, col.collection);
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const data = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        saveToStorage(col.key, data);
        dispatchSyncEvent(col.collection);
        console.log(`🔄 [REALTIME] ${col.collection}: ${data.length} documents mis à jour`);
      }, (error) => {
        console.error(`❌ [REALTIME] Erreur ${col.collection}:`, error.message);
      });
      
      unsubscribers.push(unsubscribe);
    } catch (e: any) {
      console.error(`❌ [REALTIME] Impossible d'écouter ${col.collection}:`, e.message);
    }
  }
}

export function stopRealtimeSync(): void {
  unsubscribers.forEach(unsub => unsub());
  unsubscribers = [];
  console.log('⏹️ Synchronisation temps réel arrêtée');
}

// ============================================
// 🚀 INITIALISATION PILOTÉE PAR L'ÉTAT D'AUTHENTIFICATION
// ============================================
// Avant : le module chargeait TOUT + un listener temps réel + un polling 30 s
// dès l'import, même déconnecté → pluie d'erreurs « insufficient permissions »
// et impression que « la page bug » (notamment après une déconnexion).
// Désormais : tout démarre UNIQUEMENT quand une session Firebase existe,
// et tout s'arrête proprement à la déconnexion (logout).
let pollingTimer: ReturnType<typeof setInterval> | null = null;

function demarrerSyncFirebase(): void {
  if (pollingTimer) return; // déjà en route
  console.log('🔄 [SYNC] Session Firebase active → démarrage de la synchro');
  void loadAllCollections();
  pollingTimer = setInterval(pollAllCollections, 30000);
  startRealtimeSync();
}

function arreterSyncFirebase(): void {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    stopRealtimeSync();
    console.log('⏹️ [SYNC] Session Firebase absente → synchro stoppée');
  }
}

(async () => {
  console.log('🔥 Firebase db:', db ? 'OK' : 'NULL !');
  
  try {
    const authModule = getAuth();
    onAuthStateChanged(authModule, (user) => {
      if (user) {
        demarrerSyncFirebase();
      } else {
        arreterSyncFirebase();
      }
    });
  } catch (e: any) {
    console.error('❌ [SYNC] Firebase Auth indisponible :', e?.message || e);
  }
})();

// ============================================
// 📤 Fonctions utilitaires pour les autres services
// ============================================
export function getSyncStatus(): { total: number; synced: number; failed: number } {
  let synced = 0;
  let failed = 0;
  
  for (const col of ALL_COLLECTIONS) {
    const data = getFromStorage(col.key);
    if (data.length > 0 || db) {
      synced++;
    } else {
      failed++;
    }
  }
  
  return {
    total: ALL_COLLECTIONS.length,
    synced,
    failed
  };
}

export function forceReloadAll(): Promise<void> {
  return loadAllCollections();
}

export { ALL_COLLECTIONS, getFromStorage, saveToStorage, loadCollection };
