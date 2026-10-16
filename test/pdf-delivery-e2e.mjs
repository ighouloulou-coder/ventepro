// Test E2E bouton PDF sur un bon de livraison (via le détail)
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'https://ventepro-ruby.vercel.app';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 150)); });
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));

// Login
await page.goto(BASE + '/login', { waitUntil: 'load', timeout: 45000 });
await page.locator('input[autocomplete="username"]').waitFor({ state: 'visible', timeout: 20000 });
await page.locator('input[autocomplete="username"]').fill('ISMAIL');
await page.locator('input[autocomplete="current-password"]').fill('2024');
await page.getByRole('button', { name: /Se connecter/i }).click();
await page.waitForTimeout(6000);

// Aller sur les livraisons
await page.goto(BASE + '/deliveries', { waitUntil: 'load' });
await page.waitForTimeout(2000);
const rows = await page.locator('.data-table tbody tr').count();
console.log('Lignes BL :', rows);
if (rows === 0) { console.log('❌ Aucune BL'); await browser.close(); process.exit(1); }

// Ouvrir le détail de la première BL
await page.locator('.data-table tbody tr').first().locator('button[title="Voir"]').click();
await page.waitForTimeout(1000);

// Vérifier bouton PDF dans le modal
const pdfBtn = page.locator('.modal button:has-text("📄 PDF")');
const pdfBtnVisible = await pdfBtn.isVisible();
console.log('Bouton PDF visible :', pdfBtnVisible);
if (pdfBtnVisible) {
  await pdfBtn.click();
  await page.waitForTimeout(1000);
  // Vérifier le téléchargement
  const fs = require('fs');
  const path = require('path');
  const downloadsDir = path.join(process.env.HOME || '', 'Downloads');
  const files = fs.readdirSync(downloadsDir).filter(f => f.includes('bon-livraison') && f.endsWith('.pdf'));
  console.log('Fichiers PDF téléchargés :', files.length);
  for (const f of files) console.log(' •', f);
} else {
  console.log('❌ Bouton PDF non trouvé dans le modal');
}

// Fermer le modal
await page.locator('.modal-overlay').click();
await browser.close();