// Test E2E du flux login → logout sur l'ERP TRADE LINK
// Usage: node test/logout-e2e.mjs <baseURL>
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4173';
const errors = [];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push('[console.error] ' + m.text());
});
page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));

console.log('=== 1) Page de login : ' + BASE);
await page.goto(BASE + '/login', { waitUntil: 'load', timeout: 45000 });
await page.waitForTimeout(3000); // splash 2.8s gérée par App (si /), sur /login pas de splash

// Le formulaire est-il visible ?
const userField = page.locator('input[autocomplete="username"]');
await userField.waitFor({ state: 'visible', timeout: 15000 });

console.log('=== 2) Connexion ISMAIL/2024');
await userField.fill('ISMAIL');
await page.locator('input[autocomplete="current-password"]').fill('2024');
await page.getByRole('button', { name: /Se connecter/i }).click();
await page.waitForURL(BASE + '/**', { timeout: 20000 });
await page.waitForTimeout(3500); // splash
console.log('   URL après login :', page.url());
const bodyText1 = (await page.locator('body').innerText()).slice(0, 200);
console.log('   body>', bodyText1.replace(/\n/g, ' | '));

console.log('=== 3) Clic sur Déconnexion');
const logoutBtn = page.getByRole('button', { name: /Déconnexion|deconnexion|Sign Out/i }).first();
if (await logoutBtn.count() === 0) {
  console.log('   ❌ Bouton déconnexion introuvable');
} else {
  await logoutBtn.scrollIntoViewIfNeeded();
  await logoutBtn.click();
}

console.log('=== 4) Observation 12 s après le logout');
for (let i = 1; i <= 4; i++) {
  await page.waitForTimeout(3000);
  const url = page.url();
  const blank = await page.evaluate(() => {
    const root = document.getElementById('root');
    return !root || root.childElementCount === 0;
  });
  const txt = (await page.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' | ');
  console.log(`   t+${i * 3}s  url=${url}  rootVide=${blank}`);
  console.log(`      body> ${txt}`);
}

console.log('=== 5) Second login après le logout (vérif absence de blocage)');
await page.goto(BASE + '/login', { waitUntil: 'load' });
await page.waitForTimeout(2000);
const again = page.locator('input[autocomplete="username"]');
if (await again.count() === 0) {
  console.log('   ❌ Retour à l\'app au lieu du login ? URL =', page.url());
} else {
  await again.fill('ISMAIL');
  await page.locator('input[autocomplete="current-password"]').fill('2024');
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForTimeout(5000);
  console.log('   URL après 2e login :', page.url());
  const txt = (await page.locator('body').innerText()).slice(0, 100).replace(/\n/g, ' | ');
  console.log('   body>', txt);
}

console.log('\n=== ERREURS CAPTURÉES (' + errors.length + ') ===');
for (const e of errors.slice(0, 20)) console.log(' •', e.slice(0, 300));

await browser.close();
