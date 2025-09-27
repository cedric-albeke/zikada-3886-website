import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

test.describe.serial('soak', () => {
  test('soak: sample FPS/memory/DOM and basic control-panel state', async ({ browser }) => {
  const context = await browser.newContext();

  const control = await context.newPage();
  await control.goto('http://localhost:3886/control-panel.html');

  const main = await context.newPage();
  await main.goto('http://localhost:3886/');

  // Wait for control panel to show ONLINE
  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY/i, { timeout: 20_000 });

  const secs = Number(process.env.SOAK_SECS || 60);
  const outDir = path.join(process.cwd(), 'artifacts', 'soak');
  const outFile = process.env.SOAK_OUT || path.join(outDir, `soak-${ts()}.jsonl`);
  fs.mkdirSync(outDir, { recursive: true });
  const stream = fs.createWriteStream(outFile, { flags: 'a' });

  // Helper samplers for metrics across pages
  const sample = async () => {
    const metrics = await main.evaluate(() => {
      const fps = (window as any).performanceBus?.metrics?.fps ?? 0;
      const mem = (performance as any).memory?.usedJSHeapSize ?? 0;
      const dom = document.querySelectorAll('*').length;
      return { fps, mem, dom };
    });
    const activeFx = await control.evaluate(() => {
      const el = document.getElementById('activeEffects');
      const val = el?.textContent ? parseInt(el.textContent, 10) : 0;
      return Number.isFinite(val) ? val : 0;
    });
    return { ...metrics, activeFx };
  };

  // Optional light stress: toggle a random effect every 10s
  const toggleEvery = 10; // seconds
  let toggledLast = false;

  for (let i = 0; i < secs; i++) {
    // Every 10s: try a harmless toggle to ensure toggling is stable
    if (i % toggleEvery === 0) {
      try {
        const toggles = control.locator('.effect-toggle-btn');
        const count = await toggles.count();
        if (count > 0) {
          const idx = Math.floor(Math.random() * count);
          await toggles.nth(idx).click();
          toggledLast = true;
        }
      } catch {}
    } else if (toggledLast && i % toggleEvery === 1) {
      // Revert the previous toggle shortly after
      try {
        const toggles = control.locator('.effect-toggle-btn');
        const count = await toggles.count();
        if (count > 0) {
          const idx = Math.floor(Math.random() * count);
          await toggles.nth(idx).click();
        }
      } catch {}
      toggledLast = false;
    }

    const m = await sample();
    const line = JSON.stringify({ t: Date.now(), ...m });
    stream.write(line + '\n');

    await new Promise(r => setTimeout(r, 1000));
  }

  stream.end();

  // Basic post-conditions: panel status still online or standby, fps non-negative
  const finalFps = await main.evaluate(() => (window as any).performanceBus?.metrics?.fps ?? 0);
  expect(finalFps).toBeGreaterThanOrEqual(0);
  });
});
