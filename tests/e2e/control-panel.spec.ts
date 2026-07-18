import { test, expect } from '@playwright/test';

async function waitForOnline(control, main?) {
  try {
    await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20000 });
  } catch (_) {
    if (!main) {
      throw _;
    }
  }
  if (main) {
    await expect.poll(async () => {
      return await main.evaluate(() => !!(window as any).vjReceiver);
    }, { timeout: 20000 }).toBeTruthy();
  }
}

test.describe('Control Panel Core Functionality', () => {
  test('Color Matrix updates body filter', async ({ context }) => {
    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control, main);

    // Move hue slider on control panel
    const hue = control.locator('#hueSlider');
    await hue.evaluate((el: HTMLInputElement) => { el.value = '30'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    // Assert body filter contains hue-rotate and saturate (not none)
    await expect.poll(async () => {
      return await main.evaluate(() => getComputedStyle(document.body).filter || '');
    }, { message: 'body filter should be applied' }).toContain('hue-rotate(');
  });

  test('FX intensity: glitch toggles glitch pass', async ({ context }) => {
    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control, main);

    // Increase glitch
    const glitch = control.locator('#glitchSlider');
    await glitch.evaluate((el: HTMLInputElement) => { el.value = '80'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    await expect.poll(async () => {
      return await main.evaluate(() => {
        const pass = (window as any).chaosEngine?.glitchPass;
        const fallback = (window as any).ambientCanvasRenderer?.getStats?.().channels.glitch;
        return pass ? Boolean(pass.enabled) : Boolean(fallback?.enabled && fallback.strength >= 0.8);
      });
    }, { timeout: 20_000 }).toBeTruthy();

    // Decrease glitch to 0
    await glitch.evaluate((el: HTMLInputElement) => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    await expect.poll(async () => {
      return await main.evaluate(() => {
        const pass = (window as any).chaosEngine?.glitchPass;
        const fallback = (window as any).ambientCanvasRenderer?.getStats?.().channels.glitch;
        return pass ? Boolean(pass.enabled) : Boolean(fallback?.enabled);
      });
    }).toBeFalsy();
  });

  test('Layer toggle: scanlines ON/OFF', async ({ context }) => {
    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control, main);

    // Toggle Scan Lines ON
    const fxBank = control.locator('[data-drawer-toggle="effectsLibrary"]');
    await fxBank.click();
    await expect(control.locator('#effectsLibrary')).toBeVisible();
    const btn = control.locator('.effect-toggle-btn[data-effect="scanlines"]');
    await btn.click();

    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).ambientCanvasRenderer?.getStats?.().channels.scanlines.strength);
    }).toBe(0.14);

    // Toggle OFF
    await btn.click();

    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).ambientCanvasRenderer?.getStats?.().channels.scanlines.strength);
    }).toBe(0.035);
  });
});
