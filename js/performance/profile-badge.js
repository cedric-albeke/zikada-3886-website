// Performance profile badge for control-panel: shows current profile
// and provides quick lock/unlock controls.

(function initProfileBadge(){
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // Control Panel only
  const onDom = () => {
    try {
      const header = document.getElementById('mainHeader') || document.body;
      const wrap = document.createElement('div');
      wrap.id = 'profile-badge';
      wrap.style.cssText = `
        position: absolute; right: 12px; top: 12px; z-index: 99999;
        font-family: 'Space Mono', monospace; font-size: 12px;
        color: #00ff85; background: rgba(0,0,0,0.55);
        border: 1px solid rgba(0,255,133,0.3); border-radius: 6px; padding: 8px 10px;
        display: flex; align-items: center; gap: 8px;
      `;
      wrap.innerHTML = `
        <span style="opacity:.85">PROFILE:</span>
        <strong id="profile-badge-state" style="color:#00ff85">?</strong>
        <button data-act="auto"  style="background:#0b0b0b;color:#ddd;border:1px solid #2a2a2a;border-radius:4px;padding:2px 6px;cursor:pointer">AUTO</button>
        <button data-act="high"  style="background:#0b0b0b;color:#ddd;border:1px solid #2a2a2a;border-radius:4px;padding:2px 6px;cursor:pointer">H</button>
        <button data-act="medium"style="background:#0b0b0b;color:#ddd;border:1px solid #2a2a2a;border-radius:4px;padding:2px 6px;cursor:pointer">M</button>
        <button data-act="low"   style="background:#0b0b0b;color:#ddd;border:1px solid #2a2a2a;border-radius:4px;padding:2px 6px;cursor:pointer">L</button>
      `;
      header.appendChild(wrap);

      const stateEl = wrap.querySelector('#profile-badge-state');
      const update = (p, locked) => {
        if (stateEl) stateEl.textContent = locked ? `${p.toUpperCase()} (LOCK)` : p.toUpperCase();
      };

      // Initial
      try {
        const mgr = window.performanceProfileManager;
        if (mgr) update(mgr.currentProfile || window.performanceProfile || 'high', !!mgr._lockProfile);
        else update(window.performanceProfile || 'high', false);
      } catch(_) {}

      // Controls
      wrap.querySelectorAll('button[data-act]').forEach((btn)=>{
        btn.addEventListener('click', ()=>{
          const act = btn.getAttribute('data-act');
          const mgr = window.performanceProfileManager;
          if (!mgr) return;
          if (act === 'auto') {
            mgr.setLockProfile(null);
          } else if (act === 'high' || act === 'medium' || act === 'low') {
            mgr.setLockProfile(act);
          }
        });
      });

      // Listen for changes
      window.addEventListener('profile:changed', (e)=>{
        const d = e.detail || {}; update(d.profile || 'high', !!d.locked);
      });

    } catch (e) {
      console.warn('[profile-badge] failed to initialize', e);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDom, { once: true });
  } else {
    onDom();
  }
})();
