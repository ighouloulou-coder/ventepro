// ============================================
// 📥 IMPORT PRODUITS — depuis la base produits du projet Factures TRADE LINK
// ============================================
// Lit ../Facture TRADE LINK INTERNATIONALE/base_produits.json,
// supprime les doublons, et intègre chaque produit dans Firestore
// (collection tradelink_products) :
//   - price          = PU HT facturé le plus récent  → PRIX DE VENTE
//   - weightPerUnitKg = poids unitaire net (kg)
//   - priceMin / priceMax = plus bas / plus haut PU HT facturé
// Les produits existants (même nom, à singularisation près) sont conservés :
// seuls prix (si 0), poids (si absent) et prixMin/Max sont mis à jour.
// purchasePrice (prix d'achat) n'est JAMAIS déduit des factures de vente.
//
// Usage :
//   node import-produits.mjs --dry-run   # simulation (par défaut)
//   node import-produits.mjs --write     # import réel dans Firestore
// ============================================
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_PATH = join(__dirname, '..', 'Facture TRADE LINK INTERNATIONALE', 'base_produits.json');
const WRITE = process.argv.includes('--write');
const DRY_RUN = !WRITE;

const firebaseConfig = {
  apiKey: "AIzaSyDV6LdXrfQxZGv8KiDVTv7mbr1fz_VmUC0",
  authDomain: "ventepro-714f5.firebaseapp.com",
  projectId: "ventepro-714f5",
  storageBucket: "ventepro-714f5.firebasestorage.app",
  messagingSenderId: "213916622362",
  appId: "1:213916622362:web:fd219ffab51fc03892fba3",
};

// ============================================
// 🔑 Dédoublonnage : clé normalisée (sans accents, singulier, espaces unis)
// ============================================
function dedupKey(name) {
  let s = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  s = s.replace(/[^A-Z0-9]+/g, ' ').trim();
  // singularisation légère : "GANTS" -> "GANT" (fusionne les pluriels/féminins)
  s = s.split(' ').map(w => (w.length > 3 && w.endsWith('S') ? w.slice(0, -1) : w)).join(' ');
  return s;
}

function idFor(key) {
  return 'imp' + createHash('md5').update(key).digest('hex').slice(0, 12);
}

const round = (x, d = 4) => (x == null ? undefined : Math.round(x * 10 ** d) / 10 ** d);

// ============================================
// ▶️ Import
// ============================================
async function main() {
  console.log(`📥 IMPORT PRODUITS — ${DRY_RUN ? 'SIMULATION (dry-run)' : 'ÉCRITURE RÉELLE Firestore'}`);

  // 1. Base produits (factures)
  const base = JSON.parse(readFileSync(BASE_PATH, 'utf-8'));
  const entries = Object.entries(base);
  console.log(`📦 Base produits : ${entries.length} entrées brutes`);

  // 2. Dédoublonnage de la base elle-même (fusion des clés proches)
  const merged = new Map(); // key -> produit consolidé
  let fusionnes = 0;
  for (const [key, p] of entries) {
    const k = dedupKey(p.designation || key);
    const pu = p.pu_dernier ?? p.pu_moyen ?? null;
    if (!k || (p.type === 'service')) {
      fusionnes += (p.type === 'service') ? 1 : 0;
      if (!k) continue;
      continue; // services (frais livraison/transport…) exclus
    }
    const ex = merged.get(k);
    if (!ex) {
      merged.set(k, {
        key: k,
        name: p.designation,
        description: p.description || '',
        price: pu,
        priceMin: p.pu_min ?? undefined,
        priceMax: p.pu_max ?? undefined,
        weightPerUnitKg: p.poids_unitaire_kg ?? undefined,
        puDate: p.derniere_vue || '',
        nbFactures: (p.factures || []).length,
      });
    } else {
      fusionnes++;
      // garde le PU le plus récent, élargit min/max, complète poids/description
      if (pu && (p.derniere_vue || '') >= ex.puDate) { ex.price = pu; ex.puDate = p.derniere_vue || ex.puDate; }
      ex.priceMin = [ex.priceMin, p.pu_min].filter(v => v != null).sort((a, b) => a - b)[0] ?? undefined;
      ex.priceMax = [ex.priceMax, p.pu_max].filter(v => v != null).sort((a, b) => b - a)[0] ?? undefined;
      if (!ex.weightPerUnitKg && p.poids_unitaire_kg) ex.weightPerUnitKg = p.poids_unitaire_kg;
      if (!ex.description && p.description) ex.description = p.description;
      ex.nbFactures += (p.factures || []).length;
    }
  }
  console.log(`✅ Après dédoublonnage : ${merged.size} produits uniques (${fusionnes} doublons/services écartés)`);

  // 3. Auth (les règles Firestore exigent request.auth != null)
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const EMAIL = process.env.IMPORT_EMAIL;
  const PASSWORD = process.env.IMPORT_PASSWORD;
  try {
    if (EMAIL && PASSWORD) {
      const cred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
      console.log(`🔐 Authentifié : ${cred.user.email}`);
    } else {
      const cred = await signInAnonymously(auth);
      console.log(`🔐 Authentifié (anonyme) : ${cred.user.uid}`);
    }
  } catch (e) {
    console.error(`❌ Authentification impossible : ${e.code || e.message}`);
    if (EMAIL) {
      console.error('   → Vérifie IMPORT_EMAIL / IMPORT_PASSWORD (identifiants ERP).');
    } else {
      console.error('   → 1) Active Anonymous dans Firebase Console → Authentication → Sign-in method');
      console.error('   → 2) ou lance : IMPORT_EMAIL=ton@email IMPORT_PASSWORD=**** node import-produits.mjs --write');
    }
    process.exit(1);
  }
  const db = getFirestore(app);
  const snap = await getDocs(collection(db, 'tradelink_products'));
  const existants = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const existantsParCle = new Map(existants.map(p => [dedupKey(p.name), p]));
  console.log(`☁️ Firestore : ${existants.length} produit(s) existant(s)`);

  // 4. Merge + écriture
  let crees = 0, majPrix = 0, majPoids = 0, ignores = 0;
  for (const p of merged.values()) {
    const poids = round(p.weightPerUnitKg, 6);
    const price = round(p.price, 4);
    const ex = existantsParCle.get(p.key);
    if (ex) {
      const upd = {};
      if (!ex.price && price) { upd.price = price; }
      if (!ex.priceMin && p.priceMin != null) upd.priceMin = round(p.priceMin);
      if (!ex.priceMax && p.priceMax != null) upd.priceMax = round(p.priceMax);
      if (!ex.weightPerUnitKg && poids) upd.weightPerUnitKg = poids;
      if (Object.keys(upd).length === 0) { ignores++; continue; }
      if (upd.price) majPrix++;
      if (upd.weightPerUnitKg) majPoids++;
      console.log(`  ♻ ${ex.name} → ${JSON.stringify(upd)}`);
      if (!DRY_RUN) await setDoc(doc(db, 'tradelink_products', ex.id), upd, { merge: true });
    } else {
      crees++;
      const produit = {
        id: idFor(p.key),
        name: p.name,
        description: p.description,
        price: price ?? 0,          // PU HT facturé = prix de vente
        purchasePrice: 0,           // prix d'achat inconnu (non présent dans les factures de vente)
        margin: 0,
        stock: 0,
        category: '📦 Produit',
        unit: 'pièce',
        sku: '',
        photo: '',
        minStock: 5,
        weightPerUnitKg: poids,
        priceMin: round(p.priceMin),
        priceMax: round(p.priceMax),
        createdAt: new Date().toISOString(),
      };
      console.log(`  ➕ ${p.name} | vente ${price ?? '?'} MAD | ${poids ?? 'poids ?'} kg`);
      if (!DRY_RUN) await setDoc(doc(db, 'tradelink_products', produit.id), produit);
    }
  }

  console.log('\n===========================================');
  console.log(`✅ Terminé : ${crees} créé(s) · ${majPrix} prix mis à jour · ${majPoids} poids ajoutés · ${ignores} inchangé(s)`);
  if (DRY_RUN) console.log('ℹ Simulation — relance avec --write pour importer réellement.');
}

main().catch(e => { console.error('❌', e.message || e); process.exit(1); });
