import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

test.describe.serial('baseline', () => {
  test('baseline: capture FPS/memory/DOM and overlays for ~120s', async ({ browser }) => {
  const context = await browser.newContext();

  const control = await context.newPage();
  await control.goto('http://localhost:3886/control-panel.html');

  const main = await context.newPage();
  await main.goto('http://localhost:3886/');

  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20_000 });

  const secs = Number(process.env.BASELINE_SECS || 120);
  const outDir = path.join(process.cwd(), 'artifacts', 'baseline');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `perf-${ts()}.jsonl`);
  const stream = fs.createWriteStream(outFile, { flags: 'a' });

  const sample = async () => {
    const mainMetrics = await main.evaluate(() => {
      const fps = (window as any).performanceBus?.metrics?.fps ?? (window as any).safePerformanceMonitor?.metrics?.fps ?? 0;
      const mem = (performance as any).memory?.usedJSHeapSize ?? 0;
      const dom = document.querySelectorAll('*').length;
      const overlays = (document.getElementById('fx-root')?.children?.length) ?? 0;
      return { fps, mem, dom, overlays };
    });
    const controlFx = await control.evaluate(() => {
      const el = document.getElementById('activeEffects');
      const val = el?.textContent ? parseInt(el.textContent, 10) : 0;
      return Number.isFinite(val) ? val : 0;
    });
    return { ...mainMetrics, controlFx };
  };

  for (let i = 0; i < secs; i++) {
    const m = await sample();
    stream.write(JSON.stringify({ t: Date.now(), ...m }) + '\n');
    await new Promise(r => setTimeout(r, 1000));
  }

  stream.end();

  // Basic assertion: not crashing and fps numeric
  const finalFps = await main.evaluate(() => (window as any).performanceBus?.metrics?.fps ?? 0);
  expect(finalFps).toBeGreaterThanOrEqual(0);
  });
});
