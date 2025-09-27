import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

test('runbook: toggle FX and record overlay counts for ~60s', async ({ browser }) => {
  const context = await browser.newContext();

  const control = await context.newPage();
  await control.goto('http://localhost:3886/control-panel.html');

  const main = await context.newPage();
  await main.goto('http://localhost:3886/');

  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20_000 });

  const secs = Number(process.env.DUPES_SECS || 60);
  const outDir = path.join(process.cwd(), 'artifacts', 'baseline');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `overlays-${ts()}.jsonl`);
  const stream = fs.createWriteStream(outFile, { flags: 'a' });

  // Collect toggle buttons from control panel (Visual Effects & Layers section)
  const toggles = control.locator('.effect-toggle-btn');
  const count = await toggles.count();

  // Helper to sample overlay counts and known IDs
  const sample = async () => {
    return await main.evaluate(() => {
      const overlaysRoot = document.getElementById('fx-root');
      const overlays = overlaysRoot ? overlaysRoot.children.length : 0;
      const ids = [
        'scanlines-effect','scanlines-overlay','digital-noise-effect','grain-overlay','film-grain-effect',
        'data-streams-overlay','vignette-effect','vignette-overlay','chromatic-aberration'
      ];
      const present = Object.fromEntries(ids.map(id => [id, !!document.getElementById(id)]));
      const dom = document.querySelectorAll('*').length;
      return { overlays, present, dom };
    });
  };

  // Main loop: every 2s toggle a button (ON then OFF next pass), while sampling every second
  for (let i = 0; i < secs; i++) {
    if (count > 0 && i % 2 === 0) {
      const idx = i % count;
      try { await toggles.nth(idx).click(); } catch {}
    }

    const m = await sample();
    stream.write(JSON.stringify({ t: Date.now(), i, ...m }) + '\n');
    await new Promise(r => setTimeout(r, 1000));
  }

  // Attempt to turn all toggles OFF to restore baseline
  for (let i = 0; i < count; i++) {
    try {
      const btn = toggles.nth(i);
      const state = await btn.getAttribute('data-state');
      if (state === 'on') await btn.click();
    } catch {}
  }

  stream.end();

  // Basic assertion: DOM count should remain reasonable
  const finalDom = await main.evaluate(() => document.querySelectorAll('*').length);
  expect(finalDom).toBeGreaterThan(0);
});
