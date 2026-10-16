// ============================================
// 📥 IMPORT PRODUITS VERS FIREBASE
// ============================================
// Importe la base de produits de base_produits.json vers Firestore
// Nécessite une session Firebase authentifiée
// ============================================
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import app from '../src/services/firebase.ts';
import BASE_PRODUITS from '../src/services/baseProduitsData.ts';

// Vérifier si Firebase est initialisé
if (!app) {
  console.error('❌ Firebase non initialisé');
  process.exit(1);
}

const db = getFirestore(app);
const COLLECTION = 'tradelink_products';

// Transformation des produits de la base embarquée vers le format Firestore
function transformerProduit(p) {
  // Récupérer le prix (pu_dernier ou pu_moyen)
  const price = p.pu_dernier || p.pu_moyen || 0;
  const weight = p.poids_unitaire_kg ?? null;
  const priceMin = p.pu_min ?? null;
  const priceMax = p.pu_max ?? null;
  
  const result = {
    id: 'imp' + Object.keys(p).join('').replace(/[^A-Z0-9]/g, '').slice(0, 16).padEnd(3, '0').toUpperCase(),
    name: p.designation,
    description: p.description || '',
    price: price ?? 0,
    purchasePrice: 0,
    margin: 0,
    stock: 0,
    category: '📦 Produit',
    unit: 'pièce',
    sku: '',
    photo: '',
    minStock: 5,
    createdAt: new Date().toISOString()
  };
  
  // Ajouter weightPerUnitKg seulement s'il a une valeur
  if (weight != null) {
    result.weightPerUnitKg = weight;
  }
  // Ajouter priceMin seulement s'il a une valeur
  if (priceMin != null) {
    result.priceMin = priceMin;
  }
  // Ajouter priceMax seulement s'il a une valeur
  if (priceMax != null) {
    result.priceMax = priceMax;
  }
  
  return result;
}

// Récupérer tous les produits de la base
const produitsEmbarques = Object.values(BASE_PRODUITS);
const produitsTransformes = produitsEmbarques
  .filter(p => p.type !== 'service') // exclure frais de livraison
  .map(transformerProduit);

console.log(`📦 ${produitsTransformes.length} produits à importer`);

// Vérifier ce qui existe déjà dans Firestore
async function verifierExistant() {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const existants = new Map();
    snapshot.forEach(d => {
      const data = d.data();
      if (data.name) {
        existants.set(data.name.toUpperCase(), d.id);
      }
    });
    console.log(`📋 ${existants.size} produit(s) déjà dans Firestore`);
    return existants;
  } catch (e) {
    console.error('❌ Erreur vérification Firestore:', e.message);
    return new Map();
  }
}

// Import en batchs
async function importerProduits(existants) {const CHUNK = 400; // limite Firestore : 500 opérations par batch
  const aCreer = produitsTransformes.filter(p => !existants.get(p.name.toUpperCase()));

  console.log(`➕ ${aCreer.length} nouveaux produits à créer`);

  let crees = 0;
  for (let i = 0; i < aCreer.length; i += CHUNK) {
    const lot = aCreer.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    
    for (const produit of lot) {
      const docRef = doc(db, COLLECTION, produit.id);
      batch.set(docRef, produit);
      crees++;
    }
    
    await batch.commit();
    console.log(`📦 Batch ${i/CHUNK + 1}: ${lot.length} produits créés`);
  }

  console.log(`✅ Import terminé : ${crees} produit(s) créé(s)`);
  
  // Marquer comme importé en localStorage (pour prochaine référence)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tradelink_autimport_produits_v1', '1');
      console.log('🏷️ Drapeau d\'importation défini en localStorage');
    }
  } catch (e) {
    console.warn('⚠️ Impossible de définir le drapeau localStorage (environnement Node)');
  }
}

// Lancer l'import
async function lancerImport() {
  console.log('🔄 Démarrage de l\'import de produits vers Firebase...');
  
  const existants = await verifierExistant();
  await importerProduits(existants);
  
  console.log('\\n✅ Import de produits vers Firebase terminé');
}

lancerImport().catch(e => {
  console.error('❌ Erreur fatale:', e.message);
  process.exit(1);
});