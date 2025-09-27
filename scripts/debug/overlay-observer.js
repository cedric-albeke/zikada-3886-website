(function(){
  if (window.__overlayObserver) {
    console.warn('overlay-observer already installed');
    return;
  }
  const log = [];
  const stamp = () => new Date().toISOString();

  function entry(type, node, extra = {}) {
    const id = node?.id || null;
    const cls = node?.className || null;
    const z = node?.style?.zIndex || getComputedStyle(node).zIndex || null;
    return { t: stamp(), type, id, cls, z, ...extra };
  }

  function observeTarget(target) {
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach(n => log.push(entry('added', n)));
          m.removedNodes.forEach(n => log.push(entry('removed', n)));
        } else if (m.type === 'attributes' && m.attributeName === 'style') {
          log.push(entry('style', m.target, { style: m.target.getAttribute('style') }));
        }
      }
    });
    mo.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    return mo;
  }

  const observers = [];
  const start = () => {
    // Body
    observers.push(observeTarget(document.body));
    // FX root
    const fx = document.getElementById('fx-root');
    if (fx) observers.push(observeTarget(fx));
    console.log('[overlay-observer] started');
  };
  const stop = () => {
    observers.forEach(o => o.disconnect());
    console.log('[overlay-observer] stopped');
  };
  const dump = () => log.slice();

  window.__overlayObserver = { start, stop, dump, log };
  // auto-start
  start();
})();
