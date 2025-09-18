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

  const draw = anime({
    targets: paths,
    strokeDashoffset: [anime.setDashoffset, 0],
    duration: 1400,
    delay: anime.stagger(40, { from: 'center' }),
    easing: 'easeInOutSine',
    autoplay: false
  });
  animeManager.register(draw, { critical: false, label: 'logo-draw' });

  const idle = anime({
    targets: svg,
    opacity: [{ value: 0.85, duration: 1200 }, { value: 1, duration: 1200 }],
    easing: 'linear',
    loop: true,
    direction: 'alternate',
    autoplay: false
  });
  animeManager.register(idle, { critical: false, label: 'logo-idle' });

  requestAnimationFrame(() => {
    draw.play();
    (draw.finished?.then?.(() => idle.play())) || idle.play();
  });

  function onPhase(e) {
    const phase = e?.detail?.phase ?? e?.detail;
    if (phase === 'intense') {
      anime.speed = 1.2;
    } else if (phase === 'calm') {
      anime.speed = 0.9;
    } else {
      anime.speed = 1.0;
    }
  }
  function onMatrixMessage() {
    idle.pause();
    const pulse = anime({
      targets: svg,
      scale: [{ value: 1.02, duration: 90 }, { value: 1, duration: 260 }],
      easing: 'easeOutQuad'
    });
    animeManager.register(pulse, { critical: false, label: 'logo-pulse' });
    (pulse.finished?.then?.(() => idle.play())) || idle.play();
  }

  window.addEventListener('animationPhase', onPhase);
  window.addEventListener('matrixMessage', onMatrixMessage);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener('animationPhase', onPhase);
      window.removeEventListener('matrixMessage', onMatrixMessage);
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