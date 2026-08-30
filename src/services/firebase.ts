import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

// ============================================
// 🔥 Config Firebase — TRADE LINK INTERNATIONALE
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyDemo_TradeLink_2024",
  authDomain: "tradelink-internationale.firebaseapp.com",
  projectId: "tradelink-internationale",
  storageBucket: "tradelink-internationale.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Activer la persistance offline
enableIndexedDbPersistence(db).catch(() => {});

export { db };

// ============================================
// 🔄 Sync Service — temps réel avec Firestore
// ============================================

export interface SyncCallbacks<T> {
  onUpdate: (data: T[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Écouter une collection en temps réel
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  callbacks: SyncCallbacks<T>
): () => void {
  const collectionRef = collection(db, collectionName);

  const unsubscribe = onSnapshot(
    collectionRef,
    (snapshot: any) => {
      const data = snapshot.docs.map((d: any) => ({
        id: d.id,
        ...d.data(),
      })) as T[];
      callbacks.onUpdate(data);
    },
    (error: any) => {
      console.error(`Erreur sync ${collectionName}:`, error);
      callbacks.onError?.(error);
    }
  );

  return unsubscribe;
}

/**
 * Sauvegarder un document
 */
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  document: T
): Promise<void> {
  const docRef = doc(db, collectionName, document.id);
  await setDoc(docRef, document);
}

/**
 * Supprimer un document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

/**
 * Charger tous les documents (une seule fois)
 */
export async function loadCollection<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
  })) as T[];
}

// ============================================
// 🗂️ Noms des collections Firestore
// ============================================
export const COLLECTIONS = {
  PRODUCTS: 'tradelink_products',
  CLIENTS: 'tradelink_clients',
  INVOICES: 'tradelink_invoices',
  QUOTES: 'tradelink_quotes',
  ORDERS: 'tradelink_orders',
  DELIVERIES: 'tradelink_deliveries',
  PRICE_TIERS: 'tradelink_price_tiers',
  SUPPLIERS: 'tradelink_suppliers',
  SUPPLIER_ORDERS: 'tradelink_supplier_orders',
  SUPPLIER_INVOICES: 'tradelink_supplier_invoices',
  SUPPLIER_DELIVERIES: 'tradelink_supplier_deliveries',
} as const;

export default app;
