import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

test('first-load: capture overlay/z-index mutations for ~10s', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // Inject overlay observer at init to capture the earliest mutations
  await page.addInitScript({ path: 'scripts/debug/overlay-observer.js' });

  await page.goto('http://localhost:3886/');

  // Wait ~10 seconds to capture early overlay insertions
  await page.waitForTimeout(10_000);

  // Retrieve observer log
  const log = await page.evaluate(() => (window as any).__overlayObserver?.dump?.() || []);

  const outDir = path.join(process.cwd(), 'artifacts', 'baseline');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `overlay-${ts()}.jsonl`);
  const stream = fs.createWriteStream(outFile, { flags: 'a' });
  for (const item of log) stream.write(JSON.stringify(item) + '\n');
  stream.end();

  // Basic assertion: at least some entries or test passes quietly
  expect(Array.isArray(log)).toBeTruthy();
});
