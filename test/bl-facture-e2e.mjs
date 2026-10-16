// Test E2E flux complet : BL direct → transfert individuel → transfert groupé multi-BL → facture
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('dialog', d => { console.log(`   [dialog] ${d.message().slice(0, 160)}`); d.accept(); });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));

// Login
await page.goto(BASE + '/login', { waitUntil: 'load', timeout: 45000 });
const f = page.locator('input[autocomplete="username"]');
await f.waitFor({ state: 'visible', timeout: 20000 });
await f.fill('ISMAIL');
await page.locator('input[autocomplete="current-password"]').fill('2024');
await page.getByRole('button', { name: /Se connecter/i }).click();
await page.waitForTimeout(6000); // splash + synchro Firestore

await page.goto(BASE + '/deliveries', { waitUntil: 'load' });
await page.waitForTimeout(3000);

// Prérequis : client + produit
const ctx = await page.evaluate(() => ({
  clients: JSON.parse(localStorage.getItem('tradelink_clients') || '[]').length,
  products: JSON.parse(localStorage.getItem('tradelink_products') || '[]').length,
}));
console.log('Prérequis — clients:', ctx.clients, '| produits:', ctx.products);
if (ctx.clients === 0 || ctx.products === 0) {
  console.log('❌ Pas de client ou produit initial (sync Firestore ?) — test interrompu');
  await browser.close();
  process.exit(1);
}

console.log('=== 1) Créer BL direct (client + produit + date)');
await page.getByRole('button', { name: /Nouveau Bon de Livraison/i }).click();
await page.waitForTimeout(800);
// mode "direct" est coché par défaut : sélectionner client
await page.locator('.modal select').first().selectOption({ index: 1 });
await page.getByRole('button', { name: /Ajouter un produit/i }).click();
await page.locator('.modal .detail-table select').first().selectOption({ index: 1 });
await page.locator('.modal .detail-table input[type="number"]').first().fill('3');
// date par défaut = aujourd'hui ; créer
await page.getByRole('button', { name: /Créer le Bon/i }).click();
await page.waitForTimeout(1000);
const rows = await page.locator('.data-table tbody tr').count();
console.log(`   Lignes BL dans le tableau : ${rows}`);

console.log('=== 2) Créer un 2e BL direct (même client)');
await page.getByRole('button', { name: /Nouveau Bon de Livraison/i }).click();
await page.waitForTimeout(800);
await page.locator('.modal select').first().selectOption({ index: 1 });
await page.getByRole('button', { name: /Ajouter un produit/i }).click();
await page.locator('.modal .detail-table select').first().selectOption({ index: 1 });
await page.locator('.modal .detail-table input[type="number"]').first().fill('2');
await page.getByRole('button', { name: /Créer le Bon/i }).click();
await page.waitForTimeout(1000);

console.log("=== 3) Transfert individuel d'un BL → facture (bouton 🧾 d'une ligne non facturée)");
await page.locator('.data-table tbody tr button[title="Transférer vers facture"]:not([disabled])').first().click();
await page.waitForTimeout(1500);
let fac = await page.evaluate(() => JSON.parse(localStorage.getItem('tradelink_invoices') || '[]').length);
console.log(`   Factures après transfert 1 : ${fac} (attendu >= 1)`);

console.log('=== 4) Transfert groupé BL#2 → facture (case à cocher puis bouton groupé)');
// La 1re ligne est déjà facturée (badge ✅, pas de case) → prendre une ligne non facturée
const unchecked = page.locator('.data-table tbody tr input[type="checkbox"]:not(:disabled)');
await unchecked.first().check();
await page.getByRole('button', { name: /Transférer \d+ BL/i }).click();
await page.waitForTimeout(1500);
fac = await page.evaluate(() => JSON.parse(localStorage.getItem('tradelink_invoices') || '[]').length);
const bls = await page.evaluate(() => JSON.parse(localStorage.getItem('tradelink_deliveries') || '[]').map(d => ({ s: d.id.slice(0, 8), fac: d.transferredToInvoice?.slice(0, 8) ?? null, st: d.status, items: d.items.map(i => i.quantity) })));
console.log(`   Factures après transfert 2 : ${fac} (attendu >= 2)`);
console.log('   État des BL :', JSON.stringify(bls));

console.log('=== 5) Page Factures : la facture transferée est-elle visible ?');
await page.goto(BASE + '/invoices', { waitUntil: 'load' });
await page.waitForTimeout(4000);
const invText = (await page.locator('body').innerText()).replace(/\n/g, ' | ');
console.log('   Factures visibles dans la page :', invText.slice(0, 260));

console.log(`\nErreurs console : ${errors.length}`);
for (const e of errors.slice(0, 10)) console.log(' •', e);

await browser.close();
