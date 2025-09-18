// VJ Receiver Module - Receives control messages from control panel
// Integrates with existing chaos engine

import gsap from 'gsap';

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
        
        // Debounce color filter application for smooth slider movement
        if (this.colorFilterTimeout) {
            clearTimeout(this.colorFilterTimeout);
        }
        
        this.colorFilterTimeout = setTimeout(() => {
            console.log('🎛️ Debounce timeout reached, applying color filter...');
            this.applyColorFilter();
        }, 300); // Increased to 300ms for even smoother slider movement
    }

    applyColorFilter() {
        console.log('🎨 applyColorFilter called with settings:', this.currentSettings.colors);
        
        const { hue, saturation, brightness, contrast } = this.currentSettings.colors;

        // Construct filter with safe minimum values to prevent grey flashes
        const safeHue = Math.max(-180, Math.min(180, hue || 0));
        const safeSaturation = Math.max(80, Math.min(200, saturation || 100)); // Minimum 80% to prevent grey
        const safeBrightness = Math.max(95, Math.min(150, brightness || 100)); // Minimum 95% to prevent grey
        const safeContrast = Math.max(80, Math.min(150, contrast || 100)); // Minimum 80% to prevent washout

        const safeFilter = `hue-rotate(${safeHue}deg) saturate(${safeSaturation}%) brightness(${safeBrightness}%) contrast(${safeContrast}%)`;

        console.log(`🎨 Applying safe filter: ${safeFilter}`);

        try {
            // Check if GSAP is available
            if (typeof gsap === 'undefined') {
                console.error('❌ GSAP not available in VJ receiver');
                // Fallback to direct CSS
                document.body.style.filter = safeFilter;
                return;
            }

            // Always use direct GSAP for immediate responsiveness with smooth transition
            gsap.killTweensOf(document.body, 'filter');
            gsap.to(document.body, {
                filter: safeFilter,
                duration: 1.2, // Even longer for very smooth slider movement
                ease: 'power1.inOut', // Gentler easing for smoother feel
                onComplete: () => {
                    console.log('✅ Color filter transition completed');
                },
                onUpdate: () => {
                    // Minimal logging to avoid console spam
                    // const progress = gsap.getProperty(document.body, 'filter');
                }
            });
            
            console.log(`✅ Color filter animation started`);
        } catch (error) {
            console.error('❌ Error applying color filter:', error);
            // Emergency fallback
            document.body.style.filter = safeFilter;
        }
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
        if (window.chaosEngine && window.chaosEngine.glitchPass) {
            window.chaosEngine.glitchPass.enabled = value > 0.1;
            // Additional glitch parameters would go here
        }
    }

    updateParticleIntensity(value) {
        // Adjust particle system
        if (window.chaosEngine && window.chaosEngine.particles) {
            window.chaosEngine.particles.material.opacity = value;
            window.chaosEngine.particles.material.size = 0.5 * value;
        }
    }

    updateDistortionIntensity(value) {
        // Adjust distortion effects
        const distortionElements = document.querySelectorAll('.image-wrapper, .logo-text-wrapper');
        distortionElements.forEach(el => {
            el.style.filter = `blur(${value * 2}px)`;
        });
    }

    updateNoiseIntensity(value) {
        // Adjust static noise
        const noiseCanvas = document.getElementById('static-noise');
        if (noiseCanvas) {
            noiseCanvas.style.opacity = value * 0.03; // Scale to appropriate range
        }
    }

    triggerEffect(effect) {
        console.log(`⚡ Triggering effect: ${effect}`);
        this.activeFx++;

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

        // Slower strobe animation
        gsap.to(strobe, {
            opacity: 0,
            duration: 0.15,  // Increased from 0.05 - slower strobe
            repeat: 6,       // Reduced from 10 - fewer flashes
            yoyo: true,
            ease: 'none',
            onComplete: () => strobe.remove()
        });
    }

    triggerBlackout() {
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
            .to(blackout, { opacity: 1, duration: 0.2 })
            .to(blackout, { opacity: 0, duration: 0.2, delay: 1 })
            .call(() => blackout.remove());
    }

    triggerWhiteout() {
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
            .to(whiteout, { opacity: 1, duration: 0.1 })
            .to(whiteout, { opacity: 0, duration: 1.5, ease: 'power2.out' })
            .call(() => whiteout.remove());
    }

    triggerRGBSplit() {
        const originalFilter = document.body.style.filter;

        gsap.timeline()
            .to(document.body, {
                filter: 'hue-rotate(120deg) saturate(2)',
                duration: 0.2  // Increased from 0.1 - slower RGB split
            })
            .to(document.body, {
                filter: 'hue-rotate(-120deg) saturate(2)',
                duration: 0.2  // Increased from 0.1 - slower RGB split
            })
            .to(document.body, {
                filter: originalFilter || 'none',
                duration: 0.5,  // Increased from 0.3 - slower recovery
                ease: 'power2.out'
            });
    }

    triggerShake() {
        // REPLACED: Ripple effect instead of shake
        this.triggerRipple();
    }

    triggerRipple() {
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
            scale: 20,
            opacity: 0,
            duration: 1.5,
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
        for (let i = 0; i < 8; i++) {
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
                duration: Math.random() * 1 + 0.5,
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

        // Apply performance mode to all available systems
        if (window.ChaosControl && window.ChaosControl.setPerformance) {
            window.ChaosControl.setPerformance(mode);
        }

        if (window.performanceManager) {
            window.performanceManager.setMode(mode);
        }

        if (window.performanceElementManager) {
            window.performanceElementManager.setPerformanceMode(mode);
        }

        if (window.gsapAnimationRegistry) {
            // Adjust animation limits based on performance mode
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
            console.log(`🎬 GSAP animation limit set to ${window.gsapAnimationRegistry.maxAnimations} for ${mode} mode`);
        }

        // Send confirmation back to control panel
        this.sendMessage({
            type: 'performance_mode_updated',
            mode: mode,
            timestamp: Date.now()
        });
    }

    emergencyStop() {
        console.log('🚨 EMERGENCY STOP!');

        // Stop all animations
        gsap.killTweensOf('*');

        // Reset everything
        this.resetColors();
        this.updateSpeed(1);

        // Disable all effects
        Object.keys(this.currentSettings.effects).forEach(effect => {
            this.updateEffectIntensity(effect, 0);
        });

        // Stop phase animations
        if (window.chaosInit) {
            window.chaosInit.phaseRunning = false;
        }

        // Clear any overlays
        document.querySelectorAll('div[style*="position: fixed"]').forEach(el => {
            if (!el.classList.contains('control-panel')) {
                el.remove();
            }
        });

        // Reset to calm state
        setTimeout(() => {
            this.changeScene('calm');
        }, 1000);
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
        
        // Trigger cleanup on all performance systems
        if (window.performanceElementManager) {
            window.performanceElementManager.performPeriodicCleanup();
        }
        
        if (window.gsapAnimationRegistry) {
            window.gsapAnimationRegistry.performPeriodicCleanup();
        }
        
        if (window.intervalManager) {
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
        // Monitor FPS
        let lastTime = performance.now();
        let frames = 0;
        let fps = 60;

        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();

            if (currentTime >= lastTime + 1000) {
                fps = (frames * 1000) / (currentTime - lastTime);
                frames = 0;
                lastTime = currentTime;
            }

            this.currentFPS = fps;
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
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