// VJ Receiver Module - Receives control messages from control panel
// Integrates with existing chaos engine

import gsap from 'gsap';
import filterManager from './filter-manager.js';
import fxController from './fx-controller.js';

// Ensure GSAP is globally available
if (typeof window !== 'undefined' && !window.gsap) {
    window.gsap = gsap;
}

class VJReceiver {
    constructor() {
        this.channel = null;
        this.isConnected = false;
        this.currentSettings = {
            colors: {
                hue: 0,
                saturation: 100,
                brightness: 100,
                contrast: 100
            },
            speed: 1.0,
            phaseDuration: 30000,
            effects: {
                glitch: 0.5,
                particles: 0.5,
                distortion: 0.5,
                noise: 0.5
            },
            scene: 'auto',
            bpm: 120
        };

        this.activeFx = 0;
        this.fpsMonitor = null;

        this.init();
    }

    init() {
        console.log('🎮 VJ Receiver initializing...');

        // Initialize broadcast channel
        this.initBroadcastChannel();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Hook into existing chaos system
        this.hookIntoChaosEngine();
    }

    initBroadcastChannel() {
        try {
            // Create broadcast channel
            this.channel = new BroadcastChannel('3886_vj_control');

            // Listen for messages from control panel
            this.channel.onmessage = (event) => {
                this.handleMessage(event.data);
            };

            this.isConnected = true;
            console.log('📡 VJ Receiver connected via BroadcastChannel');

        } catch (error) {
            console.error('Failed to initialize BroadcastChannel:', error);

            // Fallback to localStorage events
            this.initLocalStorageFallback();
        }
    }

    initLocalStorageFallback() {
        console.log('Using localStorage fallback for VJ control');

        // Listen for storage events
        window.addEventListener('storage', (e) => {
            if (e.key === '3886_vj_message') {
                const data = JSON.parse(e.newValue);
                this.handleMessage(data);
            }
        });

        // Override sendMessage for localStorage
        this.sendMessage = (data) => {
            localStorage.setItem('3886_vj_response', JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
        };
    }

    sendMessage(data) {
        if (this.channel) {
            this.channel.postMessage(data);
        }
    }

    handleMessage(data) {
        // console.log('📨 Received control message:', data);

        switch(data.type) {
            case 'control_connect':
                this.handleConnection();
                break;

            case 'ping':
                this.sendMessage({ type: 'pong' });
                break;

            case 'scene_change':
                this.changeScene(data.scene);
                break;

            case 'color_update':
                this.updateColor(data.parameter, data.value);
                break;

            case 'color_reset':
                this.resetColors();
                break;

            case 'speed_update':
                this.updateSpeed(data.value);
                break;

            case 'phase_duration_update':
                this.updatePhaseDuration(data.value);
                break;

            case 'bpm_update':
                this.updateBPM(data.bpm);
                break;

            case 'effect_intensity':
                this.updateEffectIntensity(data.effect, data.value);
                break;

            case 'trigger_effect':
                this.triggerEffect(data.effect);
                break;

            case 'preset_load':
                this.loadPreset(data.preset);
                break;

            case 'performance_mode':
                this.setPerformanceMode(data.mode);
                break;

            case 'emergency_stop':
                this.emergencyStop();
                break;

            case 'emergency_cleanup':
                this.executeEmergencyCleanup();
                break;

            case 'safe_cleanup':
                this.executeSafeCleanup();
                break;

            case 'emergency_brake':
                this.executeEmergencyBrake();
                break;

            case 'performance_optimization':
                this.executePerformanceOptimization();
                break;

            case 'request_performance':
                this.sendPerformanceData();
                break;

            case 'get_performance_stats':
                this.sendDetailedPerformanceData();
                break;

            case 'sequence_event':
                this.handleSequenceEvent(data);
                break;
        }
    }

    handleConnection() {
        console.log('🎛️ Control panel connected');

        // Send current settings
        this.sendMessage({
            type: 'settings_sync',
            settings: this.currentSettings
        });
    }

    changeScene(scene) {
        console.log(`🎬 Changing scene to: ${scene}`);

        const chaosInit = window.chaosInit;
        if (!chaosInit) return;

        if (scene === 'auto') {
            // Resume auto phase switching
            chaosInit.phaseRunning = true;
            chaosInit.startAnimationPhases();
        } else {
            // Stop auto switching
            chaosInit.phaseRunning = false;

            // Trigger specific phase
            switch(scene) {
                case 'intense':
                    chaosInit.phaseIntense();
                    break;
                case 'calm':
                    chaosInit.phaseCalm();
                    break;
                case 'glitch':
                    chaosInit.phaseGlitch();
                    break;
                case 'techno':
                    chaosInit.phaseTechno();
                    break;
                case 'matrix':
                    chaosInit.phaseMatrix();
                    break;
                case 'minimal':
                    chaosInit.phaseMinimal();
                    break;
                case 'chaotic':
                    chaosInit.phaseChaotic();
                    break;
                case 'retro':
                    chaosInit.phaseRetro();
                    break;
                case 'vaporwave':
                    chaosInit.phaseVaporwave();
                    break;
                case 'cyberpunk':
                    chaosInit.phaseCyberpunk();
                    break;
                case 'neon':
                    chaosInit.phaseNeon();
                    break;
                case 'aurora':
                    chaosInit.phaseAurora();
                    break;
                case 'sunset':
                    chaosInit.phaseSunset();
                    break;
                case 'ocean':
                    chaosInit.phaseOcean();
                    break;
                case 'forest':
                    chaosInit.phaseForest();
                    break;
                case 'fire':
                    chaosInit.phaseFire();
                    break;
                case 'ice':
                    chaosInit.phaseIce();
                    break;
                case 'galaxy':
                    chaosInit.phaseGalaxy();
                    break;
            }
        }

        this.currentSettings.scene = scene;

        // Send confirmation
        this.sendMessage({
            type: 'scene_changed',
            scene: scene
        });
    }

    updateColor(parameter, value) {
        console.log(`🎛️ VJ Receiver: updateColor called - ${parameter}: ${value}`);
        
        this.currentSettings.colors[parameter] = value;
        
        console.log('🎛️ Updated color settings:', this.currentSettings.colors);
        
        // Route through centralized filter manager for smooth, safe updates
        filterManager.setPartial({ [parameter]: value }, 300);
    }

    applyColorFilter() {
        console.log('🎨 applyColorFilter called with settings:', this.currentSettings.colors);
        
        const { hue, saturation, brightness, contrast } = this.currentSettings.colors;
        // Delegate to filter manager
        filterManager.setPartial({ hue, saturation, brightness, contrast }, 0);
        console.log('✅ Color filter applied via FilterManager');
    }

    resetColors() {
        this.currentSettings.colors = {
            hue: 0,
            saturation: 100,
            brightness: 100,
            contrast: 100
        };

        gsap.to(document.body, {
            filter: 'none',
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }

    updateSpeed(value) {
        this.currentSettings.speed = value;

        // Update GSAP global timeline scale
        gsap.globalTimeline.timeScale(value);

        // Keep anime.js timelines in sync when available
        if (window.animeManager && typeof window.animeManager.setSpeed === 'function') {
            window.animeManager.setSpeed(value);
        }

        // Update timing controller if available
        if (window.timingController) {
            window.timingController.setGlobalSpeed(value);
        }
    }

    updatePhaseDuration(value) {
        this.currentSettings.phaseDuration = value;

        // Update phase switching interval
        const chaosInit = window.chaosInit;
        if (chaosInit) {
            // This would need implementation in chaos-init.js
            console.log(`Phase duration updated to ${value}ms`);
        }
    }

    updateBPM(bpm) {
        this.currentSettings.bpm = bpm;

        // Calculate beat interval
        const beatInterval = 60000 / bpm;

        // Pulse effects to BPM
        if (window.enhancedLogoAnimator) {
            // Sync logo pulse to BPM
            gsap.to('.logo-text-wrapper, .image-wrapper', {
                scale: 1.02,
                duration: beatInterval / 2000,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
    }

    updateEffectIntensity(effect, value) {
        this.currentSettings.effects[effect] = value;

        switch(effect) {
            case 'glitch':
                this.updateGlitchIntensity(value);
                break;
            case 'particles':
                this.updateParticleIntensity(value);
                break;
            case 'distortion':
                this.updateDistortionIntensity(value);
                break;
            case 'noise':
                this.updateNoiseIntensity(value);
                break;
        }
    }

    updateGlitchIntensity(value) {
        // Adjust glitch pass intensity
        fxController.setIntensity({ glitch: value });
    }

    updateParticleIntensity(value) {
        // Adjust particle system
        fxController.setIntensity({ particles: value });
    }

    updateDistortionIntensity(value) {
        // Adjust distortion effects
        fxController.setIntensity({ distortion: value });
    }

    updateNoiseIntensity(value) {
        // Adjust static noise
        fxController.setIntensity({ noise: value });
    }

    triggerEffect(effect) {
        console.log(`⚡ Triggering effect: ${effect}`);
        this.activeFx++;

        // Adjust effect strength/duration using fx intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;
        const distortionI = window.fxController ? window.fxController.getIntensity('distortion') : 0.5;
        const noiseI = window.fxController ? window.fxController.getIntensity('noise') : 0.5;

        switch(effect) {
            case 'strobe':
                this.triggerStrobe();
                break;
            case 'blackout':
                this.triggerBlackout();
                break;
            case 'whiteout':
                this.triggerWhiteout();
                break;
            case 'rgbsplit':
                this.triggerRGBSplit();
                break;
            case 'shake':
                this.triggerShake();
                break;
            case 'pulse':
                this.triggerPulse();
                break;
            case 'matrix-rain':
                this.triggerMatrixRain();
                break;
            case 'cosmic':
                this.triggerCosmicBurst();
                break;
        }

        // Decrement active effects counter after effect duration
        setTimeout(() => {
            this.activeFx--;
        }, 2000);
    }

    triggerStrobe() {
        // Get FX intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const strobe = document.createElement('div');
        strobe.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            pointer-events: none;
            z-index: 10000;
        `;
        document.body.appendChild(strobe);

        // REDUCED: Faster, shorter strobe animation
        gsap.to(strobe, {
            opacity: 0,
            duration: 0.05 + (0.1 * (1 - glitchI)), // Reduced from 0.1 + 0.2
            repeat: Math.max(1, Math.round(1 + 3 * glitchI * mult)), // Reduced from 2 + 6
            yoyo: true,
            ease: 'none',
            onComplete: () => strobe.remove()
        });
    }

    triggerBlackout() {
        // Get FX intensities
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const blackout = document.createElement('div');
        blackout.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: black;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
        `;
        document.body.appendChild(blackout);

        gsap.timeline()
            .to(blackout, { opacity: 1, duration: 0.15 + 0.25 * glitchI })
            .to(blackout, { opacity: 0, duration: 0.2 + 0.3 * (1 - glitchI), delay: 1 })
            .call(() => blackout.remove());
    }

    triggerWhiteout() {
        // Get FX intensities
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const whiteout = document.createElement('div');
        whiteout.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
        `;
        document.body.appendChild(whiteout);

        gsap.timeline()
            .to(whiteout, { opacity: 1, duration: 0.1 + 0.2 * glitchI })
            .to(whiteout, { opacity: 0, duration: 1 + 1 * (1 - glitchI), ease: 'power2.out' })
            .call(() => whiteout.remove());
    }

    triggerRGBSplit() {
        // Get FX intensities
        const glitchI = window.fxController ? window.fxController.getIntensity('glitch') : 0.5;
        
        const originalFilter = document.body.style.filter;

        // INCREASED: Longer RGB Split effect duration for more impact
        gsap.timeline()
            .to(document.body, {
                filter: 'hue-rotate(120deg) saturate(2)',
                duration: 0.3 + 0.5 * glitchI // Increased from 0.15 + 0.25
            })
            .to(document.body, {
                filter: 'hue-rotate(-120deg) saturate(2)',
                duration: 0.3 + 0.5 * glitchI // Increased from 0.15 + 0.25
            })
            .to(document.body, {
                filter: originalFilter || 'none',
                duration: 0.8 + 0.6 * (1 - glitchI), // Increased from 0.4 + 0.3
                ease: 'power2.out'
            });
    }

    triggerShake() {
        // REPLACED: Ripple effect instead of shake
        this.triggerRipple();
    }

    triggerRipple() {
        // Get FX intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;
        
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 10000;
            transform: translate(-50%, -50%) scale(0);
        `;
        document.body.appendChild(ripple);

        gsap.to(ripple, {
            scale: 8 + 20 * particlesI * mult,
            opacity: 0,
            duration: 1 + 1 * (1 - particlesI),
            ease: 'power2.out',
            onComplete: () => ripple.remove()
        });
    }

    triggerPulse() {
        // Include main logo in pulse animation
        gsap.to('.logo-text-wrapper, .image-wrapper, .text-3886, .image-2', {
            scale: 1.25,  // Slightly bigger pulse
            duration: 0.4,  // Slightly slower
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut'
        });
    }

    triggerMatrixRain() {
        // REPLACED: Digital wave effect instead of matrix rain
        this.triggerDigitalWave();
    }

    triggerDigitalWave() {
        // Get FX intensities
        const mult = window.fxController ? window.fxController.globalMult : 1;
        const particlesI = window.fxController ? window.fxController.getIntensity('particles') : 0.5;
        
        for (let i = 0; i < Math.max(4, Math.round(8 * particlesI * mult)); i++) {
            const wave = document.createElement('div');
            wave.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                width: 3px;
                height: 3px;
                background: rgba(0, 255, 133, 0.9);
                border-radius: 50%;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 0 10px rgba(0, 255, 133, 0.6);
            `;
            document.body.appendChild(wave);

            gsap.to(wave, {
                scale: 15,
                opacity: 0,
                duration: Math.random() * (1 + (1 - particlesI)) + 0.4,
                delay: i * 0.1,
                ease: 'power2.out',
                onComplete: () => wave.remove()
            });
        }
    }

    triggerCosmicBurst() {
        if (window.lottieAnimations && window.lottieAnimations.triggerCosmicBurst) {
            window.lottieAnimations.triggerCosmicBurst();
        }
    }

    loadPreset(preset) {
        console.log('📂 Loading preset:', preset);

        // Apply all preset values
        if (preset.hue !== undefined) this.updateColor('hue', preset.hue);
        if (preset.saturation !== undefined) this.updateColor('saturation', preset.saturation);
        if (preset.brightness !== undefined) this.updateColor('brightness', preset.brightness);
        if (preset.contrast !== undefined) this.updateColor('contrast', preset.contrast);

        if (preset.speed !== undefined) this.updateSpeed(preset.speed / 100);
        if (preset.phaseDuration !== undefined) this.updatePhaseDuration(preset.phaseDuration * 1000);

        if (preset.glitch !== undefined) this.updateEffectIntensity('glitch', preset.glitch / 100);
        if (preset.particles !== undefined) this.updateEffectIntensity('particles', preset.particles / 100);
        if (preset.distortion !== undefined) this.updateEffectIntensity('distortion', preset.distortion / 100);
        if (preset.noise !== undefined) this.updateEffectIntensity('noise', preset.noise / 100);

        if (preset.scene !== undefined) this.changeScene(preset.scene);
    }

    setPerformanceMode(mode) {
        console.log(`🎮 Setting performance mode: ${mode}`);

        // Map external mode to internal manager mode
        const mappedMode = (mode === 'auto') ? 'medium' : mode;
        const perfDetail = { mode: mappedMode, source: 'vj-receiver', raw: mode };

        if (window.animePerfAdapter && typeof window.animePerfAdapter.applyMode === 'function') {
            window.animePerfAdapter.applyMode(mappedMode);
        }

        window.dispatchEvent(new CustomEvent('performanceMode', { detail: perfDetail }));
        if (!window.performanceManager) {
            window.dispatchEvent(new CustomEvent('performanceModeChange', { detail: perfDetail }));
        }


        // Apply performance mode to all available systems
        if (window.ChaosControl && window.ChaosControl.setPerformance) {
            window.ChaosControl.setPerformance(mappedMode);
        }

        if (window.performanceManager && typeof window.performanceManager.setPerformanceMode === 'function') {
            window.performanceManager.setPerformanceMode(mappedMode);
        }

        if (window.performanceElementManager && typeof window.performanceElementManager.setPerformanceMode === 'function') {
            window.performanceElementManager.setPerformanceMode(mappedMode);
        }

        if (window.fxController) {
            // Scale intensities by mode
            switch(mode) {
                case 'low':
                    window.fxController.setGlobalIntensityMultiplier(0.7);
                    break;
                case 'auto':
                    window.fxController.setGlobalIntensityMultiplier(1.0);
                    break;
                case 'high':
                    window.fxController.setGlobalIntensityMultiplier(1.3);
                    break;
            }
        }

        if (window.gsapAnimationRegistry) {
            // Adjust animation limits based on requested external mode
            switch(mode) {
                case 'low':
                    window.gsapAnimationRegistry.maxAnimations = 50;
                    break;
                case 'auto':
                    window.gsapAnimationRegistry.maxAnimations = 100;
                    break;
                case 'high':
                    window.gsapAnimationRegistry.maxAnimations = 200;
                    break;
            }
            console.log(`🎬 GSAP animation limit set to ${window.gsapAnimationRegistry.maxAnimations} for ${mode} mode (mapped to ${mappedMode})`);
        }

        // Send confirmation back to control panel
        this.sendMessage({
            type: 'performance_mode_updated',
            mode: mode,
            timestamp: Date.now()
        });
    }

    emergencyStop() {
        console.log('🚨 ENHANCED EMERGENCY STOP - Full System Reset!');
        if (window.animeManager && typeof window.animeManager.killAll === 'function') {
            window.animeManager.killAll();
        }

        // 1. COMPLETE ANIMATION CLEANUP
        if (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.killByFilter === 'function') {
            window.gsapAnimationRegistry.killByFilter({ category: 'effect', excludeEssential: true });
            window.gsapAnimationRegistry.killByFilter({ category: 'particle', excludeEssential: true });
        }
        if (window.intervalManager && typeof window.intervalManager.clearCategory === 'function') {
            window.intervalManager.clearCategory('effect');
            window.intervalManager.clearCategory('particle');
            window.intervalManager.clearCategory('artifact');
        }
        if (window.performanceElementManager && typeof window.performanceElementManager.removeAllByCategory === 'function') {
            window.performanceElementManager.removeAllByCategory('effect');
            window.performanceElementManager.removeAllByCategory('particle');
            window.performanceElementManager.removeAllByCategory('artifact');
            window.performanceElementManager.removeAllByCategory('stream');
        }

        // 2. RESET ALL VISUAL STATES
        this.resetColors();
        this.updateSpeed(1);
        
        // Reset body filters and styles completely
        document.body.style.filter = 'none';
        document.body.style.transform = 'none';
        document.body.style.removeProperty('background-image'); // Clear noise fallback
        document.body.style.removeProperty('opacity');

        // 3. RESET ALL FX CONTROLLERS
        if (window.fxController) {
            window.fxController.setIntensity({ glitch: 0, particles: 0, distortion: 0, noise: 0 });
            window.fxController.setGlobalIntensityMultiplier(1.0);
        } else {
            Object.keys(this.currentSettings.effects).forEach(effect => {
                this.updateEffectIntensity(effect, 0);
            });
        }

        // 4. STOP ALL PHASE SYSTEMS
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
        }

        // 5. COMPLETE OVERLAY CLEANUP
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
            if (!el.classList.contains('control-panel') && 
                !el.id.includes('chaos-canvas') && 
                !el.id.includes('matrix-rain') &&
                !el.id.includes('static-noise')) {
                el.remove();
            }
        });
        
        // Clear temporary canvases (preserve essential ones)
        document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.id !== 'chaos-canvas' && 
                canvas.id !== 'matrix-rain' && 
                canvas.id !== 'static-noise' &&
                canvas.id !== 'cyber-grid') {
                canvas.remove();
            }
        });

        // 6. RESET MATRIX MESSAGE SYSTEM
        if (window.matrixMessages && typeof window.matrixMessages.forceCleanup === 'function') {
            window.matrixMessages.forceCleanup();
        }

        // 7. FORCE GARBAGE COLLECTION
        if (window.gc) {
            window.gc();
        }

        // 8. RESTART SYSTEM CLEANLY WITH FULL RECREATION
        setTimeout(() => {
            // Reset to minimal state first
            this.changeScene('minimal');
            
            // Then trigger FULL system restart (simulates F5)
            setTimeout(() => {
                this.changeScene('calm');
                this.restartEssentialAnimations(); // Now this is a FULL restart
                console.log('✅ Enhanced emergency reset completed - Full system recreated!');
            }, 800);
            
        }, 800); // Even faster recovery since we're doing full restart
    }

    executeEmergencyCleanup() {
        console.log('🚨 VJ Receiver executing emergency cleanup...');
        
        // Trigger emergency cleanup if available
        if (window.emergencyCleanup) {
            window.emergencyCleanup.executeEmergencyCleanup();
        }
        
        // Also trigger the regular emergency stop
        this.emergencyStop();
    }

    executeSafeCleanup() {
        console.log('🧹 VJ Receiver executing safe cleanup...');
        
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.safeCleanup();
        }
    }

    executeEmergencyBrake() {
        console.log('🚨 VJ Receiver executing emergency brake...');
        
        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.emergencyBrake();
        }
    }

    executePerformanceOptimization() {
        console.log('🧹 VJ Receiver executing performance optimization...');
        
        // Trigger cleanup on all performance systems (selective FX focus)
        if (window.gsapAnimationRegistry && typeof window.gsapAnimationRegistry.killByFilter === 'function') {
            window.gsapAnimationRegistry.killByFilter({ category: 'effect', excludeEssential: true, olderThan: 10000 });
            window.gsapAnimationRegistry.killByFilter({ category: 'particle', excludeEssential: true, olderThan: 10000 });
        } else if (window.gsapAnimationRegistry) {
            window.gsapAnimationRegistry.performPeriodicCleanup();
        }

        if (window.performanceElementManager && typeof window.performanceElementManager.removeOrphanedElements === 'function') {
            window.performanceElementManager.removeOrphanedElements();
        } else if (window.performanceElementManager) {
            window.performanceElementManager.performPeriodicCleanup();
        }

        if (window.intervalManager && typeof window.intervalManager.clearCategory === 'function') {
            window.intervalManager.clearCategory('effect');
            window.intervalManager.clearCategory('particle');
            window.intervalManager.performAutoCleanup();
        }

        if (window.safePerformanceMonitor) {
            window.safePerformanceMonitor.safeCleanup();
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('✅ Performance optimization completed');
    }

    /**
     * FULL SYSTEM RESTART - Simulates F5 refresh without actually refreshing
     * This recreates everything exactly as it would be on fresh page load
     */
    restartEssentialAnimations() {
        console.log('🔄 FULL SYSTEM RESTART - Simulating F5 refresh...');
        
        // 1. FORCE RECREATE CHAOS ENGINE (like fresh page load)
        if (window.chaosEngine && window.chaosEngine.init) {
            console.log('🎆 Force reinitializing Chaos Engine...');
            window.chaosEngine.init(true); // Force restart = true
        }
        
        // 2. RECREATE ALL ANIMATION SYSTEMS
        if (window.chaosInit) {
            console.log('🎨 Recreating all animation systems...');
            
            // Recreate performance monitoring
            if (typeof window.chaosInit.initPerformanceMonitor === 'function') {
                window.chaosInit.initPerformanceMonitor();
            }
            
            // Recreate background animator
            if (window.backgroundAnimator && window.backgroundAnimator.init) {
                window.backgroundAnimator.init();
                if (window.backgroundAnimator.startGlitchSequence) {
                    window.backgroundAnimator.startGlitchSequence();
                }
            }
            
            // Recreate logo animator
            if (window.enhancedLogoAnimator && window.enhancedLogoAnimator.init) {
                window.enhancedLogoAnimator.init();
            }
            
            // Recreate centerpiece logo system
            if (window.centerpieceLogo && window.centerpieceLogo.init) {
                window.centerpieceLogo.init();
            }
            
            // Recreate text effects
            if (window.textEffects && window.textEffects.init) {
                window.textEffects.init();
                if (window.textEffects.addDataCorruption) {
                    window.textEffects.addDataCorruption();
                }
            }
            
            // Recreate matrix messages
            if (window.matrixMessages && window.matrixMessages.init) {
                window.matrixMessages.init();
            }
            
            // Recreate subtle effects
            if (window.subtleEffects && window.subtleEffects.init) {
                window.subtleEffects.init();
            }
            
            // 3. RECREATE ALL ADDITIONAL EFFECTS (like addScanlines, etc)
            console.log('✨ Recreating additional effects...');
            if (typeof window.chaosInit.addScanlines === 'function') {
                window.chaosInit.addScanlines();
            }
            if (typeof window.chaosInit.addVHSDistortion === 'function') {
                window.chaosInit.addVHSDistortion();
            }
            if (typeof window.chaosInit.addCyberGrid === 'function') {
                window.chaosInit.addCyberGrid();
            }
            if (typeof window.chaosInit.addGlowEffects === 'function') {
                window.chaosInit.addGlowEffects();
            }
            if (typeof window.chaosInit.addStaticNoise === 'function') {
                window.chaosInit.addStaticNoise();
            }
            if (typeof window.chaosInit.addDataStreams === 'function') {
                window.chaosInit.addDataStreams();
            }
            if (typeof window.chaosInit.addHolographicShimmer === 'function') {
                window.chaosInit.addHolographicShimmer();
            }
            if (typeof window.chaosInit.addSubtleColorVariations === 'function') {
                window.chaosInit.addSubtleColorVariations();
            }
        }
        
        // 4. RECREATE RANDOM & EXTENDED ANIMATIONS
        if (window.randomAnimations && window.randomAnimations.init) {
            console.log('🎲 Recreating random animations...');
            window.randomAnimations.init();
        }
        
        if (window.extendedAnimations && window.extendedAnimations.init) {
            console.log('🎆 Recreating extended animations...');
            window.extendedAnimations.init();
        }
        
        // 5. RECREATE SPECIALIZED EFFECTS
        if (window.beehiveLogoBlend && window.beehiveLogoBlend.init) {
            window.beehiveLogoBlend.init();
        }
        
        if (window.sonarEffect && window.sonarEffect.init) {
            window.sonarEffect.init();
        }
        
        if (window.lottieAnimations && window.lottieAnimations.init) {
            window.lottieAnimations.init();
        }
        
        if (window.beehiveBackground && window.beehiveBackground.init) {
            window.beehiveBackground.init();
        }
        
        // 6. RESTART PHASE ANIMATIONS (like fresh page load)
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = true;
            
            // Start animation phases with same timing as fresh load
            setTimeout(() => {
                console.log('🚀 Starting animation phases (like fresh page load)...');
                if (typeof window.chaosInit.startAnimationPhases === 'function') {
                    window.chaosInit.startAnimationPhases();
                }
            }, 2000); // Same 2-second delay as original init
            
            // Restart animation watchdog
            if (typeof window.chaosInit.startAnimationWatchdog === 'function') {
                window.chaosInit.startAnimationWatchdog();
            }
        }
        
        // 7. ENSURE BLACKOUT OVERLAY EXISTS (like original init)
        if (window.chaosInit && typeof window.chaosInit.ensureBlackoutOverlay === 'function') {
            window.chaosInit.ensureBlackoutOverlay();
        }
        
        console.log('✅ FULL SYSTEM RESTART COMPLETED - All systems recreated like F5 refresh!');
    }

    handleSequenceEvent(data) {
        // Replay recorded events
        switch(data.originalType) {
            case 'trigger':
                this.triggerEffect(data.data);
                break;
            case 'scene':
                this.changeScene(data.data);
                break;
            // Add more as needed
        }
    }

    startPerformanceMonitoring() {
        // Monitor FPS with automatic emergency stop
        let lastTime = performance.now();
        let frames = 0;
        let fps = 60;
        let lowFpsCount = 0;
        const LOW_FPS_THRESHOLD = 10;
        const LOW_FPS_DURATION = 5; // seconds

        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                fps = (frames * 1000) / (currentTime - lastTime);
                frames = 0;
                lastTime = currentTime;
                
                // AUTO EMERGENCY STOP: Check for critically low FPS
                if (fps < LOW_FPS_THRESHOLD) {
                    lowFpsCount++;
                    console.warn(`⚠️ Low FPS detected: ${fps.toFixed(1)} (${lowFpsCount}/${LOW_FPS_DURATION}s)`);
                    
                    if (lowFpsCount >= LOW_FPS_DURATION) {
                        console.log('🚨 AUTO EMERGENCY STOP: FPS below 10 for 5+ seconds!');
                        this.emergencyStop();
                        lowFpsCount = 0; // Reset counter after emergency stop
                    }
                } else {
                    // Reset low FPS counter when performance recovers
                    if (lowFpsCount > 0) {
                        console.log('✅ FPS recovered, resetting low FPS counter');
                        lowFpsCount = 0;
                    }
                }
            }

            this.currentFPS = fps;
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
        
        console.log('📈 Performance monitoring started with auto-emergency stop (FPS < 10 for 5s)');
    }

    sendPerformanceData() {
        const data = {
            type: 'performance_update',
            fps: this.currentFPS || 60,
            activeFx: this.activeFx,
            cpu: 0 // Would need actual CPU monitoring
        };

        // Get FPS from ChaosControl if available
        if (window.ChaosControl && window.ChaosControl.getFPS) {
            data.fps = window.ChaosControl.getFPS();
        }

        this.sendMessage(data);
    }

    sendDetailedPerformanceData() {
        // Gather detailed performance data from all systems
        const detailedData = {
            type: 'detailed_performance_update',
            animations: window.gsapAnimationRegistry ? window.gsapAnimationRegistry.animations.size : 0,
            managedElements: window.performanceElementManager ? window.performanceElementManager.elements.size : 0,
            intervals: window.intervalManager ? window.intervalManager.intervals.size : 0,
            activeFx: this.activeFx, // Include activeFx counter
            fps: window.safePerformanceMonitor ? window.safePerformanceMonitor.metrics.fps : 0,
            memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
            timestamp: Date.now()
        };

        console.log('📊 Sending detailed performance data:', detailedData);
        this.sendMessage(detailedData);
    }

    hookIntoChaosEngine() {
        // Wait for chaos engine to be ready
        const checkChaosEngine = setInterval(() => {
            if (window.chaosInit || window.ChaosControl) {
                clearInterval(checkChaosEngine);
                console.log('✅ VJ Receiver hooked into Chaos Engine');

                // Store reference to chaos init
                window.chaosInit = window.chaosInit || {};

                // Add VJ control to window for debugging
                window.vjReceiver = this;
            }
        }, 100);
    }
}

// Auto-initialize
const vjReceiver = new VJReceiver();

// Export for module usage
export default vjReceiver;