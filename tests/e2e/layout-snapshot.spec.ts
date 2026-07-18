import { test, expect } from '@playwright/test';

// Smoke/snapshot to visualize the viewport-bound command center.

test('control panel layout snapshot (1920x1080)', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3886/control-panel-v3.html');
  // Wait for critical widgets to be present
  await expect(page.locator('.control-grid')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500); // allow fonts/layout to settle

  await page.screenshot({ path: 'test-artifacts/control-panel-1920x1080.png', fullPage: false });

  // Basic sanity checks for layout regions
  const scenes = page.locator('.scene-section');
  const triggers = page.locator('.trigger-fx-section');
  const ve = page.locator('.visual-effects-section');
  const animation = page.locator('.animation-section');
  const eventLog = page.locator('.event-log-section');

  await expect(scenes).toBeVisible();
  await expect(triggers).toBeVisible();
  await expect(ve).toBeVisible();
  await expect(animation).toBeVisible();
  await expect(eventLog).toBeVisible();
  await expect(page.locator('.trigger-btn[data-effect="cosmic"]')).toBeVisible();

  const panel = page.locator('.control-grid');
  const panelBox = await panel.boundingBox();
  const scenesBox = await scenes.boundingBox();
  const veBox = await ve.boundingBox();
  const animBox = await animation.boundingBox();

  // At this viewport each operating region must remain inside the panel.
  if (panelBox && scenesBox) {
    expect(scenesBox.x).toBeGreaterThanOrEqual(panelBox.x);
    expect(scenesBox.x + scenesBox.width).toBeLessThanOrEqual(panelBox.x + panelBox.width + 1);
  }

  // Scene and animation share a row; layers stay in the right command column.
  if (scenesBox && veBox && animBox) {
    expect(Math.abs(animBox.y - scenesBox.y)).toBeLessThan(2);
    expect(veBox.x).toBeGreaterThan(animBox.x);
  }
});
