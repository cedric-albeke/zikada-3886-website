import { test, expect } from '@playwright/test';

test('reports dominant runtime and compositor owners', async ({ page }) => {
  test.skip(process.env.PERF_OWNER_SNAPSHOT !== '1', 'Set PERF_OWNER_SNAPSHOT=1 to run the local ownership diagnostic.');
  await page.goto('http://localhost:3886/');
  await page.waitForFunction(() => Boolean(
    (window as any).performanceBus
    && (window as any).chaosEngine?.isInitialized
    && (window as any).lottieAnimations?.isInitialized
  ), undefined, { timeout: 20_000 });
  await page.waitForTimeout(5_000);

  const report = await page.evaluate(() => {
    const owners = (window as any).animationRuntime?.getStats?.().owners || {};
    const ownerRows = Object.entries<any>(owners).map(([owner, counts]) => ({
      owner,
      total: Object.values<number>(counts).reduce((sum, value) => sum + Number(value || 0), 0),
      ...counts
    })).sort((a, b) => b.total - a.total);
    const surfaces = Array.from(document.querySelectorAll<HTMLElement>('canvas, svg, .bg, .bg-overlay, [class*="lottie-wrapper"]'))
      .map(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          element: element.id ? `#${element.id}` : `${element.tagName.toLowerCase()}.${element.className}`,
          pixels: Math.round(rect.width * rect.height),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          display: style.display,
          opacity: style.opacity,
          filter: style.filter,
          blend: style.mixBlendMode,
          willChange: style.willChange,
          transform: style.transform === 'none' ? 'none' : 'matrix'
        };
      })
      .filter(surface => surface.pixels > 0 && surface.display !== 'none')
      .sort((a, b) => b.pixels - a.pixels)
      .slice(0, 24);

    const cssAnimations = document.getAnimations().reduce<Record<string, number>>((counts, animation) => {
      const target = (animation.effect as KeyframeEffect | null)?.target as Element | null;
      const key = target?.id ? `#${target.id}` : target?.classList?.[0] ? `.${target.classList[0]}` : target?.tagName || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {});

    return {
      fps: (window as any).performanceBus?.metrics?.fps || 0,
      profile: (window as any).performanceProfileManager?.currentProfile || null,
      softwareRenderer: Boolean((window as any).chaosEngine?.softwareRenderer),
      ownerRows: ownerRows.slice(0, 30),
      runtimeOwnerCount: ownerRows.length,
      runtimeTokenCount: ownerRows.reduce((sum, row) => sum + row.total, 0),
      gsapChildren: (window as any).gsap?.globalTimeline?.getChildren?.(true, true, true)?.length || 0,
      cssAnimationCount: document.getAnimations().length,
      cssAnimations,
      surfaces
    };
  });

  console.log(`PERFORMANCE_OWNERS ${JSON.stringify(report)}`);
  expect(report.runtimeOwnerCount).toBeGreaterThan(0);
});
