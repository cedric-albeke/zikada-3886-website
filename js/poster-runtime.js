// Poster runtime: shows a static poster as background and fades it out when app is ready.
// Safe to import early. No DOM access before document is available.

(function initPosterRuntime(){
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const fadeOut = () => {
    const el = document.getElementById('poster-backdrop');
    if (!el) return;
    // Use CSS transition to fade out, then remove
    el.style.opacity = '0';
    setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }, 600);
  };

  // If the app becomes ready, fade out poster
  window.addEventListener('app:ready', () => {
    fadeOut();
  });

  // Fallback: if the app signals low-performance bootstrap or chaos engine init, also fade
  window.addEventListener('chaos:restart-animations', () => fadeOut());

  // Safety: If poster is still visible after 15s, fade it out to avoid getting stuck
  setTimeout(() => {
    const el = document.getElementById('poster-backdrop');
    if (el) fadeOut();
  }, 15000);
})();