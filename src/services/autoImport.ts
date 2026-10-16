// ============================================
// 📥 AUTO-IMPORT PRODUITS — base factures TRADE LINK
// ============================================
// Importe automatiquement les produits de la base factures (embarquée dans
// l'app) dans Firestore, UNE SEULE FOIS, dès qu'un utilisateur est connecté.
// - price = dernier PU HT facturé (prix de vente) — jamais le prix d'achat
// - weightPerUnitKg = poids unitaire net
// - fusion dédoublonnée, aucun écrasement des valeurs déjà présentes
// ============================================
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import app from './firebase';
import BASE_PRODUITS from './baseProduitsData';
import { Product } from '../types';

const db = getFirestore(app);
const COLLECTION = 'tradelink_products';
const FLAG = 'tradelink_autimport_produits_v1'; // déjà fait dans ce navigateur ?
const CHUNK = 400; // limite Firestore : 500 opérations par batch

// 🔑 Dédoublonnage : sans accents, singulier, espaces unis (mêmes règles partout)
export function dedupKey(name: string): string {
  let s = (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  s = s.replace(/[^A-Z0-9]+/g, ' ').trim();
  s = s.split(' ').map(w => (w.length > 3 && w.endsWith('S') ? w.slice(0, -1) : w)).join(' ');
  return s;
}

interface ProduitFusionne {
  name: string; description: string; price: number | null;
  priceMin: number | null; priceMax: number | null;
  weight: number | null; date: string;
}

// ============================================
// 📦 Fusion dédoublonnée de la base embarquée (depuis les 237 factures PDF)
// ============================================
export function fusionnerBase(): Map<string, ProduitFusionne> {
  const merged = new Map<string, ProduitFusionne>();
  
  // Produits de la base embarquée (depuis les 237 factures PDF)
  for (const [key, p] of Object.entries(BASE_PRODUITS) as [string, any][]) {
    if (!p || p.type === 'service') continue; // frais livraison/transport exclus
    const k = dedupKey(p.designation || key);
    if (!k) continue;
    const pu: number | null = p.pu_dernier ?? p.pu_moyen ?? null;
    const ex = merged.get(k);
    if (!ex) {
      merged.set(k, {
        name: p.designation, description: p.description || '',
        price: pu,
        priceMin: p.pu_min ?? null, priceMax: p.pu_max ?? null,
        weight: p.poids_unitaire_kg ?? null, date: p.derniere_vue || '',
      });
    } else {
      if (pu && (p.derniere_vue || '') >= ex.date) { ex.price = pu; ex.date = p.derniere_vue || ex.date; }
      const mins = [ex.priceMin, p.pu_min].filter((v): v is number => v != null);
      const maxs = [ex.priceMax, p.pu_max].filter((v): v is number => v != null);
      ex.priceMin = mins.length ? Math.min(...mins) : null;
      ex.priceMax = maxs.length ? Math.max(...maxs) : null;
      if (!ex.weight && p.poids_unitaire_kg) ex.weight = p.poids_unitaire_kg;
      if (!ex.description && p.description) ex.description = p.description;
    }
  }
  
  return merged;
}

// ============================================
// 📦 Fusion dédoublonnée des produits Excel
// ============================================
export async function fusionnerBaseExcel(): Promise<Map<string, ProduitFusionne>> {
  // Lecture du fichier JSON des produits Excel
  const res = await fetch('/base_produits_excel.json', { cache: 'no-store' });
  if (!res.ok) {
    console.warn('⚠️ [AUTO-IMPORT] Impossible de charger base_produits_excel.json');
    return new Map();
  }
  const baseExcel = await res.json();
  
  const merged = new Map<string, ProduitFusionne>();
  
  for (const [, p] of Object.entries(baseExcel) as [string, any][]) {
    if (!p || !p.designation) continue;
    const k = dedupKey(p.designation);
    if (!k) continue;
    const poid = p.poids_unitaire_kg ?? null;
    const ex = merged.get(k);
    if (!ex) {
      merged.set(k, {
        name: p.designation, description: '',
        price: null, priceMin: null, priceMax: null,
        weight: poid, date: '',
      });
    } else {
      // Si ce produit n'a pas encore de poids, ajoute-le depuis Excel
      if (!ex.weight && poid) ex.weight = poid;
    }
  }
  
  return merged;
}

// ============================================
// 🚀 Import automatique (une fois, après authentification)
// ============================================
let enCours = false;

export async function autoImportProduits(_uid?: string): Promise<void> {
  if (enCours) return;
  enCours = true;
  try {
    if (localStorage.getItem(FLAG) === '1') return; // déjà importé ici

    // Fusionne la base embarquée + les produits Excel
    const produits = await fusionnerBaseExcel();
    console.log(`📥 [AUTO-IMPORT] ${produits.size} produits uniques à synchroniser…`);

    // Produits déjà dans Firestore (n'importe lequel utilisateur les voit)
    const snap = await getDocs(collection(db, COLLECTION));
    const existants = new Map<string, Product>();
    snap.docs.forEach(d => {
      const p = d.data() as Product;
      if (p?.name) existants.set(dedupKey(p.name), p);
    });
    console.log(`📥 [AUTO-IMPORT] ${existants.size} produit(s) déjà dans Firestore`);

    const batchUpdates: { id: string; upd: Partial<Product> }[] = [];
    const aCreer = [...produits.entries()].filter(([k, p]) => {
      const ex = existants.get(k);
      if (!ex) return true;
      // complète uniquement les champs manquants du produit existant
      const upd: Partial<Product> = {};
      if (!ex.price && p.price) upd.price = p.price;
      if (p.priceMin != null && (ex as any).priceMin == null) (upd as any).priceMin = p.priceMin;
      if (p.priceMax != null && (ex as any).priceMax == null) (upd as any).priceMax = p.priceMax;
      if (p.weight && !ex.weightPerUnitKg) upd.weightPerUnitKg = p.weight;
      if (Object.keys(upd).length) {
        batchUpdates.push({ id: ex.id, upd });
      }
      return false;
    });

    // --- créations (batchs de 400)
    let crees = 0;
    for (let i = 0; i < aCreer.length; i += CHUNK) {
      const lot = aCreer.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      for (const [k, p] of lot) {
        const produit: Product = {
          id: 'imp' + k.replace(/[^A-Z0-9]/g, '').slice(0, 16).padEnd(3, '0'),
          name: p.name,
          description: p.description,
          price: p.price ?? 0,        // PU HT facturé = prix de vente
          purchasePrice: 0,           // prix d'achat inconnu (factures de vente)
          margin: 0,
          stock: 0,
          category: '📦 Produit',
          unit: 'pièce',
          sku: '',
          photo: '',
          minStock: 5,
          weightPerUnitKg: p.weight ?? undefined,
          priceMin: p.priceMin ?? undefined,
          priceMax: p.priceMax ?? undefined,
          createdAt: new Date().toISOString(),
        };
        batch.set(doc(db, COLLECTION, produit.id), produit);
        crees++;
      }
      await batch.commit();
    }

    // --- mises à jour (batchs)
    for (let i = 0; i < batchUpdates.length; i += CHUNK) {
      const lot = batchUpdates.slice(i, i + CHUNK);
      const batch = writeBatch(db);
      for (const { id, upd } of lot) batch.update(doc(db, COLLECTION, id), upd);
      await batch.commit();
    }

    localStorage.setItem(FLAG, '1');
    console.log(`✅ [AUTO-IMPORT] Terminé : ${crees} créé(s), ${batchUpdates.length} mis à jour`);
    window.dispatchEvent(new CustomEvent('data-sync', { detail: { collection: COLLECTION } }));
  } catch (e: any) {
    console.warn('⚠️ [AUTO-IMPORT] échec (retentera à la prochaine connexion) :', e?.code || e?.message || e);
  } finally {
    enCours = false;
  }
}

// ============================================
// 🔍 Vérification manuelle (bouton, tests)
// ============================================
export async function verifierImport(): Promise<{ total: number; importes: number }> {
  const snap = await getDocs(collection(db, COLLECTION));
  const produits = await fusionnerBaseExcel();
  const dansCloud = new Set(snap.docs.map(d => dedupKey((d.data() as Product)?.name || '')));
  let importes = 0;
  produits.forEach((_, k) => { if (dansCloud.has(k)) importes++; });
  return { total: produits.size, importes };
}
