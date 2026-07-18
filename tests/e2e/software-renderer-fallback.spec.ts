import { test, expect } from '@playwright/test';

test('software WebGL starts directly in the low-cost safety path', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3886/');

  await expect.poll(async () => page.evaluate(() => Boolean(
    (window as any).chaosEngine?.isInitialized && (window as any).performanceProfile
  )), { timeout: 20_000 }).toBeTruthy();

  const state = await page.evaluate(() => {
    const engine = (window as any).chaosEngine;
    return {
      softwareRenderer: engine.softwareRenderer,
      rendererInfo: engine.rendererInfo,
      composerPresent: Boolean(engine.composer),
      particleCount: engine.particleCount,
      renderFpsCap: engine.renderFpsCap,
      pixelRatio: engine.renderer?.getPixelRatio?.(),
      profile: (window as any).performanceProfile,
      blendModes: ['.bg-overlay', '#ambient-effects-canvas']
        .map(selector => document.querySelector(selector))
        .filter(Boolean)
        .map(node => getComputedStyle(node as Element).mixBlendMode),
      plasmaAllocated: Boolean(document.getElementById('plasma-field-canvas'))
    };
  });

  expect(state.rendererInfo).toMatch(/swiftshader|llvmpipe|software|microsoft basic render|\bwarp\b/i);
  expect(state.softwareRenderer).toBe(true);
  expect(state.composerPresent).toBe(false);
  expect(state.particleCount).toBeLessThanOrEqual(120);
  expect(state.renderFpsCap).toBeLessThanOrEqual(24);
  expect(state.pixelRatio).toBeLessThanOrEqual(0.5);
  expect(state.profile).toBe('low');
  expect(state.blendModes.every(mode => mode === 'normal')).toBe(true);
  expect(state.plasmaAllocated).toBe(false);
  expect(errors).toEqual([]);
});

test('plasma is lazy, bounded and fully resettable', async ({ page }) => {
  await page.goto('http://localhost:3886/');
  await page.waitForFunction(() => Boolean((window as any).animeEnhancedEffects));

  const started = await page.evaluate(() => {
    (window as any).visualEffectsController.enablePlasmaField();
    const canvas = document.getElementById('plasma-field-canvas') as HTMLCanvasElement | null;
    const owner = (window as any).animationRuntime?.getStats?.().owners?.['anime-enhanced-effects:plasma'];
    return {
      exists: Boolean(canvas),
      width: canvas?.width,
      height: canvas?.height,
      filter: canvas ? getComputedStyle(canvas).filter : null,
      display: canvas ? getComputedStyle(canvas).display : null,
      rafLoops: owner?.rafLoops || 0
    };
  });

  expect(started).toMatchObject({ exists: true, width: 192, height: 192, filter: 'none', display: 'block', rafLoops: 1 });

  await page.evaluate(() => (window as any).visualEffectsController.disablePlasmaField());
  await page.waitForTimeout(750);
  const stopped = await page.evaluate(() => ({
    display: getComputedStyle(document.getElementById('plasma-field-canvas')!).display,
    owner: (window as any).animationRuntime?.getStats?.().owners?.['anime-enhanced-effects:plasma'] || null
  }));
  expect(stopped.display).toBe('none');
  expect(stopped.owner).toBeNull();
});

test('ambient families share bounded renderers instead of duplicating fullscreen layers', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3886/');
  await expect.poll(async () => page.evaluate(() => Boolean(
    (window as any).chaosEngine?.isInitialized
      && (window as any).animeEnhancedEffects?.enabled
      && document.getElementById('ambient-effects-canvas')
  )), { timeout: 20_000 }).toBeTruthy();

  const baseline = await page.evaluate(() => {
    const bgRect = document.querySelector('.bg')?.getBoundingClientRect();
    const beehive = document.querySelector('.beehive-bg-container');
    return {
      scanlineLayers: document.querySelectorAll('.scanlines').length,
      ambientCanvas: document.querySelectorAll('#ambient-effects-canvas').length,
      legacyAmbientLayers: document.querySelectorAll([
        '#matrix-rain-safe', '#cyber-grid', '#static-noise',
        '#cyber-grid-overlay', '#scanlines-overlay', '#cyber-grid-effect',
        '#scanlines-effect', '#digital-noise-effect', '#film-grain-effect', '#grain-overlay'
      ].join(',')).length,
      ambientStats: (window as any).ambientCanvasRenderer?.getStats?.(),
      duplicateParticles: document.querySelectorAll('.anime-particles').length,
      duplicateStreams: document.querySelectorAll('.anime-data-streams').length,
      primaryStreams: document.querySelectorAll('.data-streams').length,
      primaryParticles: Boolean((window as any).chaosEngine?.particles),
      beehiveChildren: beehive?.children.length || 0,
      beehiveOwners: (window as any).animationRuntime?.getStats?.().owners?.['beehive-background']?.nodes || 0,
      backgroundWidthRatio: bgRect ? bgRect.width / innerWidth : Infinity,
      backgroundHeightRatio: bgRect ? bgRect.height / innerHeight : Infinity
    };
  });

  expect(baseline).toMatchObject({
    scanlineLayers: 0,
    ambientCanvas: 1,
    legacyAmbientLayers: 0,
    duplicateParticles: 0,
    duplicateStreams: 0,
    primaryStreams: 1,
    primaryParticles: true
  });
  expect(baseline.ambientStats).toMatchObject({
    profile: 'low',
    width: 720,
    height: 405,
    channels: {
      matrix: { enabled: true },
      cyberGrid: { enabled: true },
      noise: { enabled: true, strength: 0.25 },
      scanlines: { enabled: true, strength: 0.035 },
      filmGrain: { enabled: false }
    },
    owners: { rafLoops: 1 }
  });
  expect(baseline.beehiveChildren).toBeLessThanOrEqual(5);
  expect(baseline.beehiveOwners).toBeGreaterThanOrEqual(1);
  expect(baseline.backgroundWidthRatio).toBeLessThanOrEqual(1.12);
  expect(baseline.backgroundHeightRatio).toBeLessThanOrEqual(1.12);

  const noiseOff = await page.evaluate(() => {
    (window as any).fxController.setIntensity({ noise: 0 });
    const canvas = document.getElementById('ambient-effects-canvas')!;
    const stats = (window as any).ambientCanvasRenderer.getStats();
    return {
      display: getComputedStyle(canvas).display,
      opacity: getComputedStyle(canvas).opacity,
      noiseStrength: (window as any).chaosInitializer?._ambientNoiseStrength,
      noiseEnabled: stats.channels.noise.enabled,
      scanlines: stats.channels.scanlines.enabled,
      rafLoops: stats.owners?.rafLoops || 0
    };
  });
  expect(noiseOff).toEqual({
    display: 'block',
    opacity: '1',
    noiseStrength: 0,
    noiseEnabled: false,
    scanlines: true,
    rafLoops: 1
  });

  const channelIsolation = await page.evaluate(() => {
    const fx = (window as any).fxController;
    fx.setEffectEnabled('cyberGrid', false);
    fx.setEffectEnabled('scanlines', true);
    fx.setEffectEnabled('filmgrain', true);
    const active = (window as any).ambientCanvasRenderer.getStats();
    fx.setEffectEnabled('filmgrain', false);
    fx.setEffectEnabled('scanlines', false);
    const restored = (window as any).ambientCanvasRenderer.getStats();
    return {
      cyberGrid: active.channels.cyberGrid.enabled,
      activeScanlineStrength: active.channels.scanlines.strength,
      activeFilmGrain: active.channels.filmGrain.enabled,
      restoredScanlineStrength: restored.channels.scanlines.strength,
      canvasCount: document.querySelectorAll('#ambient-effects-canvas').length,
      legacyLayers: document.querySelectorAll('#cyber-grid-overlay, #scanlines-overlay, #grain-overlay').length
    };
  });
  expect(channelIsolation).toEqual({
    cyberGrid: false,
    activeScanlineStrength: 0.14,
    activeFilmGrain: true,
    restoredScanlineStrength: 0.035,
    canvasCount: 1,
    legacyLayers: 0
  });

  await page.evaluate(() => (window as any).fxController.setIntensity({ noise: 0.25 }));
});
