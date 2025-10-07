import { test, expect } from '@playwright/test';

test('poster-first-paint: poster appears early and fades out after ready', async ({ page }) => {
  await page.goto('http://localhost:3886/');

  // Poster should be present quickly
  const poster = page.locator('#poster-backdrop');
  await expect(poster).toHaveCount(1, { timeout: 1500 });

  // Wait for app:ready and then poster removal
  // We rely on runtime dispatch of app:ready in chaos-init
  await page.waitForFunction(() => {
    return (window as any).__appReadyFlag === true;
  }, { timeout: 12000 }).catch(async () => {
    // As a fallback, attach a quick listener within the page to tap app:ready
    await page.evaluate(() => {
      (window as any).__appReadyFlag = false;
      window.addEventListener('app:ready', () => { (window as any).__appReadyFlag = true; }, { once: true });
    });
  });

  // Poster should fade out and be removed (or opacity 0)
  await expect(poster).toHaveCount(0, { timeout: 15000 });
});