// Harness de génération des PDF Ventepro (diagnostic avant/après correction).
// Stubs navigateur (localStorage/window/document) AVANT tout import de service.
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
(globalThis as any).CustomEvent = class { type: string; detail: any; constructor(t: string, o?: any) { this.type = t; this.detail = o?.detail; } };
(globalThis as any).dispatchEvent = () => true;
(globalThis as any).addEventListener = () => {};
(globalThis as any).removeEventListener = () => {};
(globalThis as any).window = globalThis;
(globalThis as any).document = {
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, click() {}, remove() {} }),
  body: { appendChild() {}, removeChild() {} },
  head: { appendChild() {} },
};

import { writeFileSync, mkdirSync, readFileSync } from 'fs';

const OUT = process.argv[2] || '/home/hatch/workspace/ventepro-deploy/scripts/pdf-check/before';
mkdirSync(OUT, { recursive: true });

// Patch jsPDF.save -> écriture fichier (le build navigateur utilise window.open)
const jspdfMod: any = await import('jspdf');
const jsPDF = jspdfMod.default.jsPDF || jspdfMod.jsPDF || jspdfMod.default;
const saveImpl = function (this: any, filename: string) {
  const buf = Buffer.from(this.output('arraybuffer'));
  writeFileSync(OUT + '/' + filename.replace(/\//g, '-'), buf);
  console.log('SAVED', filename, buf.length, 'octets');
};
if (jsPDF.API) jsPDF.API.save = saveImpl;
if (jsPDF.prototype) jsPDF.prototype.save = saveImpl;

// Firebase
const { initializeApp } = await import('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = await import('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
const env = Object.fromEntries(readFileSync('/home/hatch/workspace/ventepro-deploy/.env', 'utf-8').split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const cfg = { apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET, messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID, appId: env.VITE_FIREBASE_APP_ID };
const src = readFileSync('/home/hatch/workspace/ventepro-deploy/scripts/create-firebase-users.mjs', 'utf-8');
const users = [...src.matchAll(/email:\s*'([^']+)',\s*password:\s*'([^']+)'/g)].map(m => ({ email: m[1], password: m[2] }));
const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);
let logged = false;
for (const u of users) { try { await signInWithEmailAndPassword(auth, u.email, u.password); console.log('LOGIN OK', u.email); logged = true; break; } catch (e: any) { console.log('LOGIN FAIL', u.email, e.code); } }
if (!logged) { console.error('AUCUNE AUTH'); process.exit(1); }

const inv1118 = (await getDoc(doc(db, 'tradelink_invoices', 'INV26001118'))).data();
const inv1142 = (await getDoc(doc(db, 'tradelink_invoices', 'INV26001142'))).data();
const del = (await getDoc(doc(db, 'tradelink_deliveries', 'BL26001164'))).data();
const quotesSnap = await getDocs(collection(db, 'tradelink_quotes'));
const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const clientsSnap = await getDocs(collection(db, 'tradelink_clients'));
const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const invSnap = await getDocs(collection(db, 'tradelink_invoices'));
const allInvoices = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
console.log('invoices:', allInvoices.length, 'quotes:', quotes.length, 'clients:', clients.length);

const pdf: any = await import('/home/hatch/workspace/ventepro-deploy/src/services/pdfExport');
const pdfQ: any = await import('/home/hatch/workspace/ventepro-deploy/src/services/pdfQuoteExport');

const ONLY = (process.env.ONLY || '').split(',').filter(Boolean);
const want = (k: string) => ONLY.length === 0 || ONLY.includes(k);
if (want('inv1118')) pdf.exportInvoiceToPDF(inv1118);
if (want('inv1142')) pdf.exportInvoiceToPDF(inv1142);
if (want('bl')) pdf.exportDeliveryToPDF(del);
const q0: any = quotes[0];
const qClient: any = clients.find((c: any) => c.id === q0.clientId);
if (want('quote1')) pdfQ.generateQuotePDF(q0, qClient);
// Devis d'exemple réaliste SKF (non écrit en base) : 3 lignes, pour tester la mise en page
const skf: any = clients.find((c: any) => c.id === 'client-skf');
const sampleQuote: any = {
  id: 'DEV-EXEMPLE-SKF', clientId: 'client-skf', clientName: 'SKF Magnetic Mechatronics Maroc',
  items: [
    { productId: 'x', productName: 'Palette Europe 1er choix 1200x800mm', quantity: 63, unitPrice: 153, total: 9639, unit: 'pièce' },
    { productId: 'y', productName: 'Gants anti-coupures GDY741 taille 10', quantity: 324, unitPrice: 55, total: 17820, unit: 'pièce' },
    { productId: 'z', productName: 'Balance de précision BREHM BP6000', quantity: 2, unitPrice: 3160, total: 6320, unit: 'pièce' },
  ],
  subtotal: 33779, taxRate: 0, tax: 0, total: 33779, currency: 'MAD', status: 'envoyé',
  validUntil: '2026-12-05', notes: 'Livraison TAC1, Lot 173 Bis, Zone Franche, Tanger.', createdAt: '2026-11-05T00:00:00.000Z',
};
if (want('quote2')) pdfQ.generateQuotePDF(sampleQuote, skf);
if (want('recap')) pdf.exportAllInvoicesToPDF(allInvoices);
if (want('recapq')) pdfQ.generateAllQuotesPDF(quotes);
console.log('DONE');
process.exit(0);
