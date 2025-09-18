// Performance Manager for AAA Animation System
import gsap from 'gsap';

class PerformanceManager {
    constructor() {
        this.fps = 120;
        this.targetFPS = 120;
        this.frameTime = 1000 / 120;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.performanceMode = 'high'; // 'high', 'medium', 'low'
        this.isMonitoring = false;

        // Resource tracking
        this.resources = {
            elements: new Set(),
            timers: new Set(),
            intervals: new Set(),
            observers: new Set(),
            animations: new Set()
        };

        // Element pooling
        this.elementPools = new Map();

        // Performance thresholds - RELAXED for smoother operation
        this.thresholds = {
            criticalFPS: 20,     // Only go low mode under 20 FPS
            lowFPS: 35,          // Medium mode under 35 FPS (was 45)
            memoryLimit: 512 * 1024 * 1024, // 512MB
            elementLimit: 1500   // Increased element limit
        };

        // Add debouncing for mode changes
        this.lastModeChange = 0;
        this.modeChangeDebounce = 3000; // Don't change modes more than once per 3 seconds

        // Optimization flags
        this.optimizations = {
            reduceParticles: false,
            simplifyEffects: false,
            throttleAnimations: false,
            useRAF: true
        };
    }

    init() {
        this.startMonitoring();
        // this.setupOptimizations(); // Removed - function doesn't exist yet
        // console.log('🎮 Performance Manager initialized'); // Reduced logging
    }

    // FPS Monitoring
    startMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;

        const monitor = (currentTime) => {
            if (!this.isMonitoring) return;

            this.deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;

            if (this.deltaTime > 0) {
                this.fps = Math.round(1000 / this.deltaTime);
                this.frameCount++;

                // Keep history of last 60 frames
                this.fpsHistory.push(this.fps);
                if (this.fpsHistory.length > 60) {
                    this.fpsHistory.shift();
                }

                // Check performance every second
                if (this.frameCount % 60 === 0) {
                    this.evaluatePerformance();
                }
            }

            requestAnimationFrame(monitor);
        };

        requestAnimationFrame(monitor);
    }

    evaluatePerformance() {
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;

        if (avgFPS < this.thresholds.criticalFPS) {
            this.setPerformanceMode('low');
        } else if (avgFPS < this.thresholds.lowFPS) {
            this.setPerformanceMode('medium');
        } else {
            this.setPerformanceMode('high');
        }

        // Check memory usage if available
        if (performance.memory) {
            const memoryUsed = performance.memory.usedJSHeapSize;
            if (memoryUsed > this.thresholds.memoryLimit) {
                this.triggerCleanup();
            }
        }

        // Check element count
        const elementCount = document.querySelectorAll('[data-animation]').length;
        if (elementCount > this.thresholds.elementLimit) {
            this.cleanupExcessElements();
        }
    }

    setPerformanceMode(mode) {
        if (this.performanceMode === mode) return;

        // Debounce mode changes
        const now = Date.now();
        if (now - this.lastModeChange < this.modeChangeDebounce) {
            return; // Too soon to change modes
        }

        this.performanceMode = mode;
        this.lastModeChange = now;
        // Reduce logging - only log important changes
        if (mode === 'low') {
            console.log(`⚡ Performance mode: ${mode} (reducing effects)`);
        }

        switch (mode) {
            case 'low':
                this.optimizations.reduceParticles = true;
                this.optimizations.simplifyEffects = true;
                this.optimizations.throttleAnimations = true;
                this.applyLowPerformanceSettings();
                break;
            case 'medium':
                this.optimizations.reduceParticles = false;
                this.optimizations.simplifyEffects = true;
                this.optimizations.throttleAnimations = false;
                this.applyMediumPerformanceSettings();
                break;
            case 'high':
                this.optimizations.reduceParticles = false;
                this.optimizations.simplifyEffects = false;
                this.optimizations.throttleAnimations = false;
                this.applyHighPerformanceSettings();
                break;
        }

        // Dispatch event for other systems to respond
        window.dispatchEvent(new CustomEvent('performanceModeChange', {
            detail: { mode, optimizations: this.optimizations }
        }));
    }

    applyLowPerformanceSettings() {
        // Reduce particle count
        const event = new CustomEvent('adjustParticles', { detail: { count: 500 } });
        window.dispatchEvent(event);

        // Simplify animations
        gsap.globalTimeline.timeScale(0.8);

        // Reduce post-processing
        window.dispatchEvent(new CustomEvent('adjustPostProcessing', {
            detail: { quality: 'low' }
        }));
    }

    applyMediumPerformanceSettings() {
        // Moderate particle count
        const event = new CustomEvent('adjustParticles', { detail: { count: 1000 } });
        window.dispatchEvent(event);

        // Normal animation speed
        gsap.globalTimeline.timeScale(1);

        // Medium post-processing
        window.dispatchEvent(new CustomEvent('adjustPostProcessing', {
            detail: { quality: 'medium' }
        }));
    }

    applyHighPerformanceSettings() {
        // Full particle count
        const event = new CustomEvent('adjustParticles', { detail: { count: 2000 } });
        window.dispatchEvent(event);

        // Normal animation speed
        gsap.globalTimeline.timeScale(1);

        // Full post-processing
        window.dispatchEvent(new CustomEvent('adjustPostProcessing', {
            detail: { quality: 'high' }
        }));
    }

    // Element Pooling System
    getElementPool(tagName) {
        if (!this.elementPools.has(tagName)) {
            this.elementPools.set(tagName, new ElementPool(tagName));
        }
        return this.elementPools.get(tagName);
    }

    // Resource Management
    track(resource, type = 'elements') {
        if (this.resources[type]) {
            this.resources[type].add(resource);
        }
        return resource;
    }

    untrack(resource, type = 'elements') {
        if (this.resources[type]) {
            this.resources[type].delete(resource);
        }
    }

    trackTimer(timer) {
        this.resources.timers.add(timer);
        return timer;
    }

    trackInterval(interval) {
        this.resources.intervals.add(interval);
        return interval;
    }

    trackElement(element) {
        element.setAttribute('data-animation', 'tracked');
        this.resources.elements.add(element);
        return element;
    }

    // Cleanup Methods
    triggerCleanup() {
        console.log('🧹 Triggering performance cleanup');

        // Clean completed animations
        this.cleanupAnimations();

        // Remove old elements
        this.cleanupElements();

        // Force garbage collection hint
        if (window.gc) {
            window.gc();
        }
    }

    cleanupElements() {
        const elements = Array.from(this.resources.elements);
        const toRemove = [];

        elements.forEach(element => {
            if (!document.body.contains(element)) {
                toRemove.push(element);
            } else if (element.hasAttribute('data-cleanup')) {
                element.remove();
                toRemove.push(element);
            }
        });

        toRemove.forEach(element => {
            this.resources.elements.delete(element);
        });
    }

    cleanupExcessElements() {
        const animatedElements = document.querySelectorAll('[data-animation]');
        const excess = animatedElements.length - this.thresholds.elementLimit;

        if (excess > 0) {
            // Remove oldest elements first
            for (let i = 0; i < excess && i < animatedElements.length; i++) {
                const element = animatedElements[i];
                if (!element.hasAttribute('data-persistent')) {
                    element.remove();
                }
            }
        }
    }

    cleanupAnimations() {
        // Kill completed GSAP animations
        const allTweens = gsap.globalTimeline.getChildren();
        allTweens.forEach(tween => {
            if (tween.progress() === 1 && !tween.repeat()) {
                tween.kill();
            }
        });
    }

    // Optimization Helpers
    throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }

    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Frame-based execution
    executeOnFrame(callback, frameInterval = 1) {
        let frameCounter = 0;
        const execute = () => {
            if (frameCounter % frameInterval === 0) {
                callback();
            }
            frameCounter++;
            if (this.optimizations.useRAF) {
                requestAnimationFrame(execute);
            }
        };
        requestAnimationFrame(execute);
    }

    // Performance Stats
    getStats() {
        return {
            fps: this.fps,
            avgFPS: this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length,
            mode: this.performanceMode,
            elementCount: this.resources.elements.size,
            timerCount: this.resources.timers.size,
            memoryUsed: performance.memory ?
                Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB' :
                'N/A'
        };
    }

    // Cleanup all resources
    destroy() {
        this.isMonitoring = false;

        // Clear all tracked resources
        this.resources.elements.forEach(el => el.remove());
        this.resources.timers.forEach(timer => clearTimeout(timer));
        this.resources.intervals.forEach(interval => clearInterval(interval));
        this.resources.observers.forEach(observer => observer.disconnect());

        // Clear pools
        this.elementPools.clear();

        console.log('🔚 Performance Manager destroyed');
    }
}

// Element Pool Class
class ElementPool {
    constructor(tagName, maxSize = 50) {
        this.tagName = tagName;
        this.maxSize = maxSize;
        this.available = [];
        this.inUse = new Set();
    }

    get() {
        let element = this.available.pop();
        if (!element) {
            element = document.createElement(this.tagName);
            element.setAttribute('data-pooled', 'true');
        }

        // Reset element
        element.className = '';
        element.style.cssText = '';
        element.textContent = '';

        this.inUse.add(element);
        return element;
    }

    release(element) {
        if (this.inUse.has(element)) {
            this.inUse.delete(element);

            if (this.available.length < this.maxSize) {
                // Clear element for reuse
                element.className = '';
                element.style.cssText = '';
                element.textContent = '';
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                this.available.push(element);
            } else {
                // Pool is full, destroy element
                element.remove();
            }
        }
    }

    clear() {
        this.available = [];
        this.inUse.forEach(element => element.remove());
        this.inUse.clear();
    }
}

// Export singleton instance
export default new PerformanceManager();