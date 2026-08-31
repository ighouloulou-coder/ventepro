import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { writeFileSync, mkdirSync } from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyDV6LdXrfQxZGv8KiDVTv7mbr1fz_VmUC0",
  authDomain: "ventepro-714f5.firebaseapp.com",
  projectId: "ventepro-714f5",
  storageBucket: "ventepro-714f5.firebasestorage.app",
  messagingSenderId: "213916622362",
  appId: "1:213916622362:web:fd219ffab51fc03892fba3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collections = [
  'tradelink_products',
  'tradelink_clients',
  'tradelink_invoices',
  'tradelink_quotes',
  'tradelink_orders',
  'tradelink_deliveries',
  'tradelink_price_tiers',
];

async function exportAll() {
  const backupDir = './backup-firestore';
  mkdirSync(backupDir, { recursive: true });

  for (const col of collections) {
    try {
      const snapshot = await getDocs(collection(db, col));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const filePath = `${backupDir}/${col}.json`;
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`✅ ${col}: ${data.length} documents exportés → ${filePath}`);
    } catch (e) {
      console.error(`❌ ${col}: erreur - ${e.message}`);
    }
  }
  console.log('\n📁 Backup terminé dans le dossier backup-firestore/');
}

exportAll();
