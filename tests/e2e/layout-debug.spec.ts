import { test, expect } from '@playwright/test';

test('dump grid diagnostics', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3886/control-panel.html');
  await expect(page.locator('.control-grid')).toBeVisible();
  const gridStyles = await page.locator('.control-grid').evaluate((n) => {
    const s = getComputedStyle(n as HTMLElement);
    return {
      columns: s.gridTemplateColumns,
      areas: s.gridTemplateAreas,
      autoFlow: s.gridAutoFlow
    };
  });
  console.log('grid styles:', gridStyles);
  const areas = ['color','tempo','intensity','triggers','scenes','ve','animation'];
  for (const cls of ['section--color','section--tempo','section--intensity','section--triggers','section--scenes','section--ve-layers','section--animation']) {
    const el = page.locator('.' + cls);
    const box = await el.boundingBox();
    const styles = await el.evaluate((n) => {
      const el = n as HTMLElement;
      const cs = getComputedStyle(el);
      return {
        gridArea: cs.gridArea,
        gridColumn: cs.gridColumn,
        gridColumnStart: cs.gridColumnStart,
        gridColumnEnd: cs.gridColumnEnd,
        gridRowStart: cs.gridRowStart,
        gridRowEnd: cs.gridRowEnd,
        order: cs.order,
        display: cs.display,
        position: cs.position,
        width: cs.width,
        justifySelf: cs.justifySelf,
        alignSelf: cs.alignSelf
      };
    });
    console.log(cls, box, styles);
  }
});