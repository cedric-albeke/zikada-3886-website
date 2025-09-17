// Safe Performance Monitor - Non-intrusive monitoring only
// Does NOT patch GSAP or interfere with animations

class SafePerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 60,
            fpsHistory: [],
            memoryUsage: 0,
            domNodes: 0,
            performanceMode: 'normal'
        };
        
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.isMonitoring = false;
        
        console.log('📊 Safe Performance Monitor initialized (non-intrusive)');
    }

    /**
     * Start monitoring without interfering with animations
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Start FPS monitoring
        this.startFPSMonitoring();
        
        // Start periodic system checks (very conservative)
        this.startSystemMonitoring();
        
        console.log('📊 Safe performance monitoring started');
    }

    startFPSMonitoring() {
        const measureFPS = () => {
            if (!this.isMonitoring) return;
            
            const now = performance.now();
            this.frameCount++;
            
            // Calculate FPS every second
            if (now >= this.lastFrameTime + 1000) {
                const currentFPS = (this.frameCount * 1000) / (now - this.lastFrameTime);
                
                this.metrics.fps = Math.round(currentFPS);
                this.metrics.fpsHistory.push(this.metrics.fps);
                
                // Keep only last 60 seconds
                if (this.metrics.fpsHistory.length > 60) {
                    this.metrics.fpsHistory.shift();
                }
                
                this.frameCount = 0;
                this.lastFrameTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
    }

    startSystemMonitoring() {
        // Very conservative monitoring - every 10 seconds
        setInterval(() => {
            this.updateSystemMetrics();
        }, 10000);
    }

    updateSystemMetrics() {
        // Memory usage
        if (performance.memory) {
            this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
        }
        
        // DOM node count
        this.metrics.domNodes = document.querySelectorAll('*').length;
        
        // Check for performance issues (log only, don't fix)
        this.checkPerformanceIssues();
    }

    checkPerformanceIssues() {
        const { fps, memoryUsage, domNodes } = this.metrics;
        
        // Log warnings but DON'T take action
        if (fps < 15) {
            console.warn(`⚠️ Critical FPS: ${fps} - Consider manual cleanup`);
        } else if (fps < 30) {
            console.warn(`⚠️ Low FPS: ${fps} - Monitor performance`);
        }
        
        if (domNodes > 3000) {
            console.warn(`⚠️ High DOM node count: ${domNodes} - Consider cleanup`);
        }
        
        if (memoryUsage > 150 * 1024 * 1024) { // 150MB
            console.warn(`⚠️ High memory usage: ${this.formatBytes(memoryUsage)}`);
        }
    }

    /**
     * Manual cleanup function (safe, user-triggered only)
     */
    safeCleanup() {
        console.log('🧹 Performing safe manual cleanup...');
        
        // Only remove clearly temporary elements
        const temporarySelectors = [
            'div[style*="position: fixed"][style*="z-index: 999"]',
            '.matrix-overlay',
            '.phase-overlay',
            '.flash-overlay',
            '.glitch-overlay'
        ];
        
        let removed = 0;
        temporarySelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                // Extra safety checks
                if (!el.classList.contains('pre-loader') && 
                    !el.classList.contains('control-panel') &&
                    !el.querySelector('.logo-text') &&
                    !el.querySelector('.image-2')) {
                    try {
                        el.remove();
                        removed++;
                    } catch (e) {
                        // Silent fail
                    }
                }
            });
        });
        
        console.log(`🧹 Safe cleanup removed ${removed} temporary elements`);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        return removed;
    }

    /**
     * Emergency brake - stop problematic effects only
     */
    emergencyBrake() {
        console.log('🚨 Emergency brake - disabling heavy effects only');
        
        // Add CSS to disable only the heaviest effects
        const emergencyStyle = document.createElement('style');
        emergencyStyle.id = 'emergency-brake-style';
        emergencyStyle.textContent = `
            /* Disable only the heaviest performance-impacting effects */
            .quantum-particles { display: none !important; }
            .holographic-shimmer { display: none !important; }
            .energy-field { display: none !important; }
            
            /* Reduce but don't disable essential effects */
            #static-noise { opacity: 0.005 !important; }
            .chromatic-pulse { opacity: 0.001 !important; }
            
            /* Keep all other animations running normally */
        `;
        
        document.head.appendChild(emergencyStyle);
        
        // Perform safe cleanup
        this.safeCleanup();
        
        console.log('🚨 Emergency brake applied - heavy effects disabled, core animations preserved');
    }

    /**
     * Restore full effects
     */
    restoreEffects() {
        const emergencyStyle = document.getElementById('emergency-brake-style');
        if (emergencyStyle) {
            emergencyStyle.remove();
            console.log('✅ Full effects restored');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getReport() {
        const avgFPS = this.metrics.fpsHistory.length > 0 ? 
            this.metrics.fpsHistory.reduce((a, b) => a + b, 0) / this.metrics.fpsHistory.length : 0;
            
        return {
            fps: {
                current: this.metrics.fps,
                average: Math.round(avgFPS)
            },
            memory: {
                usage: this.metrics.memoryUsage,
                formatted: this.formatBytes(this.metrics.memoryUsage)
            },
            dom: {
                totalNodes: this.metrics.domNodes
            },
            timestamp: new Date()
        };
    }

    destroy() {
        this.isMonitoring = false;
        console.log('💀 Safe Performance Monitor destroyed');
    }
}

// Create global instance
const safePerformanceMonitor = new SafePerformanceMonitor();

// Auto-start monitoring
safePerformanceMonitor.startMonitoring();

// Make it globally available
window.safePerformanceMonitor = safePerformanceMonitor;

// Add global emergency functions
window.SAFE_CLEANUP = () => safePerformanceMonitor.safeCleanup();
window.EMERGENCY_BRAKE = () => safePerformanceMonitor.emergencyBrake();
window.RESTORE_EFFECTS = () => safePerformanceMonitor.restoreEffects();

console.log('🛡️ Safe performance monitoring ready - no animation interference');

export default safePerformanceMonitor;