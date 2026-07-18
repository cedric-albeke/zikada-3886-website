// Complete Visual Effects Implementation
// Properly handles all visual effects for the control panel
import filterManager from './filter-manager.js';
import animationRuntime from './runtime/animation-runtime.js';
import ambientCanvasRenderer from './ambient-canvas-renderer.js';

const VISUAL_EFFECTS_OWNER = 'visual-effects-controller';

class VisualEffectsController {
    constructor() {
        this.activeEffects = new Set();
        this.effectElements = {};
        this.init();
    }

    init() {
        console.log('🎨 Visual Effects Controller initializing...');
        this.createEffectContainers();
        this.setupMessageListener();
    }

    createEffectContainers() {
        const existing = document.getElementById('visual-effects-container');
        if (existing) {
            this.effectElements.container = existing;
            return;
        }

        // Main effects container
        const container = document.createElement('div');
        container.id = 'visual-effects-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9990;
        `;
        document.body.appendChild(container);
        this.effectElements.container = container;
        animationRuntime.trackNode(VISUAL_EFFECTS_OWNER, container);
    }

    setupMessageListener() {
        // If the central vj-receiver is active, defer to it to avoid duplicate FX handling
        if (window.vjReceiver) {
            console.log('🎛️ VisualEffectsController: deferring to vj-receiver/fx-controller (no local storage listener)');
            return;
        }
        // Listen for control panel messages only when vj-receiver is not available (legacy fallback)
        const handleStorage = (e) => {
            if (e.key === '3886_vj_message') {
                try {
                    const message = JSON.parse(e.newValue);
                    if (message.type === 'effect_toggle') {
                        this.toggleEffect(message.effect, message.enabled);
                    }
                } catch (err) {
                    console.error('Failed to parse message:', err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        animationRuntime.trackDisposer(VISUAL_EFFECTS_OWNER, () => {
            window.removeEventListener('storage', handleStorage);
        });
    }

    toggleEffect(effectName, enabled) {
        console.log(`🎛️ Toggling ${effectName} to ${enabled ? 'ON' : 'OFF'}`);

        if (enabled) {
            this.enableEffect(effectName);
        } else {
            this.disableEffect(effectName);
        }
    }

    enableEffect(effectName) {
        this.activeEffects.add(effectName);

        switch(effectName) {
            case 'holographic':
                this.enableHolographic();
                break;
            case 'dataStreams':
                this.enableDataStreams();
                break;
            case 'strobeCircles':
                this.enableStrobeCircles();
                break;
            case 'plasma':
                this.enablePlasmaField();
                break;
            case 'particles':
                this.enableParticles();
                break;
            case 'noise':
                this.enableNoise();
                break;
            case 'cyberGrid':
                this.enableCyberGrid();
                break;
            case 'rgbSplit':
                this.enableRGBSplit();
                break;
            case 'chromatic':
                this.enableChromaticAberration();
                break;
            case 'scanlines':
                this.enableScanlines();
                break;
            case 'vignette':
                this.enableVignette();
                break;
            case 'filmgrain':
                this.enableFilmGrain();
                break;
        }
    }

    disableEffect(effectName) {
        this.activeEffects.delete(effectName);

        switch(effectName) {
            case 'holographic':
                this.disableHolographic();
                break;
            case 'dataStreams':
                this.disableDataStreams();
                break;
            case 'strobeCircles':
                this.disableStrobeCircles();
                break;
            case 'plasma':
                this.disablePlasmaField();
                break;
            case 'particles':
                this.disableParticles();
                break;
            case 'noise':
                this.disableNoise();
                break;
            case 'cyberGrid':
                this.disableCyberGrid();
                break;
            case 'rgbSplit':
                this.disableRGBSplit();
                break;
            case 'chromatic':
                this.disableChromaticAberration();
                break;
            case 'scanlines':
                this.disableScanlines();
                break;
            case 'vignette':
                this.disableVignette();
                break;
            case 'filmgrain':
                this.disableFilmGrain();
                break;
        }
    }

    // Cyber Grid Effect
    enableCyberGrid() {
        document.getElementById('cyber-grid-effect')?.remove();
        delete this.effectElements.cyberGrid;
        ambientCanvasRenderer.setCyberGridEnabled(true);
    }

    disableCyberGrid() {
        document.getElementById('cyber-grid-effect')?.remove();
        delete this.effectElements.cyberGrid;
        ambientCanvasRenderer.setCyberGridEnabled(false);
    }

    // RGB Split Effect
    enableRGBSplit() {
        document.body.style.textShadow = '2px 2px 0 rgba(255,0,0,0.5), -2px -2px 0 rgba(0,255,255,0.5)';
        const images = document.querySelectorAll('img, .image-2, .logo-container');
        images.forEach(img => {
            img.style.filter = 'contrast(1.1)';
            img.style.boxShadow = '3px 3px 0 rgba(255,0,0,0.3), -3px -3px 0 rgba(0,255,255,0.3)';
        });
    }

    disableRGBSplit() {
        document.body.style.textShadow = '';
        const images = document.querySelectorAll('img, .image-2, .logo-container');
        images.forEach(img => {
            img.style.filter = '';
            img.style.boxShadow = '';
        });
    }

    // Chromatic Aberration
    enableChromaticAberration() {
        const filter = document.createElement('div');
        filter.id = 'chromatic-aberration';
        filter.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg,
                rgba(255,0,0,0.05) 0%,
                transparent 33%,
                transparent 66%,
                rgba(0,255,255,0.05) 100%);
            pointer-events: none;
            z-index: 9998;
            mix-blend-mode: screen;
        `;
        (document.getElementById('fx-root') || document.body).appendChild(filter);
        this.effectElements.chromaticAberration = filter;
    }

    disableChromaticAberration() {
        if (this.effectElements.chromaticAberration) {
            this.effectElements.chromaticAberration.remove();
            delete this.effectElements.chromaticAberration;
        }
    }

    // Scanlines Effect
    enableScanlines() {
        document.getElementById('scanlines-effect')?.remove();
        delete this.effectElements.scanlines;
        ambientCanvasRenderer.setScanlinesEnabled(true, 0.14);
    }

    disableScanlines() {
        document.getElementById('scanlines-effect')?.remove();
        delete this.effectElements.scanlines;
        ambientCanvasRenderer.setScanlinesEnabled(true, 0.035);
    }

    // Vignette Effect
    enableVignette() {
        const vignette = document.createElement('div');
        vignette.id = 'vignette-effect';
        vignette.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse at center,
                transparent 0%,
                transparent 50%,
                rgba(0,0,0,0.4) 100%);
            pointer-events: none;
            z-index: 9996;
        `;
        (document.getElementById('fx-root') || document.body).appendChild(vignette);
        this.effectElements.vignette = vignette;
    }

    disableVignette() {
        if (this.effectElements.vignette) {
            this.effectElements.vignette.remove();
            delete this.effectElements.vignette;
        }
    }

    // Film Grain Effect
    enableFilmGrain() {
        document.getElementById('film-grain-effect')?.remove();
        delete this.effectElements.filmGrain;
        ambientCanvasRenderer.setFilmGrainEnabled(true, 0.15);
    }

    disableFilmGrain() {
        document.getElementById('film-grain-effect')?.remove();
        delete this.effectElements.filmGrain;
        ambientCanvasRenderer.setFilmGrainEnabled(false);
    }

    // Noise Effect (Digital Noise)
    enableNoise() {
        document.getElementById('digital-noise-effect')?.remove();
        delete this.effectElements.noise;
        ambientCanvasRenderer.setNoiseStrength(0.25);
    }

    disableNoise() {
        document.getElementById('digital-noise-effect')?.remove();
        delete this.effectElements.noise;
        ambientCanvasRenderer.setNoiseStrength(0);
    }

    // Particles Effect
    enableParticles() {
        const particlesContainer = document.createElement('div');
        particlesContainer.id = 'particles-effect';
        particlesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
        `;
        document.body.appendChild(particlesContainer);
        this.effectElements.particles = particlesContainer;

        // Create floating particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: #00ff85;
                box-shadow: 0 0 10px #00ff85;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: floatParticle ${10 + Math.random() * 20}s linear infinite;
            `;
            particlesContainer.appendChild(particle);
        }

        if (!document.getElementById('particles-style')) {
            const style = document.createElement('style');
            style.id = 'particles-style';
            style.textContent = `
                @keyframes floatParticle {
                    0% { transform: translate(0, 100vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translate(100px, -100vh) rotate(360deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    disableParticles() {
        if (this.effectElements.particles) {
            this.effectElements.particles.remove();
            delete this.effectElements.particles;
        }
    }

    // Holographic Effect (already fixed in anime-enhanced-effects.js)
    enableHolographic() {
        // Trigger the anime holographic effect if available
        if (window.animeEnhancedEffects) {
            console.log('Triggering anime holographic effect');
        }
        // Route body filter through Filter Manager for safety
        filterManager.applyImmediate('hue-rotate(1deg) contrast(1.02)', { duration: 0.4, ease: 'power1.inOut' });
    }

    disableHolographic() {
        filterManager.applyImmediate('none', { duration: 0.25, ease: 'power1.inOut' });
    }

    // Data Streams (already implemented in fx-controller.js)
    enableDataStreams() {
        if (window.fxController) {
            window.fxController.setEffectEnabled('dataStreams', true);
        }
    }

    disableDataStreams() {
        if (window.fxController) {
            window.fxController.setEffectEnabled('dataStreams', false);
        }
    }

    // Strobe Circles
    enableStrobeCircles() {
        if (window.animeEnhancedEffects) {
            window.animeEnhancedEffects.createStrobeCircles();
        }
    }

    disableStrobeCircles() {
        if (window.animeEnhancedEffects) {
            window.animeEnhancedEffects.removeStrobeCircles();
        }
    }

    // Plasma Field
    enablePlasmaField() {
        let plasmaCanvas = document.getElementById('plasma-field-canvas');
        if (!plasmaCanvas && window.animeEnhancedEffects?.createPlasmaField) {
            plasmaCanvas = window.animeEnhancedEffects.createPlasmaField();
        }
        if (plasmaCanvas && plasmaCanvas.startEffect) {
            plasmaCanvas.startEffect();
        }
    }

    disablePlasmaField() {
        const plasmaCanvas = document.getElementById('plasma-field-canvas');
        if (plasmaCanvas && plasmaCanvas.stopEffect) {
            plasmaCanvas.stopEffect();
        }
    }

    destroy() {
        Array.from(this.activeEffects).forEach(effectName => this.disableEffect(effectName));
        animationRuntime.disposeOwner(VISUAL_EFFECTS_OWNER);
        this.activeEffects.clear();
        this.effectElements = {};
    }
}

// Initialize the visual effects controller
window.visualEffectsController = new VisualEffectsController();

// Export for module systems
export default VisualEffectsController;
