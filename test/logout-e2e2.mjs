// Test E2E #2 : horodatage des erreurs autour du logout + 2e login fiable
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const errors = [];
const t0 = Date.now();
const stamp = () => `t+${(((Date.now() - t0) / 1000) | 0)}s`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`${stamp()} [console.error] ${m.text().slice(0, 200)}`);
});
page.on('pageerror', (e) => errors.push(`${stamp()} [pageerror] ${e.message.slice(0, 300)}`));

async function login() {
  await page.goto(BASE + '/login', { waitUntil: 'load', timeout: 45000 });
  const userField = page.locator('input[autocomplete="username"]');
  await userField.waitFor({ state: 'visible', timeout: 20000 });
  await userField.fill('ISMAIL');
  await page.locator('input[autocomplete="current-password"]').fill('2024');
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForTimeout(1000);
}

console.log(`=== 1) login initial`);
await login();
await page.waitForTimeout(3500);
console.log(`${stamp()} URL: ${page.url()}`);
console.log(`${stamp()} body: ${(await page.locator('body').innerText()).slice(0, 80).replace(/\n/g, ' | ')}`);

// Aller sur une page qui déclenche Firestore (Produits) puis revenir Dashboard
console.log(`=== 2) visite page Produits (déclenche Firestore)`);
await page.goto(BASE + '/products', { waitUntil: 'load' });
await page.waitForTimeout(6000);

console.log(`=== 3) logout`);
await page.getByRole('button', { name: /Déconnexion/i }).first().click();
for (let i = 1; i <= 6; i++) {
  await page.waitForTimeout(2500);
  const blank = await page.evaluate(() => {
    const r = document.getElementById('root');
    return !r || r.childElementCount === 0;
  });
  console.log(`${stamp()} url=${page.url()} rootVide=${blank}`);
}

console.log(`=== 4) re-login (après splash complète)`);
await login();
await page.waitForTimeout(5000);
console.log(`${stamp()} URL après 2e login: ${page.url()}`);
console.log(`${stamp()} body: ${(await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' | ')}`);

console.log(`\n=== ERREURS (${errors.length}) autour des phases ===`);
console.log(`--- avant logout ---`);
for (const e of errors.filter((x) => x.startsWith('t+') && parseInt(x.slice(2)) < 15)) console.log(' •', e);
console.log(`--- après logout (t+~15s) ---`);
for (const e of errors.filter((x) => parseInt(x.slice(2)) >= 15)) console.log(' •', e);

await browser.close();
