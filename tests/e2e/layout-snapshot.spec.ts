import { test, expect } from '@playwright/test';

// Smoke/snapshot to visualize current layout at large viewport
// Saves a PNG to test-artifacts/control-panel-layout.png for manual inspection.

test('control panel layout snapshot (1440x900)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3886/control-panel.html');
  // Wait for critical widgets to be present
  await expect(page.locator('.control-grid')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500); // allow fonts/layout to settle

  await page.screenshot({ path: 'test-artifacts/control-panel-layout.png', fullPage: true });

  // Basic sanity checks for layout regions
  const scenes = page.locator('.section--scenes');
  const color = page.locator('.section--color');
  const tempo = page.locator('.section--tempo');
  const intensity = page.locator('.section--intensity');
  const triggers = page.locator('.section--triggers');
  const ve = page.locator('.section--ve-layers');
  const animation = page.locator('.section--animation');

  await expect(scenes).toBeVisible();
  await expect(ve).toBeVisible();
  await expect(animation).toBeVisible();

  const panel = page.locator('.control-grid');
  const panelBox = await panel.boundingBox();
  const scenesBox = await scenes.boundingBox();
  const veBox = await ve.boundingBox();
  const animBox = await animation.boundingBox();

  // Scenes should be nearly full width on its own row
  if (panelBox && scenesBox) {
    expect(scenesBox.width).toBeGreaterThan(panelBox.width * 0.85);
  }

  // VE should be below scenes, animation below VE
  if (scenesBox && veBox && animBox) {
    expect(veBox.y).toBeGreaterThan(scenesBox.y);
    expect(animBox.y).toBeGreaterThan(veBox.y);
  }
});