// Preuve positive : documents chargés depuis Firestore après login
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const logs = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
page.on('console', (m) => logs.push(m.text()));

await page.goto(BASE + '/login', { waitUntil: 'load', timeout: 45000 });
const userField = page.locator('input[autocomplete="username"]');
await userField.waitFor({ state: 'visible', timeout: 20000 });
await userField.fill('ISMAIL');
await page.locator('input[autocomplete="current-password"]').fill('2024');
await page.getByRole('button', { name: /Se connecter/i }).click();
await page.waitForTimeout(12000);

const loaded = logs.filter((t) => t.includes('docs chargés depuis Firestore') || t.includes('Session Firebase ouverte') || t.includes('démarrage de la synchro'));
for (const l of loaded.slice(0, 25)) console.log('✓', l);
if (loaded.length === 0) {
  console.log('❌ Aucun chargement Firestore détecté — logs clés :');
  for (const l of logs.filter(t => t.includes('SYNC') || t.includes('Firebase')).slice(0, 15)) console.log('   ', l);
} else {
  // Les produits sont-ils dans localStorage ?
  const n = await page.evaluate(() => JSON.parse(localStorage.getItem('tradelink_products') || '[]').length);
  console.log(`\n📈 tradelink_products en localStorage : ${n} documents`);
  const n2 = await page.evaluate(() => JSON.parse(localStorage.getItem('tradelink_clients') || '[]').length);
  console.log(`📈 tradelink_clients en localStorage : ${n2} documents`);
}

await browser.close();
