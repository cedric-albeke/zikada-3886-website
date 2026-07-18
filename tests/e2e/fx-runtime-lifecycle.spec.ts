import { test, expect } from '@playwright/test';

test('persistent FX remain single-owner across retriggers and fully release on disable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3886/');

  await expect.poll(async () => page.evaluate(() => Boolean(
    (window as any).fxController && (window as any).animationRuntime
  )), { timeout: 20_000 }).toBeTruthy();

  await page.evaluate(() => {
    const fx = (window as any).fxController;
    fx.setEffectEnabled('dataStreams', false);
    fx.setEffectEnabled('dataStreams', true);
    fx.setEffectEnabled('dataStreams', true);
    fx.setEffectEnabled('dataStreams', true);
  });

  await expect.poll(async () => page.evaluate(() => ({
    overlays: document.querySelectorAll('#data-streams-overlay').length,
    intervals: (window as any).animationRuntime.getStats().owners['fx-controller:data-streams']?.intervals ?? 0
  }))).toEqual({ overlays: 1, intervals: 1 });

  await page.evaluate(() => (window as any).fxController.setEffectEnabled('dataStreams', false));
  await expect.poll(async () => page.evaluate(() => ({
    overlays: document.querySelectorAll('#data-streams-overlay').length,
    ownerPresent: Boolean((window as any).animationRuntime.getStats().owners['fx-controller:data-streams'])
  }))).toEqual({ overlays: 0, ownerPresent: false });

  await page.evaluate(() => {
    const fx = (window as any).fxController;
    fx.applyPlasmaEffect(true);
    fx.applyPlasmaEffect(true);
  });
  await expect(page.locator('#plasma-overlay')).toHaveCount(1);
  const plasmaRuntimeOwners = await page.evaluate(() => Object.keys(
    (window as any).animationRuntime.getStats().owners
  ).filter(name => name.includes('plasma')));
  expect(plasmaRuntimeOwners).toEqual([]);

  await page.evaluate(() => (window as any).fxController.applyPlasmaEffect(false));
  await expect(page.locator('#plasma-overlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});
