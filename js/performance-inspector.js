// Performance Inspector - Check actual GSAP and DOM performance
// This will run automatically and log real performance data

import { createLogger } from './utils/logger.js';

// Create namespaced logger
const log = createLogger('perf');

class PerformanceInspector {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
        
        log.once('perf:init', () => {
            log.info('Performance Inspector loaded');
        });
        
        // Start inspection after page loads
        setTimeout(() => {
            this.startInspection();
        }, 5000);
    }

    startInspection() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        log.once('perf:start', () => {
            log.info('Performance inspection started');
        });
        
        // Log initial state
        this.logPerformanceState();
        
        // Check less frequently to reduce console spam
        this.intervalId = setInterval(() => {
            this.logPerformanceState();
        }, 30000); // every 30s instead of 10s
    }

    logPerformanceState() {
        const report = this.gatherPerformanceData();
        
        // Use throttled logging to prevent spam - only log every 30s
        log.throttle('perf:report', 30000, () => {
            log.group('Performance Report', () => {
                log.info('DOM Elements:', report.domElements);
                log.info('GSAP Animations:', report.gsapAnimations);
                log.info('Memory Usage:', report.memoryFormatted);
                log.info('Current FPS:', report.fps);
                log.info('Loaded Modules:', report.loadedModules.join(', '));
                if (report.issues.length > 0) {
                    log.warn('Performance Issues:', report.issues.join(', '));
                } else {
                    log.debug('Performance Issues: None detected');
                }
            });
        });
        
        // Always provide a minimal debug-level summary
        log.debug(`Perf: DOM ${report.domElements}, Anim ${report.gsapAnimations} active, ${report.fps} FPS`);
    }

    gatherPerformanceData() {
        const report = {
            domElements: document.querySelectorAll('*').length,
            gsapAnimations: this.getGSAPAnimationCount(),
            memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
            memoryFormatted: this.formatBytes(performance.memory ? performance.memory.usedJSHeapSize : 0),
            fps: this.estimateFPS(),
            loadedModules: this.checkLoadedModules(),
            issues: this.identifyIssues()
        };

        return report;
    }

    getGSAPAnimationCount() {
        try {
            if (typeof gsap !== 'undefined') {
                // Count active animations
                const activeAnimations = gsap.globalTimeline.getChildren().length;
                const allTweens = gsap.getTweensOf('*').length;
                
                return `${activeAnimations} active, ${allTweens} total tweens`;
            }
            return 'GSAP not available';
        } catch (error) {
            return `Error: ${error.message}`;
        }
    }

    estimateFPS() {
        // Simple FPS estimation
        if (window.safePerformanceMonitor && window.safePerformanceMonitor.metrics) {
            return window.safePerformanceMonitor.metrics.fps;
        }
        return 'Unknown';
    }

    checkLoadedModules() {
        const modules = [];
        
        // Check for key global objects
        if (window.chaosInit) modules.push('chaosInit');
        if (window.vjReceiver) modules.push('vjReceiver');
        if (window.safePerformanceMonitor) modules.push('safePerformanceMonitor');
        if (window.performanceElementManager) modules.push('performanceElementManager');
        if (window.intervalManager) modules.push('intervalManager');
        if (window.earlyGSAPRegistry) modules.push('earlyGSAPRegistry');
        if (typeof gsap !== 'undefined') modules.push('gsap');
        
        return modules;
    }

    identifyIssues() {
        const issues = [];
        
        // Check DOM element count
        const domCount = document.querySelectorAll('*').length;
        if (domCount > 1000) {
            issues.push(`High DOM count: ${domCount}`);
        }
        
        // Check for performance management
        if (!window.performanceElementManager) {
            issues.push('No element management');
        }
        
        if (!window.intervalManager) {
            issues.push('No interval management');
        }
        
        // Check for problematic elements
        const rectangularElements = document.querySelectorAll('div[style*="width: 100%"][style*="position: fixed"]').length;
        if (rectangularElements > 10) {
            issues.push(`Many rectangular elements: ${rectangularElements}`);
        }
        
        // Check memory usage
        if (performance.memory && performance.memory.usedJSHeapSize > 100 * 1024 * 1024) {
            issues.push(`High memory: ${this.formatBytes(performance.memory.usedJSHeapSize)}`);
        }
        
        return issues;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    testColorSlider() {
        log.info('Testing color slider communication...');
        
        // Simulate color update message
        if (window.vjReceiver) {
            log.info('VJ Receiver found, testing updateColor...');
            window.vjReceiver.updateColor('hue', 45);
        } else {
            log.warn('VJ Receiver not found');
        }
    }

    destroy() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        log.info('Performance Inspector destroyed');
    }
}

// Create instance and make globally available
const performanceInspector = new PerformanceInspector();
window.performanceInspector = performanceInspector;

// Add manual test functions
window.TEST_PERFORMANCE = () => performanceInspector.logPerformanceState();
window.TEST_COLOR_SLIDER = () => performanceInspector.testColorSlider();

log.once('perf:ready', () => {
    log.info('Performance Inspector ready. Use window.TEST_PERFORMANCE() or window.TEST_COLOR_SLIDER()');
});

export default performanceInspector;