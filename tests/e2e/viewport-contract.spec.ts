import { test, expect } from '@playwright/test';

for (const viewport of [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 }
]) {
  test(`control panel remains inside ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:3886/control-panel-v3.html');
    await expect(page.locator('.control-panel')).toBeVisible();

    const dimensions = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const panel = document.querySelector('.control-panel') as HTMLElement;
      const rect = panel.getBoundingClientRect();
      const sections = Array.from(document.querySelectorAll<HTMLElement>('.cp-section'));
      const headerActions = Array.from(document.querySelectorAll<HTMLElement>('.command-rail .rail-action'));
      return {
        rootClientWidth: root.clientWidth,
        rootScrollWidth: root.scrollWidth,
        rootClientHeight: root.clientHeight,
        rootScrollHeight: root.scrollHeight,
        bodyScrollWidth: body.scrollWidth,
        panelClientWidth: panel.clientWidth,
        panelScrollWidth: panel.scrollWidth,
        rectWidth: rect.width,
        rectHeight: rect.height,
        sectionHeights: sections.map((section) => Math.round(section.getBoundingClientRect().height)),
        headerActionHeights: headerActions.map((action) => Math.round(action.getBoundingClientRect().height)),
        overflowers: Array.from(document.querySelectorAll<HTMLElement>('*'))
          .map((element) => ({
            selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''}`,
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            right: Math.round(element.getBoundingClientRect().right)
          }))
          .filter((entry) => entry.scrollWidth > entry.clientWidth + 1 || entry.right > window.innerWidth + 1)
          .sort((a, b) => b.scrollWidth - a.scrollWidth)
          .slice(0, 12)
      };
    });

    if (dimensions.panelScrollWidth !== dimensions.panelClientWidth) {
      console.log('horizontal overflowers', dimensions.overflowers);
    }

    expect(dimensions.rootScrollWidth).toBe(dimensions.rootClientWidth);
    expect(dimensions.bodyScrollWidth).toBe(dimensions.rootClientWidth);
    expect(dimensions.rootScrollHeight).toBe(dimensions.rootClientHeight);
    expect(dimensions.panelScrollWidth).toBe(dimensions.panelClientWidth);
    expect(dimensions.rectWidth).toBeLessThanOrEqual(viewport.width);
    expect(dimensions.rectHeight).toBeLessThanOrEqual(viewport.height);
    if (viewport.width <= 700) {
      expect(Math.max(...dimensions.sectionHeights)).toBeLessThanOrEqual(480);
      expect(Math.min(...dimensions.headerActionHeights)).toBeGreaterThanOrEqual(34);
    }
  });
}
