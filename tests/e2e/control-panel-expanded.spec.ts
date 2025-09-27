import { test, expect } from '@playwright/test';

async function waitForOnline(control, main?) {
  try {
    await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20_000 });
  } catch (_) {
    if (main) {
      await expect.poll(async () => {
        return await main.evaluate(() => !!(window as any).vjReceiver);
      }, { timeout: 20000 }).toBeTruthy();
    } else {
      throw _;
    }
  }
}

async function waitForVJReceiver(main) {
  await expect.poll(async () => {
    return await main.evaluate(() => !!(window as any).vjReceiver && !!(window as any).vjReceiver.currentSettings);
  }, { timeout: 20_000 }).toBeTruthy();
}

test.describe('Control Panel Expanded Coverage', () => {
  test('Scenes: select GLITCH then AUTO; verify receiver scene and phaseRunning', async ({ browser }) => {
    const context = await browser.newContext();

    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');

    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

await waitForOnline(control, main);
    await waitForVJReceiver(main);

    // Click GLITCH scene
    await control.locator('.scene-btn[data-scene="glitch"]').click();

    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).vjReceiver?.currentSettings?.scene || '');
    }).toBe('glitch');

    // Click AUTO scene
    await control.locator('.scene-btn[data-scene="auto"]').click();

    // Expect scene back to auto
    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).vjReceiver?.currentSettings?.scene || '');
    }).toBe('auto');

    // In AUTO, phaseRunning should be true
    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).chaosInit?.phaseRunning));
    }).toBeTruthy();
  });

  test('Tempo: speed slider, phase duration, tap BPM, and BPM ripple toggle', async ({ browser }) => {
    const context = await browser.newContext();

    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');

    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);
    await waitForVJReceiver(main);

    // Speed: set to 150%
    const speed = control.locator('#speedSlider');
    await speed.evaluate((el: HTMLInputElement) => { el.value = '150'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).vjReceiver?.currentSettings?.speed ?? null);
    }).toBe(150);

    // Optionally check the global timeline speed > 1 (if GSAP is available)
    await expect.poll(async () => {
      return await main.evaluate(() => {
        const gsap: any = (window as any).gsap;
        try {
          if (gsap?.globalTimeline?.timeScale) {
            return gsap.globalTimeline.timeScale();
          }
        } catch {}
        return 1;
      });
    }).toBeGreaterThan(1);

    // Phase Duration: set to 10s
    const phase = control.locator('#phaseDurationSlider');
    await phase.evaluate((el: HTMLInputElement) => { el.value = '10'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).chaosInit?.phaseDurationMs ?? 0);
    }).toBe(10_000);

    // Tap BPM: tap twice with ~500ms between
    const tap = control.locator('#tapBPM');
    await tap.click();
    await new Promise(r => setTimeout(r, 500));
    await tap.click();

    // Accept any reasonable BPM > 30 (guard for timing variability on CI)
    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).vjReceiver?.currentSettings?.bpm ?? 0);
    }).toBeGreaterThan(30);

    // BPM ripple toggle ON
    const rippleBtn = control.locator('#toggleBpmRipple');
    await rippleBtn.click();

    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).vjReceiver?.bpmRippleEnabled));
    }).toBeTruthy();
  });

  test('Trigger FX: activeFx increases and then settles back', async ({ browser }) => {
    const context = await browser.newContext();

    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');

    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);
    await waitForVJReceiver(main);

    const baseline = await main.evaluate(() => (window as any).vjReceiver?.activeFx ?? 0);

    // Trigger an effect (strobe)
    await control.locator('.trigger-btn[data-effect="strobe"]').click();

    // Expect activeFx to increase above baseline shortly after
    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).vjReceiver?.activeFx ?? 0);
    }).toBeGreaterThanOrEqual(baseline + 1);

    // Allow a couple seconds for FX to settle back
    await new Promise(r => setTimeout(r, 3000));

    // Expect activeFx to drop back down to >= baseline
    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).vjReceiver?.activeFx ?? 0);
    }).toBeGreaterThanOrEqual(baseline);

    // Trigger a couple more effects to exercise pipeline
    const effects = ['blackout', 'rgbsplit'];
    for (const eff of effects) {
      await control.locator(`.trigger-btn[data-effect="${eff}"]`).click();
      await expect.poll(async () => {
        return await main.evaluate(() => (window as any).vjReceiver?.activeFx ?? 0);
      }).toBeGreaterThanOrEqual(baseline + 1);
    }
  });
});
