// Control Panel Live Preview via Tab Capture

async function startPreview() {
  const startBtn = document.getElementById('startPreviewBtn');
  const stopBtn = document.getElementById('stopPreviewBtn');
  const overlay = document.getElementById('previewOverlay');
  const video = document.getElementById('livePreviewVideo');
  const container = overlay?.closest('.live-preview');
  try {
    // Ask user to select the Animation tab
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { ideal: 15, max: 20 },
        width: { ideal: 854, max: 854 },  // ~480p aspect (16:9)
        height: { ideal: 480, max: 480 }
      },
      audio: false
    });

    // Attach stream
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      video.src = URL.createObjectURL(stream);
    }
    await video.play().catch(() => {});

    // Toggle UI (hide overlay via CSS; keep it available on hover)
    container?.classList.add('streaming');
    stopBtn?.classList.remove('hidden');
    startBtn?.classList.add('hidden');

    // When user stops sharing
    const [track] = stream.getVideoTracks();
    try { track.contentHint = 'motion'; } catch {}
    track.addEventListener('ended', () => {
      stopPreview();
    });

    // Store to window for easy manual stop
    window.previewStream = stream;
  } catch (e) {
    console.warn('Preview start canceled or failed:', e);
  }
}

function stopPreview() {
  const startBtn = document.getElementById('startPreviewBtn');
  const stopBtn = document.getElementById('stopPreviewBtn');
  const overlay = document.getElementById('previewOverlay');
  const video = document.getElementById('livePreviewVideo');
  const container = overlay?.closest('.live-preview');
  try {
    const stream = window.previewStream;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      window.previewStream = null;
    }
    if ('srcObject' in video) video.srcObject = null;
    video.removeAttribute('src');
  } catch {}
  container?.classList.remove('streaming');
  stopBtn?.classList.add('hidden');
  startBtn?.classList.remove('hidden');
}

function initPreviewUI() {
  const startBtn = document.getElementById('startPreviewBtn');
  const stopBtn = document.getElementById('stopPreviewBtn');
  if (startBtn) startBtn.addEventListener('click', startPreview);
  if (stopBtn) stopBtn.addEventListener('click', stopPreview);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPreviewUI, { once: true });
} else {
  // DOM is already ready when the module loaded via dynamic import
  initPreviewUI();
}

// Expose for debugging/manual start if needed
window.startPreview = startPreview;
window.stopPreview = stopPreview;

export default { startPreview, stopPreview };
