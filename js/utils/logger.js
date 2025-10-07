// Central Logger - Reduces console spam with levels, namespaces, and throttling
// Usage: const log = createLogger('mymodule'); log.debug('message');

const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4, trace: 5 };
let globalLevel = getInitialLevel();
let namespaces = getInitialNamespaces();
const lastByKey = new Map();

function getInitialLevel() {
  try {
    if (typeof window !== 'undefined') {
      const qp = new URLSearchParams(window.location.search);
      const lvl = qp.get('logLevel') || localStorage.getItem('log:level');
      if (lvl && LEVELS[lvl] !== undefined) return LEVELS[lvl];
      
      // Check if we're in development mode
      const isDev = window.location.hostname === 'localhost' || 
                   window.location.hostname.startsWith('127.') ||
                   window.location.hostname.includes('staging') ||
                   window.location.search.includes('dev=1');
      
      return isDev ? LEVELS.info : LEVELS.warn;
    }
  } catch (e) {
    // Silent fail
  }
  return LEVELS.warn;
}

function getInitialNamespaces() {
  try {
    if (typeof window !== 'undefined') {
      const qp = new URLSearchParams(window.location.search);
      const ns = qp.get('logNS') || localStorage.getItem('log:namespaces') || '';
      return new Set(ns.split(',').map(s => s.trim()).filter(Boolean));
    }
  } catch (e) {
    // Silent fail
  }
  return new Set();
}

function allowed(ns, level) {
  if (globalLevel < level) return false;
  
  // If no namespaces are configured, only show warn/error by default
  if (!namespaces.size) return level <= LEVELS.warn;
  
  // If namespaces are configured, only show logs for enabled namespaces
  return namespaces.has(ns) || namespaces.has('*');
}

/**
 * Create a namespaced logger
 * @param {string} ns - Namespace for this logger (e.g., 'anim', 'perf', 'chaos')
 * @returns {Object} Logger instance with level methods and utilities
 */
export function createLogger(ns = 'app') {
  const api = {};
  
  // Create level methods (error, warn, info, debug, trace)
  for (const [name, lvl] of Object.entries(LEVELS)) {
    if (name === 'silent') continue;
    
    api[name] = (...args) => {
      if (!allowed(ns, lvl)) return;
      
      const method = name === 'trace' ? 'debug' : name;
      // eslint-disable-next-line no-console
      console[method](`[${ns}]`, ...args);
    };
  }
  
  // Utility: log only once per key
  api.once = (key, fn) => {
    if (lastByKey.has(key)) return;
    lastByKey.set(key, Date.now());
    fn();
  };
  
  // Utility: throttle logging by key and time
  api.throttle = (key, ms, fn) => {
    const now = Date.now();
    const last = lastByKey.get(key) || 0;
    if (now - last < ms) return;
    lastByKey.set(key, now);
    fn();
  };
  
  // Utility: group logs when namespace is enabled
  api.group = (label, fn) => {
    if (!allowed(ns, LEVELS.debug)) {
      fn();
      return;
    }
    
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[${ns}] ${label}`);
    try {
      fn();
    } finally {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  };
  
  return api;
}

// Global logging controls
export const LOG = {
  setLevel: (name) => {
    if (LEVELS[name] !== undefined) {
      globalLevel = LEVELS[name];
      try {
        localStorage.setItem('log:level', name);
      } catch (e) {
        // Silent fail
      }
      console.info(`[logger] Level set to: ${name}`);
    }
  },
  
  getLevel: () => {
    return Object.entries(LEVELS).find(([,v]) => v === globalLevel)?.[0];
  },
  
  enable: (ns) => {
    namespaces.add(ns);
    try {
      localStorage.setItem('log:namespaces', [...namespaces].join(','));
    } catch (e) {
      // Silent fail
    }
    console.info(`[logger] Enabled namespace: ${ns}`);
  },
  
  disable: (ns) => {
    namespaces.delete(ns);
    try {
      localStorage.setItem('log:namespaces', [...namespaces].join(','));
    } catch (e) {
      // Silent fail
    }
    console.info(`[logger] Disabled namespace: ${ns}`);
  },
  
  enableAll: () => {
    namespaces.add('*');
    try {
      localStorage.setItem('log:namespaces', '*');
    } catch (e) {
      // Silent fail
    }
    console.info('[logger] Enabled all namespaces');
  },
  
  clear: () => {
    namespaces.clear();
    try {
      localStorage.removeItem('log:namespaces');
    } catch (e) {
      // Silent fail
    }
    console.info('[logger] Cleared all namespaces');
  },
  
  status: () => {
    return {
      level: Object.entries(LEVELS).find(([,v]) => v === globalLevel)?.[0],
      namespaces: [...namespaces],
      globalLevel
    };
  }
};

// Expose global controls
if (typeof window !== 'undefined') {
  window.__LOG = LOG;
  
  // Add developer hotkey: Shift+L to cycle log levels
  let lastKeyTime = 0;
  document.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'L') {
      const now = Date.now();
      if (now - lastKeyTime < 500) return; // Debounce
      lastKeyTime = now;
      
      const levels = ['silent', 'error', 'warn', 'info', 'debug', 'trace'];
      const currentLevel = LOG.getLevel() || 'warn';
      const currentIndex = levels.indexOf(currentLevel);
      const nextLevel = levels[(currentIndex + 1) % levels.length];
      
      LOG.setLevel(nextLevel);
      
      // Show toast notification
      showToast(`Log level: ${nextLevel}`);
    }
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    transition: opacity 0.3s;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 2000);
}

// Show initial status
if (typeof window !== 'undefined' && globalLevel >= LEVELS.info) {
  console.info('[logger] Initialized', LOG.status());
  console.info('[logger] Use window.__LOG to control logging, or Shift+L to cycle levels');
}