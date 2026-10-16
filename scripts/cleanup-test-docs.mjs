// Nettoyage : supprime uniquement les documents de test créés pendant les
// sessions E2E, identifiés par date de création récente et par signature.
// Usage : node scripts/cleanup-test-docs.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  initializeFirestore,
  getDocs,
  collection,
  deleteDoc,
  doc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDV6LdXrfQxZGv8KiDVTv7mbr1fz_VmUC0',
  authDomain: 'ventepro-714f5.firebaseapp.com',
  projectId: 'ventepro-714f5',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {});
const WINDOW_MS = 3 * 60 * 60 * 1000; // 3 h max avec les tests
const now = Date.now();

async function main() {
  await signInWithEmailAndPassword(auth, 'ismail@tradelink.app', '2024TL!26');
  console.log('🔑 Session de nettoyage ouverte');

  // 1) Factures de test : notes commence par « Transféré depuis »
  const invSnap = await getDocs(collection(db, 'tradelink_invoices'));
  let del = 0;
  for (const d of invSnap.docs) {
    const data = d.data();
    const t = new Date(data.createdAt || 0).getTime();
    if (typeof data.notes === 'string' && data.notes.startsWith('Transféré depuis') && now - t < WINDOW_MS) {
      await deleteDoc(doc(db, 'tradelink_invoices', d.id));
      del++;
      console.log(`🗑️  facture ${d.id.slice(0, 8)} (${data.total} MAD)`);
    }
  }
  console.log(`Factures de test supprimées : ${del}`);

  // 2) BL directs de test : sans commande + createdAt récent
  const delSnap = await getDocs(collection(db, 'tradelink_deliveries'));
  let del2 = 0;
  for (const d of delSnap.docs) {
    const data = d.data();
    const t = new Date(data.createdAt || 0).getTime();
    const sansCommande = !data.orderId;
    if (sansCommande && now - t < WINDOW_MS) {
      await deleteDoc(doc(db, 'tradelink_deliveries', d.id));
      del2++;
      console.log(`🗑️  BL ${d.id.slice(0, 8)} (${data.clientName})`);
    }
  }
  console.log(`BL de test supprimés : ${del2}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('❌', e.code || e.message); process.exit(1); });
