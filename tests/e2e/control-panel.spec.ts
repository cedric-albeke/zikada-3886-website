import { test, expect } from '@playwright/test';

async function waitForOnline(control, main?) {
  try {
    await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20000 });
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

test.describe('Control Panel Core Functionality', () => {
  test('Color Matrix updates body filter', async ({ browser }) => {
    const context = await browser.newContext();
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

  test('FX intensity: glitch toggles glitch pass', async ({ browser }) => {
    const context = await browser.newContext();
    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);

    // Increase glitch
    const glitch = control.locator('#glitchSlider');
    await glitch.evaluate((el: HTMLInputElement) => { el.value = '80'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    await expect.poll(async () => {
      return await main.evaluate(() => !!(window as any).chaosEngine?.glitchPass?.enabled);
    }).toBeTruthy();

    // Decrease glitch to 0
    await glitch.evaluate((el: HTMLInputElement) => { el.value = '0'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    await expect.poll(async () => {
      return await main.evaluate(() => !!(window as any).chaosEngine?.glitchPass?.enabled);
    }).toBeFalsy();
  });

  test('Layer toggle: scanlines ON/OFF', async ({ browser }) => {
    const context = await browser.newContext();
    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);

    // Toggle Scan Lines ON
    const btn = control.locator('.effect-toggle-btn[data-effect="scanlines"]');
    await btn.click();

    await expect.poll(async () => {
      return await main.evaluate(() => !!document.getElementById('scanlines-effect') || !!document.getElementById('scanlines-overlay'));
    }).toBeTruthy();

    // Toggle OFF
    await btn.click();

    await expect.poll(async () => {
      return await main.evaluate(() => !document.getElementById('scanlines-effect') && !document.getElementById('scanlines-overlay'));
    }).toBeTruthy();
  });
});
