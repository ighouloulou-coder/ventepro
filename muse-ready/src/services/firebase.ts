// 🔥 Config Firebase — À remplacer par vos identifiants réels
// Ne JAMAIS commits de clés réelles dans le repo public
// Utilisez des variables d'environnement ou un fichier de configuration sécurisé

const firebaseConfig = {
  apiKey: "VOTRE_CLE_API_ICI",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.firebasestorage.app",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "1:VOTRE_APP_ID:web:VOTRE_WEB_ID",
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
// 📋 Noms des collections
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
  USERS: 'tradelink_users',
  SETTINGS: 'tradelink_settings',
  WORKFLOWS: 'tradelink_workflows',
  ACTIVITY: 'tradelink_activity',
  BACKUPS: 'tradelink_backups',
} as const;

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
