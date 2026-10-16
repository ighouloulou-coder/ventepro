// Test E2E #3 : vérifier que le correctif fonctionne en local
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const errors = [];
const t0 = Date.now();
const stamp = () => `t+${(((Date.now() - t0) / 1000) | 0)}s`;
const loginT = 9; // ~ approx : les erreurs avant ce point = phases init/login

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`${stamp()} [console.error] ${m.text().slice(0, 180)}`);
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

console.log('=== 1) Login ISMAIL (doit ouvrir la session Firebase)');
await login();
await page.waitForTimeout(5000);
console.log(`${stamp()} URL: ${page.url()}`);
const body = (await page.locator('body').innerText()).slice(0, 300).replace(/\n/g, ' | ');
console.log(`${stamp()} body: ${body}`);

console.log('=== 2) page Produits — les données Firestore doivent se charger (pas d\'erreur permissions)');
await page.goto(BASE + '/products', { waitUntil: 'load' });
await page.waitForTimeout(8000);
await page.goto(BASE + '/clients', { waitUntil: 'load' });
await page.waitForTimeout(8000);
const permErrs = errors.filter((e) => e.includes('insufficient permissions'));
console.log(`${stamp()} Erreurs permissions pendant la session: ${permErrs.length}`);
console.log(`   'Firebase session ouverte' vu: ${errors.some((e)=>e.includes('Firebase'))}`);

console.log('=== 3) Logout → plus AUCUNE erreur Firestore ensuite');
await page.getByRole('button', { name: /Déconnexion/i }).first().click();
await page.waitForTimeout(6000);
const errorsAfterLogout = errors.filter(
  (e) => parseInt(e.slice(2)) > loginT + 41 && e.includes('permissions')
);
console.log(`${stamp()} URL: ${page.url()}`);
console.log(`${stamp()} Erreurs permissions après logout: ${errorsAfterLogout.length}`);

console.log(`=== 4) Re-login`);
await login();
await page.waitForTimeout(4000);
console.log(`${stamp()} URL 2e login: ${page.url()}`);

console.log(`\n=== ALL ERREURS (${errors.length}) — affichées Civil non-permission ===`);
const nonPerm = errors.filter((e) => !e.includes('insufficient permissions'));
for (const e of nonPerm.slice(0, 15)) console.log(' •', e);
for (const e of errorsAfterLogout.slice(0, 10)) console.log(' POST-LOGOUT •', e);

await browser.close();
