import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

test.describe.serial('soak', () => {
  test('soak: sample FPS/memory/DOM and basic control-panel state', async ({ context }) => {
  const secs = Number(process.env.SOAK_SECS || 60);
  test.setTimeout((secs + 600) * 1000);

  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const trackRuntimeHealth = (pageName: string, page: import('@playwright/test').Page) => {
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push(`${pageName}: ${message.text()}`);
      }
    });
    page.on('pageerror', error => {
      pageErrors.push(`${pageName}: ${error.message}`);
    });
  };

  const control = await context.newPage();
  trackRuntimeHealth('control', control);
  await control.goto('http://localhost:3886/control-panel-v3.html');

  const main = await context.newPage();
  trackRuntimeHealth('main', main);
  await main.goto('http://localhost:3886/');
  await main.waitForFunction(() => (window as any).lottieAnimations?.isInitialized === true, undefined, { timeout: 20_000 });

  // Wait for control panel to show ONLINE
  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY/i, { timeout: 20_000 });

  // Keep the operator-facing FX bank mounted during the stress pass. The
  // sequence below rotates deterministically so an FPS dip can be attributed
  // to an exact effect and transition instead of a random button index.
  const fxDrawerToggle = control.locator('[data-drawer-toggle="effectsLibrary"]');
  if (await fxDrawerToggle.count()) {
    const fxDrawer = control.locator('#effectsLibrary');
    if (!(await fxDrawer.isVisible())) await fxDrawerToggle.click();
    await expect(fxDrawer).toBeVisible();
  }

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
      const owners = (window as any).animationRuntime?.getStats?.().owners || {};
      const runtimeTokens = Object.values<any>(owners).reduce((total: number, owner: any) => (
        total + Object.values<number>(owner).reduce((sum, value) => sum + Number(value || 0), 0)
      ), 0);
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const visibleCanvases = canvases.filter(canvas => {
        const rect = canvas.getBoundingClientRect();
        const style = getComputedStyle(canvas);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
      });
      const activeLottie = Array.from(document.querySelectorAll('[class^="lottie-wrapper-"]'))
        .filter(wrapper => {
          const rect = wrapper.getBoundingClientRect();
          const style = getComputedStyle(wrapper);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && Number(style.opacity || 1) > 0;
        })
        .reduce((total, wrapper) => total + wrapper.querySelectorAll('canvas').length, 0);
      const profile = (window as any).performanceProfileManager?.currentProfile
        || document.documentElement.dataset.performanceProfile
        || null;
      const lottiePlayerRafs = Object.entries<any>(owners)
        .filter(([name]) => name.startsWith('lottie-player:'))
        .reduce((total, [, owner]) => total + Number(owner.rafLoops || 0), 0);
      return {
        fps,
        mem,
        dom,
        runtimeOwners: Object.keys(owners).length,
        runtimeTokens,
        canvases: canvases.length,
        visibleCanvases: visibleCanvases.length,
        activeLottie,
        lottieRootConnected: Boolean(document.querySelector('.lottie-container')),
        lottiePlayerRafs,
        profile
      };
    });
    const activeFx = await control.evaluate(() => {
      const el = document.getElementById('activeEffects');
      const val = el?.textContent ? parseInt(el.textContent, 10) : 0;
      return Number.isFinite(val) ? val : 0;
    });
    return { ...metrics, activeFx };
  };

  // Light deterministic stress: flip one authored effect every 10 seconds,
  // restore it one second later, then move to the next family.
  const toggleEvery = 10; // seconds
  let toggledLast = false;
  let toggledEffect: string | null = null;
  let toggledStateBefore: string | null = null;
  let stressCursor = 0;
  let transition: Record<string, string | null> | null = null;
  const stressEffects = [
    'holographic', 'dataStreams', 'strobeCircles', 'plasma', 'particles', 'noise',
    'cyberGrid', 'rgbSplit', 'chromatic', 'scanlines', 'vignette', 'filmgrain'
  ];

  const startedAt = Date.now();
  const endAt = startedAt + secs * 1000;
  let sampleIndex = 0;
  const fpsSamples: number[] = [];
  const memorySamples: number[] = [];
  const domSamples: number[] = [];
  const runtimeTokenSamples: number[] = [];
  const lottieRootSamples: boolean[] = [];

  while (Date.now() < endAt) {
    const sampleStartedAt = Date.now();

    transition = null;
    // Every 10s: flip the next known family so the trace stays reproducible.
    if (sampleIndex % toggleEvery === 0) {
      try {
        const effect = stressEffects[stressCursor % stressEffects.length];
        stressCursor++;
        const toggle = control.locator(`.effect-toggle-btn[data-effect="${effect}"]:visible`);
        if (await toggle.count()) {
          const stateBefore = await toggle.getAttribute('data-state');
          await toggle.click({ timeout: 2_000 });
          const stateAfter = await toggle.getAttribute('data-state');
          toggledLast = true;
          toggledEffect = effect;
          toggledStateBefore = stateBefore;
          transition = { effect, action: 'flip', stateBefore, stateAfter };
        }
      } catch {}
    } else if (toggledLast && sampleIndex % toggleEvery === 1) {
      // Restore the exact authored state shortly after the transition.
      try {
        if (toggledEffect) {
          const toggle = control.locator(`.effect-toggle-btn[data-effect="${toggledEffect}"]:visible`);
          if (await toggle.count()) {
            const stateBefore = await toggle.getAttribute('data-state');
            if (stateBefore !== toggledStateBefore) await toggle.click({ timeout: 2_000 });
            const stateAfter = await toggle.getAttribute('data-state');
            transition = { effect: toggledEffect, action: 'restore', stateBefore, stateAfter };
          }
        }
      } catch {}
      toggledLast = false;
      toggledEffect = null;
      toggledStateBefore = null;
    }

    const m = await sample();
    if (Number.isFinite(Number(m.fps))) {
      fpsSamples.push(Number(m.fps));
    }
    if (Number.isFinite(Number(m.mem)) && Number(m.mem) > 0) memorySamples.push(Number(m.mem));
    if (Number.isFinite(Number(m.dom))) domSamples.push(Number(m.dom));
    if (Number.isFinite(Number(m.runtimeTokens))) runtimeTokenSamples.push(Number(m.runtimeTokens));
    lottieRootSamples.push(Boolean(m.lottieRootConnected));
    const line = JSON.stringify({
      t: Date.now(),
      elapsedSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(3)),
      transition,
      ...m
    });
    stream.write(line + '\n');

    sampleIndex++;
    const sleepMs = Math.max(0, 1000 - (Date.now() - sampleStartedAt));
    if (sleepMs > 0) {
      await new Promise(r => setTimeout(r, sleepMs));
    }
  }

  stream.end();

  // Quick device-profile snapshot
  const device = await Promise.race([main.evaluate(async () => {
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
    const fps = (window as any).performanceBus?.metrics?.fps ?? 0;
    const dom = document.querySelectorAll('*').length;
    return { dpr, cores, ua, vendor, renderer, maxTex, fps, dom };
  }), new Promise(resolve => setTimeout(() => resolve(null), 5000))]);
  try {
    const outDir = path.join(process.cwd(), 'artifacts', 'soak');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, `device-${ts()}.json`), JSON.stringify(device, null, 2));
  } catch {}

  // Basic post-conditions: panel status still online or standby, fps non-negative
  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20_000 });
  const finalFps = await Promise.race([
    main.evaluate(() => (window as any).performanceBus?.metrics?.fps ?? 0),
    new Promise<number>(resolve => setTimeout(() => resolve(0), 5000))
  ]);
  expect(finalFps).toBeGreaterThanOrEqual(0);
  const minimumSamples = Math.max(3, Math.floor(secs * 0.7));
  expect(fpsSamples.length).toBeGreaterThanOrEqual(minimumSamples);
  if (domSamples.length > 1) {
    expect(Math.max(...domSamples) - domSamples[0]).toBeLessThanOrEqual(400);
    expect(domSamples.at(-1)! - domSamples[0]).toBeLessThanOrEqual(150);
  }
  if (runtimeTokenSamples.length > 1) {
    expect(Math.max(...runtimeTokenSamples) - runtimeTokenSamples[0]).toBeLessThanOrEqual(100);
    expect(runtimeTokenSamples.at(-1)! - runtimeTokenSamples[0]).toBeLessThanOrEqual(40);
  }
  if (memorySamples.length > 1) {
    expect(memorySamples.at(-1)! - memorySamples[0]).toBeLessThanOrEqual(64 * 1024 * 1024);
  }
  expect(lottieRootSamples.every(Boolean)).toBe(true);
  if (process.env.HEADLESS_PERF_STRICT === '1') {
    const warmSamples = fpsSamples.slice(Math.min(10, fpsSamples.length));
    const minFps = warmSamples.length ? Math.min(...warmSamples) : 0;
    const avgFps = warmSamples.length
      ? warmSamples.reduce((sum, fps) => sum + fps, 0) / warmSamples.length
      : 0;
    expect(minFps).toBeGreaterThanOrEqual(30);
    expect(avgFps).toBeGreaterThanOrEqual(45);
  }
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  });
});
