/**
 * ============================================
 * ZIKADA 3886 - CONTROL PANEL LIVE LOGS
 * ============================================
 * 
 * Live console logs UI for the control panel's PERFORMANCE.STATUS panel
 * Shows real-time logs from index page with filtering and controls
 */

import { logBus } from './logger-bus.js';

export function mountLiveLogsUI({
  panelSelector = '.matrix-live-console',
  sourceMatches = ['index', '/index.html', '/'], // prioritize main animation page
  maxLines = 400
} = {}) {
  const panel = document.querySelector(panelSelector);
  if (!panel) {
    console.warn('[LiveLogs] Live Console panel not found at selector:', panelSelector);
    return;
  }

  // State
  const state = {
    paused: false,
    autoscroll: true,
    levels: new Set(['log', 'warn', 'error']),
    maxLines
  };

  // Build UI directly into panel (no extra wrapper)
  const toolbar = document.createElement('div');
  toolbar.className = 'live-logs__toolbar';
  panel.appendChild(toolbar);

  const mkChip = (label, level) => {
    const btn = document.createElement('button');
    btn.className = 'live-logs__chip is-on';
    btn.type = 'button';
    btn.dataset.level = level;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (state.levels.has(level)) {
        state.levels.delete(level);
        btn.classList.remove('is-on');
      } else {
        state.levels.add(level);
        btn.classList.add('is-on');
      }
    });
    return btn;
  };

  const chipInfo = mkChip('I', 'log');
  const chipWarn = mkChip('W', 'warn');
  const chipError = mkChip('E', 'error');
  toolbar.appendChild(chipInfo);
  toolbar.appendChild(chipWarn);
  toolbar.appendChild(chipError);

  const mkBtn = (label, cls, onClick) => {
    const btn = document.createElement('button');
    btn.className = `live-logs__btn ${cls}`;
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  };

  const btnPause = mkBtn('⏸', 'btn-pause', () => {
    state.paused = !state.paused;
    btnPause.textContent = state.paused ? '▶' : '⏸';
  });
  btnPause.setAttribute('title', 'Pause/Resume logs');
  btnPause.setAttribute('aria-label', 'Pause or resume log streaming');
  
  const btnClear = mkBtn('CLEAR', 'btn-clear', () => {
    stream.innerHTML = '';
  });
  btnClear.setAttribute('title', 'Clear all logs');
  btnClear.setAttribute('aria-label', 'Clear all log messages');
  
  const btnScroll = mkBtn('↓ ON', 'btn-scroll', () => {
    state.autoscroll = !state.autoscroll;
    btnScroll.textContent = `↓ ${state.autoscroll ? 'ON' : 'OFF'}`;
  });
  btnScroll.setAttribute('title', 'Toggle autoscroll');
  btnScroll.setAttribute('aria-label', 'Toggle automatic scrolling to latest logs');
  
  toolbar.appendChild(btnPause);
  toolbar.appendChild(btnScroll);
  toolbar.appendChild(btnClear);

  const stream = document.createElement('div');
  stream.className = 'live-logs__stream';
  stream.setAttribute('aria-live', 'polite');
  panel.appendChild(stream);

  const nearBottom = () => (stream.scrollHeight - stream.scrollTop - stream.clientHeight) < 8;

  const formatArgs = (args) => {
    return args.map(a => {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (typeof a === 'object') {
        try { return JSON.stringify(a); } catch { return '[Unserializable]'; }
      }
      return String(a);
    }).join(' ');
  };

  const addLine = (msg) => {
    if (state.paused) return;
    if (!state.levels.has(msg.level)) return;

    // Filter by source
    const src = msg.source || '';
    const match = sourceMatches.some(s => {
      if (s instanceof RegExp) return s.test(src);
      return src.includes(s);
    });
    if (!match) return;

    const autoscrollNow = nearBottom();

    const el = document.createElement('div');
    el.className = `live-logs__line log--${msg.level}`;

    const ts = document.createElement('span');
    ts.className = 'live-logs__time';
    const t = new Date(msg.t);
    ts.textContent = `[${t.toLocaleTimeString()}]`;
    el.appendChild(ts);

    const tag = document.createElement('span');
    tag.className = 'live-logs__tag';
    tag.textContent = msg.level.toUpperCase();
    el.appendChild(tag);

    const body = document.createElement('span');
    body.className = 'live-logs__msg';
    body.textContent = formatArgs(msg.args || []);
    el.appendChild(body);

    stream.appendChild(el);
    // Trim
    while (stream.children.length > state.maxLines) {
      stream.removeChild(stream.firstChild);
    }
    if (state.autoscroll && autoscrollNow) {
      stream.scrollTop = stream.scrollHeight;
    }
  };

  // Initial backlog
  try {
    const backlog = logBus.getBuffer({ source: sourceMatches });
    backlog.forEach(addLine);
    stream.scrollTop = stream.scrollHeight;
  } catch (e) {}

  // Live updates
  const unsubscribe = logBus.subscribe(addLine);

  // Optional: return teardown
  return () => unsubscribe();
}

// Auto-mount on page load
document.addEventListener('DOMContentLoaded', () => {
  try {
    mountLiveLogsUI();
    console.log('🎛️ Live logs UI mounted successfully');
  } catch (e) {
    console.warn('[LiveLogs] Failed to mount UI:', e);
  }
});