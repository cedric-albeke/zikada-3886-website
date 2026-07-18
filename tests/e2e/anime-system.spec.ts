import { test, expect } from '@playwright/test';

async function waitForOnline(control) {
  await expect(control.locator('#connectionStatus .status-text')).toHaveText(/ONLINE|STANDBY|CONNECTED/i, { timeout: 20_000 });
}

test.describe('Anime System Control', () => {
  test('Enable -> Disable -> Emergency Stop flow updates engine and UI', async ({ context }) => {

    const control = await context.newPage();
    await control.goto('http://localhost:3886/control-panel-v3.html');

    const main = await context.newPage();
    await main.goto('http://localhost:3886/');

    await waitForOnline(control);

    // Ensure anime stack is loadable; wait for chaosInit presence
    await expect.poll(async () => {
      return await main.evaluate(() => typeof (window as any).chaosInit?.loadAnimeStack === 'function');
    }).toBeTruthy();

    const animeToggle = control.locator('#animeToggle');
    await expect(animeToggle).toHaveAttribute('data-state', 'disabled');

    // Click ENABLE
    await animeToggle.click();

    // Expect vjReceiver.animeEnabled to become true
    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).vjReceiver?.animeEnabled));
    }).toBeTruthy();

    // UI should reflect ON (allow a little extra time for ack)
    await expect(animeToggle).toHaveAttribute('data-state', 'enabled');
    await expect(animeToggle).toHaveAttribute('aria-pressed', 'true');
    await expect(animeToggle.locator('.toggle-status')).toHaveText('ON');

    // Click DISABLE
    await animeToggle.click();

    await expect.poll(async () => {
      return await main.evaluate(() => Boolean((window as any).vjReceiver?.animeEnabled));
    }).toBeFalsy();

    await expect(animeToggle).toHaveAttribute('data-state', 'disabled');
    await expect(animeToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(animeToggle.locator('.toggle-status')).toHaveText('OFF');

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

    await expect(animeToggle).toHaveAttribute('data-state', 'disabled');
    await expect(animeToggle).toHaveAttribute('aria-pressed', 'false');
    await expect(animeToggle.locator('.toggle-status')).toHaveText('OFF');
  });
});
