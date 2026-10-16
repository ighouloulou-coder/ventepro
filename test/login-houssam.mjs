// Test rapide login HOUSSAM
import { chromium } from 'playwright-core';
const BASE = 'https://ventepro-ruby.vercel.app';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(BASE + '/login', { waitUntil: 'load', timeout: 45000 });
const f = page.locator('input[autocomplete="username"]');
await f.waitFor({ state: 'visible', timeout: 20000 });
await f.fill('HOUSSAM');
await page.locator('input[autocomplete="current-password"]').fill('2026');
await page.getByRole('button', { name: /Se connecter/i }).click();
await page.waitForTimeout(8000);
console.log('URL :', page.url());
const body = (await page.locator('body').innerText()).replace(/\n/g, ' | ').slice(0, 200);
console.log('body:', body);
console.log('Erreurs console :', errors.length);
await browser.close();
