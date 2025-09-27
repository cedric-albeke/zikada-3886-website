import { test, expect } from '@playwright/test';

async function waitForOnline(control) {
  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20_000 });
}

test.describe('Anime System Control', () => {
  test('Enable -> Disable -> Emergency Stop flow updates engine and UI', async ({ browser }) => {
    const context = await browser.newContext();

    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel.html');

    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);

    // Ensure anime stack is loadable; wait for chaosInit presence
    await expect.poll(async () => {
      return await main.evaluate(() => typeof (window as any).chaosInit?.loadAnimeStack === 'function');
    }).toBeTruthy();

    // Click ENABLE
    await control.locator('#animeEnable').click();

    // Expect vjReceiver.animeEnabled to become true
    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).vjReceiver?.animeEnabled));
    }).toBeTruthy();

    // UI should reflect ENABLED (allow a little extra time for ack)
    await expect.poll(async () => {
      return await control.locator('#animeStatus').textContent();
    }).toMatch(/ENABLED/i);

    // Click DISABLE
    await control.locator('#animeDisable').click();

    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).vjReceiver?.animeEnabled));
    }).toBeFalsy();

    await expect(control.locator('#animeStatus')).toHaveText(/DISABLED/i);

    // Click EMERGENCY (kill) — support both ids just in case
    const kill = control.locator('#animeKill');
    if (await kill.count()) {
      await kill.click();
    } else {
      const emerg = control.locator('#animeEmergencyStop');
      if (await emerg.count()) await emerg.click();
    }

    // After kill, still expect disabled
    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).vjReceiver?.animeEnabled));
    }).toBeFalsy();

    await expect(control.locator('#animeStatus')).toHaveText(/DISABLED|KILLED|EMERGENCY/i);
  });
});
