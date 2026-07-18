import { test, expect, Page } from '@playwright/test';

type AblationSample = {
  fps: number;
  profile: string | null;
  runtimeTokens: number;
  activeLottie: number;
};

const enabled = process.env.PERF_ABLATION === '1';
const sampleSeconds = Math.max(4, Number(process.env.PERF_ABLATION_SECS || 6));

async function sample(page: Page): Promise<Record<string, number | string | null>> {
  const samples: AblationSample[] = [];
  const deadline = Date.now() + sampleSeconds * 1000;
  while (Date.now() < deadline) {
    samples.push(await page.evaluate(() => {
      const owners = (window as any).animationRuntime?.getStats?.().owners || {};
      const runtimeTokens = Object.values<any>(owners).reduce((total: number, owner: any) => (
        total + Object.values<number>(owner).reduce((sum, value) => sum + Number(value || 0), 0)
      ), 0);
      return {
        fps: Number((window as any).performanceBus?.metrics?.fps || 0),
        profile: (window as any).performanceProfileManager?.currentProfile || null,
        runtimeTokens,
        activeLottie: Object.values<any>((window as any).lottieAnimations?.visibleStates || {})
          .filter(Boolean).length
      };
    }));
    await page.waitForTimeout(500);
  }

  const fps = samples.map(entry => entry.fps).filter(value => value > 0);
  const ordered = [...fps].sort((a, b) => a - b);
  return {
    averageFps: fps.length ? Number((fps.reduce((sum, value) => sum + value, 0) / fps.length).toFixed(2)) : 0,
    minimumFps: ordered[0] || 0,
    p10Fps: ordered[Math.floor(Math.max(0, ordered.length - 1) * 0.1)] || 0,
    maximumFps: ordered.at(-1) || 0,
    profile: samples.at(-1)?.profile || null,
    runtimeTokens: samples.at(-1)?.runtimeTokens || 0,
    activeLottie: samples.at(-1)?.activeLottie || 0
  };
}

test.describe('performance ablation', () => {
  test.skip(!enabled, 'Set PERF_ABLATION=1 to run the local renderer diagnostic.');

  test('attributes main-thread frame pressure without weakening visual contracts', async ({ context }) => {
    test.setTimeout(120_000);
    const main = await context.newPage();
    await main.goto('http://localhost:3886/');
    await main.waitForFunction(() => Boolean(
      (window as any).performanceBus
      && (window as any).chaosEngine?.isInitialized
      && (window as any).lottieAnimations?.isInitialized
    ), undefined, { timeout: 20_000 });

    // Freeze phase transitions so each sample differs by one renderer owner,
    // not by whatever visual family happened to rotate in during the window.
    await main.evaluate(() => (window as any).chaosInitializer?.stopAnimationPhases?.());
    await main.waitForTimeout(2_000);

    const results: Record<string, Record<string, number | string | null>> = {};
    results.mainOnly = await sample(main);

    const panel = await context.newPage();
    await panel.goto('http://localhost:3886/control-panel-v3.html');
    await panel.waitForLoadState('domcontentloaded');
    results.mainWithPanel = await sample(main);
    await panel.close();
    results.mainAfterPanel = await sample(main);

    await main.evaluate(() => (window as any).ambientCanvasRenderer?.pause?.());
    results.withoutAmbientCanvas = await sample(main);
    await main.evaluate(() => (window as any).ambientCanvasRenderer?.start?.());

    await main.evaluate(() => (window as any).chaosEngine?.stop?.());
    results.withoutWebGl = await sample(main);
    await main.evaluate(() => (window as any).chaosEngine?.start?.());

    await main.evaluate(() => (window as any).lottieAnimations?.pauseAll?.());
    results.withoutLottiePlayback = await sample(main);
    await main.evaluate(() => (window as any).lottieAnimations?.resumeAll?.());

    await main.evaluate(() => {
      const runtime = (window as any).animationRuntime;
      ['background-animator', 'beehive-background', 'random-animations']
        .forEach(owner => runtime?.pauseOwnerAnimations?.(owner));
    });
    results.withoutAmbientGsap = await sample(main);
    await main.evaluate(() => {
      const runtime = (window as any).animationRuntime;
      ['background-animator', 'beehive-background', 'random-animations']
        .forEach(owner => runtime?.resumeOwnerAnimations?.(owner));
    });

    console.log(`PERFORMANCE_ABLATION ${JSON.stringify(results)}`);
    expect(Object.values(results).every(result => Number(result.averageFps) > 0)).toBeTruthy();
  });
});
