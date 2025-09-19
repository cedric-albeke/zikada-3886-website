import animeManager from './anime-init.js';

const anime = animeManager.anime;

function isEnabled() {
  const qp = new URLSearchParams(window.location.search);
  return qp.get('anime') === '1' || window.__ANIME_POC_ENABLED === true;
}

async function inlineSvgFromImg(img) {
  const src = img.getAttribute('src') || 'images/c01n.svg';
  const res = await fetch(src, { credentials: 'same-origin' });
  if (!res.ok) return null;
  const svgText = await res.text();
  const container = document.createElement('div');
  container.className = 'anime-logo-container';
  container.style.position = 'relative';
  img.insertAdjacentElement('afterend', container);
  container.innerHTML = svgText;
  const svg = container.querySelector('svg');
  if (!svg) return null;

  if (img.width) svg.style.width = img.width + 'px';
  if (img.height) svg.style.height = img.height + 'px';
  img.style.display = 'none';

  return { svg, container };
}

function primeStrokeStyles(svg) {
  const paths = svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse');
  paths.forEach(p => {
    const cs = window.getComputedStyle(p);
    if (cs.fill !== 'none') p.setAttribute('fill', 'none');
    p.setAttribute('stroke', '#00ff41'); // Neon green for cyberpunk aesthetic
    if (!p.getAttribute('stroke-width')) p.setAttribute('stroke-width', '2');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
  });
  return paths;
}

async function initLogoAnimation() {
  const img = document.querySelector('.image-2');
  if (!img) return;

  const result = await inlineSvgFromImg(img);
  if (!result) return;
  const { svg, container } = result;

  // Store elements for cleanup
  logoAnimationElements = { container, img, svg };

  const paths = primeStrokeStyles(svg);

  // Enhanced draw animation with multiple stages
  const drawIn = anime({
    targets: paths,
    strokeDashoffset: [anime.setDashoffset, 0],
    opacity: [0, 1],
    scale: [0.8, 1],
    duration: 2000,
    delay: anime.stagger(60, { from: 'center' }),
    easing: 'easeInOutCubic',
    autoplay: false
  });
  animeManager.register(drawIn, { critical: false, label: 'logo-draw-in' });

  // Reverse draw animation for smooth transitions
  const drawOut = anime({
    targets: paths,
    strokeDashoffset: [0, anime.setDashoffset],
    opacity: [1, 0],
    scale: [1, 0.8],
    duration: 1500,
    delay: anime.stagger(40, { from: 'last' }),
    easing: 'easeInOutCubic',
    autoplay: false,
    complete: () => {
      // Show original image after draw out
      if (img) {
        img.style.display = '';
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      logoAnimationActive = false;
      logoAnimationElements = null;
    }
  });
  animeManager.register(drawOut, { critical: false, label: 'logo-draw-out' });

  // Enhanced idle animation with multiple effects
  const idle = anime({
    targets: svg,
    opacity: [
      { value: 0.8, duration: 1500 },
      { value: 1, duration: 1500 },
      { value: 0.9, duration: 1000 },
      { value: 1, duration: 1000 }
    ],
    rotate: [0, 1, 0],
    easing: 'easeInOutSine',
    loop: true,
    autoplay: false
  });
  animeManager.register(idle, { critical: false, label: 'logo-idle' });

  // Glow pulse animation
  const glowPulse = anime({
    targets: paths,
    filter: [
      'drop-shadow(0 0 5px #00ff41)',
      'drop-shadow(0 0 15px #00ff41)',
      'drop-shadow(0 0 25px #00ff41)',
      'drop-shadow(0 0 15px #00ff41)',
      'drop-shadow(0 0 5px #00ff41)'
    ],
    duration: 3000,
    easing: 'easeInOutSine',
    loop: true,
    autoplay: false
  });
  animeManager.register(glowPulse, { critical: false, label: 'logo-glow-pulse' });

  // Enhanced morphing animation
  const morph = anime({
    targets: paths,
    strokeWidth: [2, 4, 3, 2],
    opacity: [1, 0.7, 0.9, 1],
    duration: 4000,
    easing: 'easeInOutQuad',
    loop: true,
    autoplay: false
  });
  animeManager.register(morph, { critical: false, label: 'logo-morph' });

  // Store animations for external access
  window.logoAnimations = {
    drawIn,
    drawOut,
    idle,
    glowPulse,
    morph,
    isActive: true
  };

  // Start with draw-in animation
  requestAnimationFrame(() => {
    drawIn.play();
    drawIn.finished?.then?.(() => {
      idle.play();
      glowPulse.play();
    });
  });

  function onPhase(e) {
    const phase = e?.detail?.phase ?? e?.detail;
    if (phase === 'intense') {
      idle.timeScale = 1.3;
      glowPulse.timeScale = 1.2;
      if (!morph.began || morph.paused) morph.play();
    } else if (phase === 'calm') {
      idle.timeScale = 0.7;
      glowPulse.timeScale = 0.8;
      morph.pause();
    } else {
      idle.timeScale = 1.0;
      glowPulse.timeScale = 1.0;
      morph.pause();
    }
  }

  // Store active pulse animations to prevent accumulation
  let activeMatrixPulse = null;
  let activeFlashPaths = null;

  function onMatrixMessage() {
    // Kill previous animations if still running
    if (activeMatrixPulse && !activeMatrixPulse.completed) {
      activeMatrixPulse.pause();
      animeManager.instances.delete(activeMatrixPulse);
    }
    if (activeFlashPaths && !activeFlashPaths.completed) {
      activeFlashPaths.pause();
      animeManager.instances.delete(activeFlashPaths);
    }

    // Enhanced matrix pulse with multiple effects
    activeMatrixPulse = anime({
      targets: svg,
      scale: [
        { value: 1.05, duration: 120 },
        { value: 0.98, duration: 180 },
        { value: 1.02, duration: 150 },
        { value: 1, duration: 200 }
      ],
      rotate: [0, 5, -3, 0],
      easing: 'easeOutElastic(1, .8)'
    });
    animeManager.register(activeMatrixPulse, { critical: false, label: 'logo-matrix-pulse' });

    // Add flash effect to paths
    activeFlashPaths = anime({
      targets: paths,
      opacity: [1, 0.3, 1],
      strokeWidth: [undefined, 6, undefined],
      duration: 400,
      easing: 'easeOutQuad'
    });
    animeManager.register(activeFlashPaths, { critical: false, label: 'logo-flash-paths' });
  }

  let activeManualPulse = null;

  function onLogoPulse() {
    // Kill previous animation if still running
    if (activeManualPulse && !activeManualPulse.completed) {
      activeManualPulse.pause();
      animeManager.instances.delete(activeManualPulse);
    }

    // Manual pulse trigger
    activeManualPulse = anime({
      targets: svg,
      scale: [1, 1.15, 1],
      opacity: [undefined, 0.8, undefined],
      duration: 800,
      easing: 'easeOutBounce'
    });
    animeManager.register(activeManualPulse, { critical: false, label: 'logo-manual-pulse' });
  }

  function onLogoGlowToggle() {
    if (glowPulse.paused) {
      glowPulse.play();
    } else {
      glowPulse.pause();
      // Reset to base glow
      anime({
        targets: paths,
        filter: 'drop-shadow(0 0 5px #00ff41)',
        duration: 300
      });
    }
  }

  // Enhanced event listeners
  window.addEventListener('animationPhase', onPhase);
  window.addEventListener('matrixMessage', onMatrixMessage);
  window.addEventListener('logoPulse', onLogoPulse);
  window.addEventListener('logoGlowToggle', onLogoGlowToggle);

  // Global functions for control panel integration
  window.triggerLogoPulse = onLogoPulse;
  window.toggleLogoGlow = onLogoGlowToggle;
  window.reverseLogoAnimation = () => {
    idle.pause();
    glowPulse.pause();
    morph.pause();
    drawOut.play();
  };

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener('animationPhase', onPhase);
      window.removeEventListener('matrixMessage', onMatrixMessage);
      window.removeEventListener('logoPulse', onLogoPulse);
      window.removeEventListener('logoGlowToggle', onLogoGlowToggle);
      animeManager.killAll();
      try { container.parentNode?.removeChild(container); } catch {}
      try { img.style.display = ''; } catch {}
    });
  }
}

// Global state for animation system
let logoAnimationActive = false;
let logoAnimationElements = null;

// Listen for anime enable/disable messages
window.addEventListener('storage', (e) => {
  if (e.key === '3886_vj_message') {
    try {
      const message = JSON.parse(e.newValue);
      if (message.type === 'anime_enable' && !logoAnimationActive) {
        enableLogoAnimation();
      } else if (message.type === 'anime_disable' && logoAnimationActive) {
        disableLogoAnimation();
      }
    } catch (err) {
      // Ignore JSON parse errors
    }
  }
});

// Listen for localStorage polling (same-tab communication)
let lastMessageId = null;
setInterval(() => {
  const messageData = localStorage.getItem('3886_vj_message');
  if (messageData) {
    try {
      const parsed = JSON.parse(messageData);
      if (parsed._id && parsed._id !== lastMessageId) {
        lastMessageId = parsed._id;
        if (parsed.type === 'anime_enable' && !logoAnimationActive) {
          enableLogoAnimation();
        } else if (parsed.type === 'anime_disable' && logoAnimationActive) {
          disableLogoAnimation();
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
}, 100);

function enableLogoAnimation() {
  if (logoAnimationActive) return;
  window.__ANIME_POC_ENABLED = true;
  logoAnimationActive = true;
  console.log('🎬 Enabling logo animations...');
  initLogoAnimation();
}

function disableLogoAnimation() {
  if (!logoAnimationActive) return;
  window.__ANIME_POC_ENABLED = false;
  logoAnimationActive = false;
  console.log('🛑 Disabling logo animations...');

  // Clean up animations and restore original logo
  if (logoAnimationElements) {
    const { container, img } = logoAnimationElements;
    animeManager.killAll();
    try {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    } catch {}
    try {
      if (img) {
        img.style.display = '';
      }
    } catch {}
    logoAnimationElements = null;
  }
}

// DO NOT auto-enable logo animation - let it start in normal mode
// Logo animation will be enabled/disabled via control panel only
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check if anime should be enabled via URL parameter only
    const qp = new URLSearchParams(window.location.search);
    if (qp.get('anime') === '1') {
      enableLogoAnimation();
    }
  }, { once: true });
} else {
  // Check if anime should be enabled via URL parameter only
  const qp = new URLSearchParams(window.location.search);
  if (qp.get('anime') === '1') {
    enableLogoAnimation();
  }
}