// Lottie UI injector for control panel
// Reads /lotties/manifest.json and adds buttons under the existing effects grid.

async function fetchManifest() {
  try {
    const res = await fetch('/lotties/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (Array.isArray(json?.effects) ? json.effects : []);
  } catch { return []; }
}

function addButtons(effects) {
  if (!effects.length) return;
  const grid = document.querySelector('#lottieEffects .toggle-grid') || document.querySelector('.effects-layers-control .effect-toggles .toggle-grid') || document.querySelector('.effects-layers-control .toggle-grid');
  if (!grid) return;

  for (const e of effects) {
    if (!e?.id) continue;
    const item = document.createElement('div');
    item.className = 'toggle-item';
    const label = document.createElement('label');
    label.textContent = `Lottie: ${e.id}`;
    const btn = document.createElement('button');
    btn.className = 'effect-toggle-btn';
    btn.dataset.effect = `lottie:${e.id}`;
    btn.dataset.state = 'off';
    btn.textContent = 'OFF';
    item.appendChild(label); item.appendChild(btn);
    grid.appendChild(item);
  }
}

(async function(){
  const manifest = await fetchManifest();
  addButtons(manifest);
})();
