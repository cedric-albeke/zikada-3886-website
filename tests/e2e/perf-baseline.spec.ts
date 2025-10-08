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

  const fpsSamples: number[] = [];
  const frameTimeSamples: number[] = [];

  for (let i = 0; i < secs; i++) {
    const m = await sample();
    stream.write(JSON.stringify({ t: Date.now(), ...m }) + '\n');
    const fps = Number((m as any).fps ?? 0);
    if (Number.isFinite(fps) && fps > 0) {
      fpsSamples.push(fps);
      frameTimeSamples.push(1000 / fps);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  stream.end();

  // Device context
  const device = await main.evaluate(async () => {
    const nav = navigator as any;
    const dpr = window.devicePixelRatio || 1;
    const cores = nav.hardwareConcurrency || null;
    const ua = nav.userAgent || '';
    const canvas = document.createElement('canvas');
    const gl: any = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    let vendor = null, renderer = null, maxTex = null;
    if (gl) {
      try {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
          renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
        }
        maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      } catch (_) {}
    }
    return { dpr, cores, ua, vendor, renderer, maxTex };
  });

  const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0) / arr.length : 0;
  const p95 = (arr: number[]) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a,b)=>a-b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    return sorted[idx];
  };

  const summary = {
    samples: fpsSamples.length,
    avgFPS: Number(avg(fpsSamples).toFixed(2)),
    minFPS: fpsSamples.length ? Math.min(...fpsSamples) : 0,
    maxFPS: fpsSamples.length ? Math.max(...fpsSamples) : 0,
    p95FrameTimeMs: Number(p95(frameTimeSamples).toFixed(2)),
    device,
  };

  const summaryDir = path.join(process.cwd(), 'artifacts', 'baseline');
  fs.mkdirSync(summaryDir, { recursive: true });
  const summaryFile = path.join(summaryDir, `summary-${ts()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

  // Basic assertion: not crashing and fps numeric
  const finalFps = await main.evaluate(() => (window as any).performanceBus?.metrics?.fps ?? 0);
  expect(finalFps).toBeGreaterThanOrEqual(0);
  });
});
