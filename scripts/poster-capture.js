/* Poster capture script
 * - Builds on the dist/ output
 * - Serves dist via an embedded http-server
 * - Launches Playwright Chromium to capture a first-frame poster with ?poster=1
 * - Writes poster file to public/posters/index-hero.png so Vite copies it to dist
 */

import { chromium } from 'playwright';
import httpServer from 'http-server';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.POSTER_PORT || 3889);
const HOST = '127.0.0.1';

async function waitForServer(url, attempts = 30, intervalMs = 200) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Server did not respond in time: ${url}`);
}

async function main() {
  const distDir = path.resolve('dist');
  const postersDir = path.resolve('public', 'posters');
  const outPng = path.join(postersDir, 'index-hero.png');

  if (!fs.existsSync(distDir)) {
    throw new Error('dist/ not found. Run: npm run build');
  }
  fs.mkdirSync(postersDir, { recursive: true });

  // Start static file server for dist
  const server = httpServer.createServer({ root: distDir, cache: 0, cors: true });
  await new Promise((resolve) => server.listen(PORT, HOST, resolve));
  const baseUrl = `http://${HOST}:${PORT}`;

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await context.newPage();

    // Load in poster mode for a static hero
    const url = `${baseUrl}/?poster=1`;
    await page.goto(url, { waitUntil: 'load' });

    // Allow fonts and hero to settle briefly
    await page.waitForTimeout(700);

    // Ensure the main hero wrapper exists (fallback to body)
    const target = await page.$('.mid-loader-image') || await page.$('body');
    if (!target) throw new Error('No capture target found');

    await target.screenshot({ path: outPng, type: 'png' });

    console.log(`✅ Poster saved: ${outPng}`);

    await browser.close();
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('Poster capture failed:', err);
  process.exit(1);
});
