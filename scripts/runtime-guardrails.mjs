import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function moduleUrl(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return `${pathToFileURL(absolutePath).href}?runtimeGuard=${Date.now()}-${Math.random()}`;
}

function sourceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing source marker: ${startNeedle}`);

  const end = source.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing source marker: ${endNeedle}`);

  return source.slice(start, end);
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

await check('production entrypoint does not directly load debug or test modules', () => {
  const html = read('index.html');
  const blockedDirectScripts = [
    '/js/performance-inspector.js',
    '/js/dev/timer-instrumentation.js',
    '/js/test-fixes.js'
  ];

  blockedDirectScripts.forEach((scriptPath) => {
    assert.doesNotMatch(
      html,
      new RegExp(`<script[^>]+src=["']${scriptPath.replaceAll('/', '\\/')}["']`, 'i'),
      `${scriptPath} must be gated behind runtime-debug-loader`
    );
  });

  assert.match(html, /src=["']\/js\/runtime-debug-loader\.js["']/);
});

await check('chaos init does not statically import test/debug suites', () => {
  const source = read('js/chaos-init.js');
  const blockedImports = [
    'debug-console.js',
    'performance-ladder-test.js',
    'smart-preloader-test.js',
    'predictive-alerting-tests.js'
  ];

  blockedImports.forEach((importPath) => {
    assert.doesNotMatch(
      source,
      new RegExp(`^\\s*import\\s+.*${importPath.replace('.', '\\.')}`, 'm'),
      `${importPath} must be dynamically imported only when debug/tests are enabled`
    );
  });
});

await check('animation runtime exposes owner-scoped scheduling and disposal', async () => {
  const originals = {
    window: globalThis.window,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval
  };

  let nextId = 0;
  const cleared = [];

  globalThis.window = globalThis;
  globalThis.setTimeout = () => ({ type: 'timeout', id: ++nextId });
  globalThis.setInterval = () => ({ type: 'interval', id: ++nextId });
  globalThis.requestAnimationFrame = () => ({ type: 'raf', id: ++nextId });
  globalThis.clearTimeout = (handle) => cleared.push(handle);
  globalThis.clearInterval = (handle) => cleared.push(handle);
  globalThis.cancelAnimationFrame = (handle) => cleared.push(handle);

  try {
    const { default: animationRuntime } = await import(moduleUrl('js/runtime/animation-runtime.js'));

    const timeout = animationRuntime.scheduleTimeout('matrix', () => {}, 100);
    const interval = animationRuntime.scheduleInterval('matrix', () => {}, 100);
    const raf = animationRuntime.scheduleRafLoop('matrix', () => {});

    assert.equal(animationRuntime.getStats().owners.matrix.timeouts, 1);
    assert.equal(animationRuntime.getStats().owners.matrix.intervals, 1);
    assert.equal(animationRuntime.getStats().owners.matrix.rafLoops, 1);

    animationRuntime.disposeOwner('matrix');

    assert.ok(cleared.includes(timeout.handle), 'timeout handle cleared');
    assert.ok(cleared.includes(interval.handle), 'interval handle cleared');
    assert.ok(cleared.includes(raf.handle), 'raf handle cleared');
    assert.equal(animationRuntime.getStats().owners.matrix, undefined);
  } finally {
    globalThis.window = originals.window;
    globalThis.requestAnimationFrame = originals.requestAnimationFrame;
    globalThis.cancelAnimationFrame = originals.cancelAnimationFrame;
    globalThis.setTimeout = originals.setTimeout;
    globalThis.clearTimeout = originals.clearTimeout;
    globalThis.setInterval = originals.setInterval;
    globalThis.clearInterval = originals.clearInterval;
  }
});

await check('automatic performance optimizers do not freeze auto mode', () => {
  const optimizer = read('js/performance-optimizer.js');
  const optimizerV2 = read('js/performance-optimizer-v2.js');

  assert.doesNotMatch(
    optimizer,
    /window\.chaosInit\.phaseRunning\s*=\s*false/,
    'automatic optimizer must not stop the auto phase loop'
  );
  assert.doesNotMatch(
    optimizerV2,
    /animationPlayState\s*=\s*['"]paused['"]/,
    'automatic low-FPS optimizer must not pause CSS animations without owner recovery'
  );
  assert.match(
    optimizerV2,
    /lowFpsSampleCount/,
    'low-FPS optimization must require sustained low-FPS samples'
  );
  assert.match(
    optimizer,
    /startupGraceMs/,
    'legacy optimizer must ignore startup FPS noise'
  );
  assert.match(
    optimizer,
    /autoMaxOptimizationLevel/,
    'legacy optimizer must cap automatic optimization separately from manual emergency controls'
  );
  assert.match(
    optimizer,
    /optimizationRecoveryHoldMs/,
    'legacy optimizer must debounce automatic recovery to avoid level 1/2 thrashing'
  );
  assert.match(
    optimizer,
    /pendingOptimizationLevel/,
    'legacy optimizer must require a stable lower target before reducing optimization'
  );
  assert.doesNotMatch(
    optimizer,
    /newOptLevel\s*=\s*3/,
    'automatic optimizer must not escalate to heavy level 3'
  );
  assert.doesNotMatch(
    optimizer,
    /gsap\.killTweensOf\(el\)/,
    'medium auto optimization must soften effects without killing their tweens'
  );
  assert.match(
    optimizer,
    /softenNonEssentialEffects/,
    'medium auto optimization should keep recoverable softened effects'
  );
});

await check('performance optimizer v2 does not age GSAP timeline seconds as wall-clock time', () => {
  const optimizerV2 = read('js/performance-optimizer-v2.js');
  const staleCheck = sourceBetween(
    optimizerV2,
    '    isAnimationStale(animation',
    '    setupMemoryOptimizations()'
  );

  assert.match(
    staleCheck,
    /getAnimationWallClockCreatedAt/,
    'stale animation cleanup must derive age only from explicit wall-clock timestamps'
  );
  assert.doesNotMatch(
    staleCheck,
    /animation\._startTime|animation\.startTime/,
    'GSAP/anime timeline positions are not Date.now()-compatible timestamps'
  );
});

await check('auto mode bounds low-motion phase duration', () => {
  const chaosInit = read('js/chaos-init.js');
  const startAnimationPhases = sourceBetween(
    chaosInit,
    '    startAnimationPhases() {',
    '    stopAnimationPhases() {'
  );

  assert.match(
    chaosInit,
    /lowMotionPhaseMaxDurationMs/,
    'low-motion phases need a shorter cap than the global phase duration'
  );
  assert.match(
    chaosInit,
    /getPhaseDuration/,
    'auto mode should route scheduling through per-phase duration logic'
  );
  assert.match(
    startAnimationPhases,
    /getPhaseDuration\(choice\.name\)/,
    'auto mode must use the selected phase name when scheduling the next phase'
  );
});

await check('quality recovery keeps variety without disabling guardrails', () => {
  const optimizer = read('js/performance-optimizer.js');
  const lotties = read('js/lottie-animations.js');
  const matrix = read('js/matrix-messages.js');

  assert.match(
    optimizer,
    /maxActiveAnimations\s*=\s*(5\d|[6-9]\d|[1-9]\d{2,})/,
    'active animation budget should preserve visual richness'
  );
  assert.match(
    optimizer,
    /maxTotalAnimations\s*=\s*(1[2-9]\d|[2-9]\d{2,})/,
    'total animation budget should allow normal auto-mode variety'
  );
  assert.doesNotMatch(
    optimizer,
    /timeScale\(0\.5\)/,
    'automatic medium optimization must not halve all looping animation speed'
  );
  assert.match(
    lotties,
    /scheduleLottieCycle/,
    'lottie cycles should use a centralized stagger scheduler'
  );
  assert.doesNotMatch(
    lotties,
    /(135000|165000)/,
    'primary lottie variety should appear within the first auto-mode minute, not after several minutes'
  );
  assert.match(
    matrix,
    /autoDiceThreshold\s*=\s*(6\d|7[0-5])/,
    'standalone matrix rolls should not be so rare that messages effectively disappear'
  );
  assert.match(
    matrix,
    /matrixDiceRoll/,
    'matrix dice rolls should dispatch an observable roll event'
  );
  assert.match(
    matrix,
    /matrixMessageShown/,
    'matrix message display should dispatch an observable shown event'
  );
  assert.match(
    lotties,
    /safeStopPlayer/,
    'lottie fade-out should avoid dotLottie stop() calls while the player is still loading'
  );
});

await check('interval manager preserves essential cleanup timers', async () => {
  const originals = {
    window: globalThis.window,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval
  };

  let nextId = 0;
  let intervalManager;

  globalThis.window = globalThis;
  globalThis.setInterval = () => ({ type: 'interval', id: ++nextId });
  globalThis.clearInterval = () => {};

  try {
    const module = await import(moduleUrl('js/interval-manager.js'));
    intervalManager = module.default;
    intervalManager.emergencyStop();

    const essential = intervalManager.createInterval(
      () => {},
      5000,
      'essential-cleanup',
      { category: 'system', essential: true }
    );
    const transientA = intervalManager.createInterval(() => {}, 1000, 'transient-a');
    const transientB = intervalManager.createInterval(() => {}, 1000, 'transient-b');

    intervalManager.cleanupOldestIntervals(2);

    assert.equal(intervalManager.intervals.has(essential.id), true, 'essential interval should survive oldest cleanup');
    assert.equal(intervalManager.intervals.has(transientA.id), false, 'oldest transient interval should be cleaned');
    assert.equal(intervalManager.intervals.has(transientB.id), false, 'next transient interval should be cleaned');
  } finally {
    intervalManager?.destroy();
    globalThis.window = originals.window;
    globalThis.setInterval = originals.setInterval;
    globalThis.clearInterval = originals.clearInterval;
  }
});

await check('gsap registry cleanup uses stable ids and protected timers', () => {
  const registry = read('js/gsap-animation-registry.js');
  const createAnimation = sourceBetween(
    registry,
    'createAnimation(method, targets, vars',
    'Register an existing animation'
  );

  assert.match(
    createAnimation,
    /_3886_originalMethods/,
    'managed createAnimation must bypass patched GSAP methods to avoid double-registration id drift'
  );
  assert.doesNotMatch(
    createAnimation,
    /animation\s*=\s*gsap\.(to|from|fromTo|timeline)\(/,
    'managed createAnimation must not call patched gsap methods directly'
  );
  assert.match(
    createAnimation,
    /animation\._gsapRegistryId\s*=\s*animationId/,
    'managed animations must register with the same id used by cleanup callbacks'
  );
  assert.match(
    registry,
    /attachCompletionCleanup/,
    'auto-registered animations need completion cleanup even when not created through createAnimation'
  );
  assert.match(
    registry,
    /'gsap-periodic-cleanup'[\s\S]*essential:\s*true/,
    'GSAP periodic cleanup interval must be protected from oldest-interval cleanup'
  );
});

await check('subtle parallax does not create a gsap tween every frame', () => {
  const subtleEffects = read('js/subtle-effects.js');
  const addSubtleParallax = sourceBetween(
    subtleEffects,
    '    addSubtleParallax() {',
    'Easter eggs'
  );

  assert.doesNotMatch(
    addSubtleParallax,
    /requestAnimationFrame[\s\S]*gsap\.to|gsap\.to[\s\S]*requestAnimationFrame/,
    'RAF parallax loop must not create long-lived GSAP tweens every frame'
  );
  assert.match(
    addSubtleParallax,
    /quickSetter/,
    'RAF parallax should update existing transform state without registering tweens'
  );
  assert.match(
    subtleEffects,
    /parallaxRaf/,
    'parallax RAF handle must be tracked for cleanup'
  );
  assert.match(
    subtleEffects,
    /cancelAnimationFrame\(this\.parallaxRaf\)/,
    'parallax RAF loop must be cancelled on destroy'
  );
});

await check('performance profile manager owns stable quality targets', async () => {
  const originals = {
    window: globalThis.window,
    CustomEvent: globalThis.CustomEvent,
    localStorage: globalThis.localStorage
  };

  const events = [];
  const engine = {
    particleCount: 500,
    dprs: [],
    qualities: [],
    setPixelRatio(value) {
      this.dprs.push(value);
    },
    adjustPostProcessing(quality) {
      this.qualities.push(quality);
    }
  };

  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) {
      this.type = type;
      this.detail = init.detail;
    }
  };
  globalThis.localStorage = {
    setItem() {},
    getItem() { return null; },
    removeItem() {}
  };
  globalThis.window = {
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
    fxController: null
  };

  try {
    const { PerformanceProfileManager } = await import(moduleUrl('js/performance/profile-manager.js'));
    const manager = new PerformanceProfileManager({ engine });
    manager._basePixelRatio = 1;

    manager.applyProfile('medium', { reason: 'test' });
    engine.particleCount = 350;
    manager.applyProfile('high', { reason: 'test' });

    const particleCounts = events
      .filter(event => event.type === 'adjustParticles')
      .map(event => event.detail.count);

    assert.deepEqual(particleCounts, [350, 500], 'particle targets should be derived from the initial base count');
    assert.deepEqual(engine.qualities, ['medium', 'high']);
  } finally {
    globalThis.window = originals.window;
    globalThis.CustomEvent = originals.CustomEvent;
    globalThis.localStorage = originals.localStorage;
  }

  const profileManager = read('js/performance/profile-manager.js');
  const chaosEngine = read('js/chaos-engine.js');
  const performanceManager = read('js/performance-manager.js');
  const chaosInit = read('js/chaos-init.js');

  assert.match(
    profileManager,
    /_baseParticleCount/,
    'profile manager must keep a stable particle-count baseline'
  );
  assert.match(
    chaosInit,
    /__3886_PROFILE_MANAGER_ENABLED\s*=\s*true/,
    'chaos init must declare central profile ownership before legacy managers start'
  );
  assert.match(
    chaosEngine,
    /__3886_PROFILE_MANAGER_ENABLED[\s\S]*return/,
    'legacy chaos-engine adaptive loop must not run when profile manager owns quality'
  );
  assert.match(
    performanceManager,
    /profileManagerOwnsQuality/,
    'legacy performance manager must defer quality changes to the profile manager'
  );
});

if (failures.length > 0) {
  console.error(`\n${failures.length} runtime guardrail check(s) failed.`);
  process.exitCode = 1;
} else {
  console.log('\nAll runtime guardrails passed.');
}
