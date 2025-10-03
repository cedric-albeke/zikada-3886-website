/**
 * MIDI Action Catalog - Centralized binding system for MIDI events to VJ Receiver
 * 
 * This module provides a comprehensive mapping of all available actions that can be
 * triggered via MIDI controllers, with proper routing to existing VJ systems.
 */

class MIDIActionCatalog {
    constructor(options = {}) {
        this.mode = options.mode || 'auto'; // 'direct', 'broadcast', 'auto'
        this.channel = null;
        
        // Auto-detect mode
        if (this.mode === 'auto') {
            this.mode = window.vjReceiver ? 'direct' : 'broadcast';
        }
        
        // Setup broadcast channel if needed
        if (this.mode === 'broadcast') {
            this.setupBroadcastChannel();
        }
        
        console.log(`🎹 MIDI Action Catalog initialized in ${this.mode} mode`);
    }
    
    setupBroadcastChannel() {
        try {
            this.channel = new BroadcastChannel('3886_vj_control');
        } catch (err) {
            console.warn('BroadcastChannel not available, will use localStorage fallback');
        }
    }
    
    // Send action via direct call or broadcast
    sendAction(type, data) {
        const actionData = { type, ...data, timestamp: Date.now() };
        
        if (this.mode === 'direct' && window.vjReceiver) {
            // Direct mode - call VJ Receiver methods directly
            window.vjReceiver.handleMessage(actionData);
        } else {
            // Broadcast mode - send via channel or localStorage
            if (this.channel) {
                this.channel.postMessage(actionData);
            } else {
                // Fallback to localStorage
                try {
                    localStorage.setItem('3886_vj_control', JSON.stringify(actionData));
                } catch (err) {
                    console.error('Failed to send MIDI action:', err);
                }
            }
        }
    }
    
    // ==================== TRIGGER ACTIONS ====================
    
    /**
     * Trigger visual effects - these create temporary overlays and animations
     */
    triggerEffect(effectId, settings = {}) {
        console.log(`🎆 MIDI trigger: ${effectId}`);
        this.sendAction('trigger_effect', { effect: effectId, settings });
    }
    
    // Available trigger effects (mapped to vjReceiver.triggerEffect)
    get triggerEffects() {
        return [
            'strobe', 'blackout', 'whiteout', 'rgbsplit', 'shake', 'ripple', 
            'pulse', 'matrix-rain', 'cosmic', 'vignette-pulse', 'scanlines-sweep',
            'chroma-pulse', 'noise-burst', 'grid-flash', 'lens-flare', 'zoom-blur',
            'invert-flicker', 'spotlight-sweep', 'heat-shimmer', 'digital-wave'
        ];
    }
    
    // ==================== INTENSITY ACTIONS ====================
    
    /**
     * Set effect intensities (0-1 range)
     */
    setIntensity(target, value, options = {}) {
        const normalizedValue = Math.max(0, Math.min(1, value));
        console.log(`🎛️ MIDI intensity: ${target} = ${normalizedValue}`);
        
        // Map to current effect naming
        const effectMap = {
            'glitch': 'glitch',
            'particles': 'particles', 
            'noise': 'noise',
            'distortion': 'distortion',
            'plasma': 'plasma',      // New - handled by fx-controller
            'strobe': 'strobe',      // New - handled by fx-controller
            'warp': 'distortion',    // Alias
            'blur': 'distortion'     // Alias
        };
        
        const mappedEffect = effectMap[target] || target;
        this.sendAction('fx_intensity', { effect: mappedEffect, intensity: normalizedValue });
    }
    
    // Available intensity targets
    get intensityTargets() {
        return ['glitch', 'particles', 'noise', 'distortion', 'plasma', 'strobe', 'warp', 'blur'];
    }
    
    // ==================== TOGGLE ACTIONS ====================
    
    /**
     * Toggle persistent effects on/off
     */
    toggleEffect(effectName, enabled) {
        console.log(`🔄 MIDI toggle: ${effectName} = ${enabled}`);
        this.sendAction('effect_toggle', { effect: effectName, enabled });
    }
    
    // Effect matrix 4x4 mapping with fallbacks
    get effectMatrix() {
        return {
            // Row 1 - Visual Effects
            'glow': { type: 'effect', target: 'aurora', fallback: 'logoGlowPulse' },
            'blur': { type: 'intensity', target: 'distortion', value: 0.4 },
            'shake': { type: 'trigger', target: 'ripple', interval: true },
            'spin': { type: 'effect', target: 'spin', custom: true },
            
            // Row 2 - Transform Effects  
            'zoom': { type: 'effect', target: 'zoom', custom: true },
            'flip': { type: 'effect', target: 'flip', custom: true },
            'wave': { type: 'trigger', target: 'digital-wave' },
            'pixel': { type: 'effect', target: 'pixelate', custom: true },
            
            // Row 3 - Color Effects
            'rgb': { type: 'effect', target: 'rgbSplit' },
            'chroma': { type: 'effect', target: 'chromatic' },
            'scan': { type: 'effect', target: 'scanlines' },
            'static': { type: 'effect', target: 'noise' },
            
            // Row 4 - Special Effects
            'grid': { type: 'effect', target: 'cyberGrid' },
            'mirror': { type: 'effect', target: 'mirror', custom: true },
            'echo': { type: 'effect', target: 'echo', custom: true },
            'trail': { type: 'effect', target: 'trail', custom: true }
        };
    }
    
    // Apply effect matrix toggle
    applyEffectMatrix(effectName, enabled) {
        const effect = this.effectMatrix[effectName];
        if (!effect) return;
        
        switch (effect.type) {
            case 'effect':
                if (effect.custom) {
                    this.applyCustomEffect(effect.target, enabled);
                } else {
                    this.toggleEffect(effect.target, enabled);
                }
                break;
            case 'intensity':
                this.setIntensity(effect.target, enabled ? (effect.value || 0.5) : 0);
                break;
            case 'trigger':
                if (enabled) {
                    if (effect.interval) {
                        this.startTriggerInterval(effect.target, 1000);
                    } else {
                        this.triggerEffect(effect.target);
                    }
                } else if (effect.interval) {
                    this.stopTriggerInterval(effect.target);
                }
                break;
        }
    }
    
    // Custom effect handlers for matrix effects not in fxController
    applyCustomEffect(effectName, enabled) {
        console.log(`✨ MIDI custom effect: ${effectName} = ${enabled}`);
        
        const customEffects = {
            'spin': () => {
                const targets = '.image-2, .logo-text-wrapper';
                if (enabled) {
                    gsap.to(targets, { 
                        rotation: 360, 
                        duration: 4, 
                        repeat: -1, 
                        ease: 'none' 
                    });
                } else {
                    gsap.killTweensOf(targets);
                    gsap.set(targets, { rotation: 0 });
                }
            },
            'zoom': () => {
                const targets = '.image-wrapper, .logo-text-wrapper';
                if (enabled) {
                    gsap.to(targets, {
                        scale: 1.1,
                        duration: 2,
                        yoyo: true,
                        repeat: -1,
                        ease: 'sine.inOut'
                    });
                } else {
                    gsap.killTweensOf(targets);
                    gsap.set(targets, { scale: 1 });
                }
            },
            'flip': () => {
                if (enabled) {
                    document.body.style.transform = 'scaleX(-1)';
                    document.body.style.mixBlendMode = 'overlay';
                } else {
                    document.body.style.transform = '';
                    document.body.style.mixBlendMode = '';
                }
            },
            'pixelate': () => {
                if (enabled) {
                    document.body.style.imageRendering = 'pixelated';
                    document.body.style.filter = (document.body.style.filter || '') + ' blur(1px)';
                } else {
                    document.body.style.imageRendering = '';
                    document.body.style.filter = document.body.style.filter.replace('blur(1px)', '');
                }
            },
            'mirror': () => {
                if (enabled) {
                    document.body.style.transform = 'scaleY(-1)';
                } else {
                    document.body.style.transform = '';
                }
            },
            'echo': () => {
                const targets = '.image-2, .logo-text-wrapper';
                if (enabled) {
                    gsap.to(targets, {
                        filter: 'blur(3px)',
                        opacity: 0.8,
                        duration: 0.5,
                        yoyo: true,
                        repeat: -1
                    });
                } else {
                    gsap.killTweensOf(targets);
                    gsap.set(targets, { filter: '', opacity: 1 });
                }
            },
            'trail': () => {
                if (enabled) {
                    this.createTrailEffect();
                } else {
                    this.removeTrailEffect();
                }
            }
        };
        
        if (customEffects[effectName]) {
            customEffects[effectName]();
        }
    }
    
    // ==================== SCENE ACTIONS ====================
    
    /**
     * Change visual scenes
     */
    changeScene(sceneName) {
        console.log(`🎬 MIDI scene: ${sceneName}`);
        this.sendAction('scene_change', { scene: sceneName });
    }
    
    // Available scenes
    get availableScenes() {
        return [
            'intense', 'calm', 'glitch', 'techno', 'matrix', 'minimal', 'chaotic',
            'retro', 'vaporwave', 'cyberpunk', 'neon', 'aurora', 'sunset', 'ocean',
            'forest', 'fire', 'ice', 'galaxy', 'auto'
        ];
    }
    
    // ==================== COLOR ACTIONS ====================
    
    /**
     * Update color properties
     */
    updateColor(component, value) {
        console.log(`🎨 MIDI color: ${component} = ${value}`);
        
        // Normalize ranges
        let normalizedValue = value;
        switch (component) {
            case 'hue':
                normalizedValue = ((value % 360) + 360) % 360; // 0-360
                break;
            case 'saturation':
            case 'brightness':
            case 'contrast':
                normalizedValue = Math.max(0, Math.min(200, value)); // 0-200
                break;
        }
        
        this.sendAction('color_change', { property: component, value: normalizedValue });
    }
    
    // Available color components
    get colorComponents() {
        return ['hue', 'saturation', 'brightness', 'contrast'];
    }
    
    // ==================== LAYER ACTIONS ====================
    
    /**
     * Toggle layer visibility
     */
    toggleLayer(layerName, visible) {
        console.log(`🎭 MIDI layer: ${layerName} = ${visible}`);
        this.sendAction('layer_toggle', { layer: layerName, visible });
    }
    
    // Available layers
    get availableLayers() {
        return ['background', 'matrix-rain', 'logo', 'text', 'overlay', 'debug', 'particles', 'animations'];
    }
    
    // ==================== BPM & TIMING ACTIONS ====================
    
    /**
     * Update BPM
     */
    updateBPM(bpm) {
        const clampedBPM = Math.max(60, Math.min(200, bpm));
        console.log(`🥁 MIDI BPM: ${clampedBPM}`);
        this.sendAction('bpm_change', { bpm: clampedBPM });
    }
    
    /**
     * Handle MIDI clock (24 pulses per quarter note)
     */
    handleMIDIClock() {
        this.clockPulses = (this.clockPulses || 0) + 1;
        
        if (this.clockPulses >= 24) {
            const now = performance.now();
            if (this.lastBeat) {
                const interval = now - this.lastBeat;
                const bpm = Math.round(60000 / interval);
                this.updateBPM(bpm);
            }
            this.lastBeat = now;
            this.clockPulses = 0;
        }
    }
    
    // ==================== ANIMATION ACTIONS ====================
    
    /**
     * Enable/disable anime.js system
     */
    setAnimeEnabled(enabled) {
        console.log(`🎯 MIDI anime: ${enabled}`);
        this.sendAction(enabled ? 'anime_enable' : 'anime_disable');
    }
    
    /**
     * Trigger specific animation
     */
    triggerAnimation(animationId) {
        console.log(`🎬 MIDI animation: ${animationId}`);
        this.sendAction('anime_trigger', { id: animationId });
    }
    
    // ==================== REALTIME CONTROLS ====================
    
    /**
     * Real-time speed control
     */
    setSpeed(speed) {
        const normalizedSpeed = Math.max(0.1, Math.min(3.0, speed));
        console.log(`⚡ MIDI speed: ${normalizedSpeed}`);
        this.sendAction('speed_change', { speed: normalizedSpeed });
    }
    
    // ==================== UTILITY METHODS ====================
    
    // Trigger interval management
    startTriggerInterval(effect, interval) {
        this.stopTriggerInterval(effect);
        this.triggerIntervals = this.triggerIntervals || {};
        this.triggerIntervals[effect] = setInterval(() => {
            this.triggerEffect(effect);
        }, interval);
    }
    
    stopTriggerInterval(effect) {
        if (this.triggerIntervals && this.triggerIntervals[effect]) {
            clearInterval(this.triggerIntervals[effect]);
            delete this.triggerIntervals[effect];
        }
    }
    
    // Trail effect implementation
    createTrailEffect() {
        if (this.trailCanvas) return;
        
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 9999; mix-blend-mode: screen;
        `;
        this.trailCanvas.width = window.innerWidth;
        this.trailCanvas.height = window.innerHeight;
        document.body.appendChild(this.trailCanvas);
        
        const ctx = this.trailCanvas.getContext('2d');
        const drawTrail = () => {
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            
            // Copy current frame with slight offset
            ctx.globalAlpha = 0.9;
            ctx.drawImage(this.trailCanvas, 2, 2);
            
            if (this.trailActive) {
                requestAnimationFrame(drawTrail);
            }
        };
        
        this.trailActive = true;
        drawTrail();
    }
    
    removeTrailEffect() {
        this.trailActive = false;
        if (this.trailCanvas) {
            this.trailCanvas.remove();
            this.trailCanvas = null;
        }
    }
    
    // ==================== DIAGNOSTICS ====================
    
    /**
     * Run system diagnostics
     */
    runDiagnostics() {
        console.log('🔍 MIDI diagnostics');
        this.sendAction('run_animation_diagnostics');
    }
    
    // ==================== CATALOG INFO ====================
    
    /**
     * Get all available actions for MIDI Learn UI
     */
    getActionCatalog() {
        return {
            triggers: this.triggerEffects,
            intensities: this.intensityTargets,
            effects: Object.keys(this.effectMatrix),
            scenes: this.availableScenes,
            colors: this.colorComponents,
            layers: this.availableLayers,
            animations: [
                'logo-pulse', 'logo-spin', 'logo-glow', 'matrix-flash', 
                'matrix-rain', 'matrix-glitch', 'bg-warp', 'bg-shake',
                'bg-zoom', 'text-scramble', 'text-wave'
            ],
            realtime: ['speed', 'bpm'],
            system: ['anime_enable', 'anime_disable', 'diagnostics']
        };
    }
}

// Export for global access
window.MIDIActionCatalog = MIDIActionCatalog;

// Auto-instantiate if MIDI controller is available
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (window.midiController && !window.midiActionCatalog) {
            window.midiActionCatalog = new MIDIActionCatalog();
            console.log('✅ MIDI Action Catalog auto-initialized');
        }
    });
}

export default MIDIActionCatalog;