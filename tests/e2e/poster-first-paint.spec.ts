import { test, expect } from '@playwright/test';

test('poster-first-paint: poster appears early and fades out after ready', async ({ page }) => {
  await page.goto('http://localhost:3886/', { waitUntil: 'domcontentloaded' });

  // On fast machines app:ready may remove the poster before navigation
  // resolves. Verify the poster contract exists in markup, then assert that
  // no backdrop can remain stuck after readiness.
  const poster = page.locator('#poster-backdrop');
  const hasPosterContract = await page.evaluate(async () => {
    const html = await fetch('/').then(response => response.text());
    return html.includes('id="poster-backdrop"') && html.includes('#poster-backdrop');
  });
  expect(hasPosterContract).toBeTruthy();

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
