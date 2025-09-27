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

test.describe.serial('Header System Controls', () => {
  test('Emergency Stop and System Reset affect engine state', async ({ browser }) => {
    const context = await browser.newContext();

    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');

    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);

    // Turn on a couple of effects and speed to ensure there is state to reset
    await control.locator('#glitchSlider').evaluate((el: HTMLInputElement) => { el.value = '70'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await control.locator('#speedSlider').evaluate((el: HTMLInputElement) => { el.value = '150'; el.dispatchEvent(new Event('input', { bubbles: true })); });

    // Emergency Stop
    await control.locator('#emergencyStop').click();
    // After emergency, anime should be disabled and GSAP timeline timeScale reset
    await expect.poll(async () => {
      return await main.evaluate(() => {
        const enabled = Boolean((window as any).vjReceiver?.animeEnabled);
        const gsap: any = (window as any).gsap;
        const ts = gsap?.globalTimeline?.timeScale ? gsap.globalTimeline.timeScale() : 1;
        return (!enabled) && ts <= 1;
      });
    }).toBeTruthy();

    // System Reset restores scene to auto and default speed
    await control.locator('#systemReset').click();

    await expect.poll(async () => {
      return await main.evaluate(() => {
        const scene = (window as any).vjReceiver?.currentSettings?.scene;
        const speed = (window as any).vjReceiver?.currentSettings?.speed;
        return scene === 'auto' && (speed === 1 || speed === 100);
      });
    }).toBeTruthy();
  });

  test('System Reload triggers ChaosControl.restart (if available)', async ({ browser }) => {
    const context = await browser.newContext();
    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');
await waitForOnline(control, main);

    // Ensure ChaosControl is available, then monkey-patch restart to increment a counter
    await expect.poll(async () => {
      return await main.evaluate(() => typeof (window as any).ChaosControl?.restart === 'function');
    }).toBeTruthy();

    await main.evaluate(() => {
      (window as any).__restarts = 0;
      const cc = (window as any).ChaosControl;
      const orig = cc.restart.bind(cc);
      (window as any).ChaosControl.restart = () => { (window as any).__restarts++; return orig(); };
    });

    // Click reload
    await control.locator('#systemReload').click();

    await expect.poll(async () => {
      return await main.evaluate(() => (window as any).__restarts ?? 0);
    }).toBeGreaterThanOrEqual(1);
  });
});
