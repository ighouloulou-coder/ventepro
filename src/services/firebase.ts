import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
} from 'firebase/firestore';

// ============================================
// 🔥 Config Firebase — HARDCODÉ pour garantir le fonctionnement
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyDV6LdXrfQxZGv8KiDVTv7mbr1fz_VmUC0",
  authDomain: "ventepro-714f5.firebaseapp.com",
  projectId: "ventepro-714f5",
  storageBucket: "ventepro-714f5.firebasestorage.app",
  messagingSenderId: "213916622362",
  appId: "1:213916622362:web:fd219ffab51fc03892fba3",
};

// Initialiser Firebase
let app: any = null;
let db: any = null;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('🔥 Firebase OK - Projet:', firebaseConfig.projectId);
} catch (e: any) {
  console.error('❌ Erreur Firebase:', e.message);
}

export { db };

// ============================================
// 🔄 Save / Delete
// ============================================
export async function saveDocument<T extends { id: string }>(
  collectionName: string,
  document: T
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const docRef = doc(db, collectionName, document.id);
  await setDoc(docRef, document);
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  if (!db) throw new Error('Firebase non initialisé');
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

export async function loadCollection<T extends { id: string }>(
  collectionName: string
): Promise<T[]> {
  if (!db) throw new Error('Firebase non initialisé');
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((d: any) => ({
    id: d.id,
    ...d.data(),
  })) as T[];
}

// ============================================
// 🗂️ Noms des collections
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
  SETTINGS: 'tradelink_settings',
  USERS: 'tradelink_users',
  CHAT: 'tradelink_chat',
  WORKFLOWS: 'tradelink_workflows',
} as const;

// ============================================
// 📖 Read single document
// ============================================
export async function getDocument(
  collectionName: string,
  documentId: string
): Promise<any | null> {
  if (!db) throw new Error('Firebase non initialisé');
  const docRef = doc(db, collectionName, documentId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export default app;
