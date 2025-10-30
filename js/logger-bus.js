/**
 * ============================================
 * ZIKADA 3886 - CONSOLE LOGGER BUS
 * ============================================
 * 
 * Cross-tab console log broadcasting system using BroadcastChannel
 * with localStorage fallback for real-time log streaming
 */

const CHANNEL = 'zikada-console-v1';
const BUFFER_KEY = 'zikada:logBuffer';
const SIGNAL_KEY = 'zikada:logSignal';
const MAX_BUFFER = 250;

const subscribers = new Set();
const memBuffer = [];
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

function safeSerialize(inputArgs, maxDepth = 3) {
  const seen = new WeakSet();
  const serialize = (val, depth) => {
    if (depth > maxDepth) return '[…]';
    if (val === undefined) return 'undefined';
    if (val === null) return null;
    const t = typeof val;
    if (t === 'string' || t === 'number' || t === 'boolean') return val;
    if (t === 'function') return `[fn ${val.name || 'anonymous'}]`;
    if (val instanceof Error) return { name: val.name, message: val.message, stack: val.stack };
    if (typeof Element !== 'undefined' && val instanceof Element) {
      const id = val.id ? `#${val.id}` : '';
      const cls = val.classList && val.classList.length ? '.' + [...val.classList].join('.') : '';
      return `[<${val.tagName.toLowerCase()}${id}${cls}>]`;
    }
    if (Array.isArray(val)) return val.map(v => serialize(v, depth + 1));
    if (t === 'object') {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
      const out = {};
      const keys = Object.keys(val).slice(0, 50);
      for (const k of keys) out[k] = serialize(val[k], depth + 1);
      return out;
    }
    try { return String(val); } catch { return '[Unserializable]'; }
  };
  return inputArgs.map(a => serialize(a, 0));
}

function appendToBuffers(msg) {
  memBuffer.push(msg);
  if (memBuffer.length > MAX_BUFFER) memBuffer.shift();
  try {
    const arr = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]');
    arr.push(msg);
    while (arr.length > MAX_BUFFER) arr.shift();
    localStorage.setItem(BUFFER_KEY, JSON.stringify(arr));
  } catch (e) {
    // ignore quota or JSON errors
  }
}

function storageBroadcast(msg) {
  try {
    localStorage.setItem(SIGNAL_KEY, JSON.stringify({ t: Date.now(), msg }));
    localStorage.removeItem(SIGNAL_KEY);
  } catch (e) {}
}

function send(msg) {
  appendToBuffers(msg);
  if (bc) {
    try { bc.postMessage(msg); } catch (e) { storageBroadcast(msg); }
  } else {
    storageBroadcast(msg);
  }
}

function onBroadcastMessage(data) {
  subscribers.forEach(fn => {
    try { fn(data); } catch (e) {}
  });
}

if (bc) {
  bc.addEventListener('message', ev => onBroadcastMessage(ev.data));
}
window.addEventListener('storage', ev => {
  if (ev.key === SIGNAL_KEY && ev.newValue) {
    try {
      const parsed = JSON.parse(ev.newValue);
      onBroadcastMessage(parsed.msg);
    } catch (e) {}
  }
});

function subscribe(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function getBuffer(filter) {
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(BUFFER_KEY) || '[]'); } catch {}
  if (filter) {
    arr = arr.filter(m => {
      const byLevel = !filter.level || filter.level.includes(m.level);
      const bySource = !filter.source || filter.source.some(s => (m.source || '').includes(s));
      return byLevel && bySource;
    });
  }
  return arr;
}

function installConsoleInterceptor({ sourceTag = window.location.pathname } = {}) {
  ['log', 'warn', 'error'].forEach(level => {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      try {
        send({ t: Date.now(), level, source: sourceTag, args: safeSerialize(args) });
      } catch (e) {}
      orig(...args);
    };
  });

  window.addEventListener('error', (e) => {
    try {
      send({
        t: Date.now(),
        level: 'error',
        source: sourceTag,
        args: safeSerialize([`Error: ${e.message}`, `${e.filename}:${e.lineno}:${e.colno}`, e.error || null])
      });
    } catch (e2) {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      send({
        t: Date.now(),
        level: 'error',
        source: sourceTag,
        args: safeSerialize(['UnhandledRejection', e.reason])
      });
    } catch (e2) {}
  });
}

export const logBus = { subscribe, getBuffer, installConsoleInterceptor, send, safeSerialize };
export default logBus;