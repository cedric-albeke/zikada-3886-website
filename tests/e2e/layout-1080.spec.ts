import { test, expect } from "@playwright/test";

test("layout at 1920x1080 fits compact rules", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("http://localhost:3886/control-panel.html?v=ts");
  await page.waitForSelector(".control-grid");

  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  const bodyH = await page.evaluate(() => document.body.scrollHeight);
  const viewportH = 1080;
  console.log("heights", { docH, bodyH, viewportH });

  // Screenshot
  await page.screenshot({ path: "test-artifacts/control-panel-1920x1080.png", fullPage: true });

  // Page must not scroll
  expect(docH).toBeLessThanOrEqual(viewportH);
});
