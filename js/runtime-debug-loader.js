const params = new URLSearchParams(window.location.search);

const isEnabled = (...keys) => keys.some((key) => {
    if (params.get(key) === '1' || params.get(key) === 'true') return true;
    if (localStorage.getItem(`ZIKADA_${key.toUpperCase()}`) === '1') return true;
    return false;
});

const debugEnabled = isEnabled('debug', 'debugtools');
const testsEnabled = isEnabled('tests', 'runtimetests');
const perfDebugEnabled = debugEnabled || isEnabled('debugperf');
const timerDebugEnabled = debugEnabled || params.get('debug') === 'timers' || isEnabled('timers');

async function loadOptionalModule(label, importer) {
    try {
        await importer();
        console.log(`[runtime-debug] ${label} loaded`);
    } catch (error) {
        console.warn(`[runtime-debug] ${label} failed to load`, error);
    }
}

if (perfDebugEnabled) {
    loadOptionalModule('performance inspector', () => import('/js/performance-inspector.js'));
}

if (timerDebugEnabled) {
    loadOptionalModule('timer instrumentation', () => import('/js/dev/timer-instrumentation.js'));
}

if (debugEnabled) {
    loadOptionalModule('debug console', () => import('/js/debug-console.js'));
}

if (testsEnabled) {
    loadOptionalModule('fix verification tests', () => import('/js/test-fixes.js'));
}
