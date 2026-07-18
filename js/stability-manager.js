// Stability Manager - Comprehensive stability improvements for ZIKADA 3886
// Prevents crashes, handles errors gracefully, and maintains system stability

import animationRuntime from './runtime/animation-runtime.js';
import performanceBus from './performance-bus.js';

class StabilityManager {
    constructor() {
        this.runtimeOwner = 'stability-manager';
        animationRuntime.disposeOwner(this.runtimeOwner);
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorWindow = 60000; // 1 minute
        this.errorHistory = [];
        this.recoveryAttempts = new Map();
        this.maxRecoveryAttempts = 3;
        this.startedAt = performance.now();
        this.startupGraceMs = 20000;
        this.lowFpsSampleCount = 0;
        this.requiredLowFpsSamples = 6;
        this.performanceActionCooldownMs = 30000;
        this.lastPerformanceActionAt = 0;
        this.emergencyRecoveryCooldownMs = 60000;
        this.lastEmergencyRecoveryAt = 0;
        
        this.stabilityChecks = {
            memory: { threshold: 100, action: 'memory' },
            fps: { threshold: 45, minimumAcceptable: 30, target: 60, action: 'performance' },
            domNodes: { threshold: 8000, action: 'dom' },
            errors: { threshold: 5, action: 'error' }
        };
        
        this.circuitBreakers = new Map();
        this.fallbackModes = new Map();
        
        this.init();
    }
    
    init() {
        this.setupErrorHandling();
        this.setupStabilityMonitoring();
        this.setupCircuitBreakers();
        this.setupFallbackModes();
        this.setupRecoveryMechanisms();
        
        console.log('🛡️ Stability Manager initialized');
    }
    
    setupErrorHandling() {
        // Global error handler
        this.listen('error', (event) => {
            // Check if this is a resource loading error for optional resources
            const optionalResourcePatterns = [
                /manifest\.json$/i,
                /\.lottie$/i,
                /beehive-loop\.mp4$/i,
                /\/animations\/lottie\//i,
                /\/lotties\//i,
                /zikada\.io.*(manifest|lottie|beehive)/i
            ];
            
            const src = event.target?.src || event.target?.href || event.filename || '';
            const isOptionalResource = optionalResourcePatterns.some(pattern => pattern.test(src));
            
            // Silently ignore optional resources
            if (isOptionalResource && event.target !== window) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
            
            // Only handle non-optional errors
            if (!isOptionalResource) {
                this.handleError('JavaScript Error', event.error, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            }
        }, true);
        
        // Unhandled promise rejection handler
        this.listen('unhandledrejection', (event) => {
            const reason = event.reason;
            const reasonStr = String(reason || '');
            
            // Check if this is a fetch error for optional resources
            const optionalResourcePatterns = [
                /manifest\.json$/i,
                /\.lottie$/i,
                /beehive-loop\.mp4$/i,
                /\/animations\/lottie\//i,
                /\/lotties\//i,
                /zikada\.io.*(manifest|lottie|beehive)/i,
                /404.*Not Found/i,
                /Failed to fetch/i
            ];
            
            const isOptionalResource = optionalResourcePatterns.some(pattern => 
                pattern.test(reasonStr || reason?.message || reason?.stack || '')
            );
            
            // Silently ignore optional resource fetch errors
            if (isOptionalResource) {
                event.preventDefault();
                return;
            }
            
            this.handleError('Unhandled Promise Rejection', reason);
        });
        
        // Resource loading error handler (for DOM elements like img, script, etc.)
        this.listen('error', (event) => {
            const optionalResourcePatterns = [
                /manifest\.json$/i,
                /\.lottie$/i,
                /beehive-loop\.mp4$/i,
                /\/animations\/lottie\//i,
                /\/lotties\//i,
                /zikada\.io.*(manifest|lottie|beehive)/i
            ];
            
            const src = event.target?.src || event.target?.href || '';
            const isOptionalResource = optionalResourcePatterns.some(pattern => pattern.test(src));
            
            if (event.target !== window && !isOptionalResource) {
                this.handleError('Resource Loading Error', null, {
                    type: event.target.tagName,
                    src: src
                });
            }
            // Silently ignore optional resources (Lottie files, manifest, beehive video)
        }, true);
        
        // Global API monkey-patches were removed. Fetch, console, GSAP, anime
        // and THREE keep their native/library semantics; this boundary observes
        // failures without changing unrelated runtime behavior.
    }

    listen(type, handler, target = window, options) {
        if (!target || typeof target.addEventListener !== 'function') {
            options = target;
            target = window;
        }
        target.addEventListener(type, handler, options);
        animationRuntime.trackDisposer(this.runtimeOwner, () => target.removeEventListener(type, handler, options));
        return handler;
    }
    
    setupFetchInterceptor() {
        const originalFetch = window.fetch;
        const optionalResourcePatterns = [
            /manifest\.json$/i,
            /\.lottie$/i,
            /beehive-loop\.mp4$/i,
            /\/animations\/lottie\//i,
            /\/lotties\//i,
            /zikada\.io.*(manifest|lottie|beehive)/i
        ];
        
        window.fetch = async function(...args) {
            const url = args[0];
            const urlStr = typeof url === 'string' ? url : url?.url || url?.toString() || '';
            const isOptionalResource = optionalResourcePatterns.some(pattern => pattern.test(urlStr));
            
            try {
                const response = await originalFetch.apply(this, args);
                // If it's an optional resource and failed, return empty response without logging
                if (isOptionalResource && !response.ok && response.status === 404) {
                    // Return a mock Response to prevent errors downstream
                    return new Response(null, { 
                        status: 404, 
                        statusText: 'Not Found',
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                return response;
            } catch (error) {
                // Silently handle fetch errors for optional resources
                if (isOptionalResource) {
                    // Return a mock Response to prevent errors downstream
                    return new Response(null, { 
                        status: 404, 
                        statusText: 'Not Found',
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw error;
            }
        };
    }
    
    setupConsoleInterceptor() {
        const originalError = console.error;
        const originalWarn = console.warn;
        
        // Only suppress specific known error messages from dotlottie-player and related libraries
        const suppressPatterns = [
            /\[dotLottie-common\]:.*Error loading animation/i,
            /Failed to load dotLottie.*404/i,
            /Failed to load.*lottie.*404/i,
            /GET.*manifest\.json.*404/i,
            /GET.*\.lottie.*404/i,
            /GET.*beehive-loop\.mp4.*404/i,
            /net::ERR_ABORTED.*404.*(lottie|manifest|beehive)/i
        ];
        
        console.error = function(...args) {
            const message = args.join(' ');
            const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
            
            // Only suppress specific known error messages
            if (!shouldSuppress) {
                originalError.apply(console, args);
            }
        };
        
        console.warn = function(...args) {
            const message = args.join(' ');
            const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
            
            // Only suppress specific known warning messages
            if (!shouldSuppress) {
                originalWarn.apply(console, args);
            }
        };
    }
    
    setupGSAPErrorHandling() {
        if (window.gsap) {
            // Override GSAP methods with error handling
            const originalTween = window.gsap.to;
            window.gsap.to = (targets, vars) => {
                try {
                    return originalTween.call(this, targets, vars);
                } catch (error) {
                    this.handleError('GSAP Tween Error', error, { targets, vars });
                    return null;
                }
            };
            
            const originalTimeline = window.gsap.timeline;
            window.gsap.timeline = (vars) => {
                try {
                    return originalTimeline.call(this, vars);
                } catch (error) {
                    this.handleError('GSAP Timeline Error', error, { vars });
                    return null;
                }
            };
        }
    }
    
    setupAnimeErrorHandling() {
        if (window.anime) {
            const originalAnime = window.anime;
            window.anime = (params) => {
                try {
                    return originalAnime.call(this, params);
                } catch (error) {
                    this.handleError('Anime.js Error', error, { params });
                    return null;
                }
            };
        }
    }
    
    setupThreeJSErrorHandling() {
        if (window.THREE) {
            // Override WebGL context creation with error handling
            const originalWebGLRenderer = window.THREE.WebGLRenderer;
            window.THREE.WebGLRenderer = function(parameters) {
                try {
                    return new originalWebGLRenderer(parameters);
                } catch (error) {
                    this.handleError('Three.js WebGL Error', error, { parameters });
                    // Fallback to Canvas renderer
                    return new window.THREE.CanvasRenderer(parameters);
                }
            };
        }
    }
    
    setupStabilityMonitoring() {
        // Monitor system stability every 5 seconds
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.performStabilityCheck();
        }, 5000);
        
        // Monitor error rate
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.cleanupErrorHistory();
        }, 10000);
    }
    
    performStabilityCheck() {
        const checks = [
            this.checkMemoryStability(),
            this.checkFPSStability(),
            this.checkDOMStability(),
            this.checkErrorStability()
        ];
        
        const criticalIssues = checks.filter(check => check.critical);
        
        if (criticalIssues.length > 0) {
            this.handleCriticalStabilityIssue(criticalIssues);
        }
    }
    
    checkMemoryStability() {
        const memoryBytes = Number(performanceBus.metrics.memoryBytes) || 0;
        const memoryLimitBytes = Number(performanceBus.metrics.memoryLimitBytes) || 0;
        if (!memoryBytes || !memoryLimitBytes) return { stable: true };

        const memUsed = memoryBytes / (1024 * 1024);
        const memLimit = memoryLimitBytes / (1024 * 1024);
        const usagePercent = (memUsed / memLimit) * 100;
        
        const threshold = this.stabilityChecks.memory.threshold;
        const critical = usagePercent > threshold;
        
        if (critical) {
            this.triggerStabilityAction('memory', { usagePercent, memUsed, memLimit });
        }
        
        return { type: 'memory', stable: !critical, critical, usagePercent };
    }
    
    checkFPSStability() {
        if (window.performanceBus || window.performanceOptimizerV2) {
            const fps = window.performanceBus?.metrics?.fps
                || window.performanceOptimizerV2?.getPerformanceMetrics?.().fps
                || 60;
            const profile = window.performanceProfileManager?.currentProfile
                || window.performanceProfile
                || 'high';
            const threshold = profile === 'low'
                ? 20
                : (profile === 'medium' ? 32 : this.stabilityChecks.fps.threshold);
            const belowThreshold = fps < threshold;
            const inStartupGrace = performance.now() - this.startedAt < this.startupGraceMs;

            if (belowThreshold && !inStartupGrace) {
                this.lowFpsSampleCount++;
            } else if (!belowThreshold) {
                this.lowFpsSampleCount = 0;
            }

            const sustainedLowFps = this.lowFpsSampleCount >= this.requiredLowFpsSamples;
            const now = Date.now();
            if (sustainedLowFps && now - this.lastPerformanceActionAt > this.performanceActionCooldownMs) {
                this.triggerStabilityAction('performance', {
                    fps,
                    threshold,
                    samples: this.lowFpsSampleCount
                });
                this.lastPerformanceActionAt = now;
            }

            return {
                type: 'performance',
                stable: !sustainedLowFps,
                critical: false,
                degraded: belowThreshold,
                sustainedLowFps,
                fps,
                lowFpsSampleCount: this.lowFpsSampleCount,
                inStartupGrace
            };
        }
        
        return { type: 'performance', stable: true };
    }
    
    checkDOMStability() {
        const domCount = Number(performanceBus.metrics.domNodes) || 0;
        const threshold = this.stabilityChecks.domNodes.threshold;
        const critical = domCount > threshold;
        
        if (critical) {
            this.triggerStabilityAction('dom', { domCount, threshold });
        }
        
        return { type: 'dom', stable: !critical, critical, domCount };
    }
    
    checkErrorStability() {
        const recentErrors = this.getRecentErrorCount();
        const threshold = this.stabilityChecks.errors.threshold;
        const critical = recentErrors > threshold;
        
        if (critical) {
            this.triggerStabilityAction('error', { recentErrors, threshold });
        }
        
        return { type: 'error', stable: !critical, critical, recentErrors };
    }
    
    handleCriticalStabilityIssue(issues) {
        console.warn('⚠️ Critical stability issues detected:', issues);
        
        // Implement circuit breakers
        issues.forEach(issue => {
            const breaker = this.circuitBreakers.get(issue.type);
            if (breaker && breaker.shouldOpen()) {
                this.openCircuitBreaker(issue.type);
            }
        });
        
        const emergencyIssues = issues.filter(issue => issue.type !== 'performance');
        if (emergencyIssues.length === 0) {
            return;
        }

        this.triggerEmergencyRecovery(emergencyIssues);
    }
    
    setupCircuitBreakers() {
        const breakerTypes = ['memory', 'performance', 'dom', 'error'];
        
        breakerTypes.forEach(type => {
            this.circuitBreakers.set(type, {
                failures: 0,
                lastFailure: 0,
                state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
                threshold: 3,
                timeout: 30000 // 30 seconds
            });
        });
    }
    
    openCircuitBreaker(type) {
        const breaker = this.circuitBreakers.get(type);
        if (breaker) {
            breaker.state = 'OPEN';
            breaker.lastFailure = Date.now();
            console.log(`🔴 Circuit breaker opened for: ${type}`);
            
            // Enable fallback mode
            this.enableFallbackMode(type);
        }
    }
    
    closeCircuitBreaker(type) {
        const breaker = this.circuitBreakers.get(type);
        if (breaker) {
            breaker.state = 'CLOSED';
            breaker.failures = 0;
            console.log(`🟢 Circuit breaker closed for: ${type}`);
            
            // Disable fallback mode
            this.disableFallbackMode(type);
        }
    }
    
    setupFallbackModes() {
        this.fallbackModes.set('memory', {
            enabled: false,
            actions: () => {
                console.log('🧠 Memory fallback mode activated');
                // Disable heavy effects
                this.disableHeavyEffects();
                // Force garbage collection
                if (window.gc) window.gc();
            }
        });
        
        this.fallbackModes.set('performance', {
            enabled: false,
            actions: () => {
                console.log('⚡ Performance fallback mode activated');
                // Reduce animation quality
                this.reduceAnimationQuality();
                // Pause non-essential animations
                this.pauseNonEssentialAnimations();
            }
        });
        
        this.fallbackModes.set('dom', {
            enabled: false,
            actions: () => {
                console.log('🌳 DOM fallback mode activated');
                // Aggressive DOM cleanup
                this.aggressiveDOMCleanup();
            }
        });
        
        this.fallbackModes.set('error', {
            enabled: false,
            actions: () => {
                console.log('🚨 Error fallback mode activated');
                // Disable problematic features
                this.disableProblematicFeatures();
            }
        });
    }
    
    enableFallbackMode(type) {
        const fallback = this.fallbackModes.get(type);
        if (fallback && !fallback.enabled) {
            fallback.enabled = true;
            fallback.actions();
        }
    }
    
    disableFallbackMode(type) {
        const fallback = this.fallbackModes.get(type);
        if (fallback && fallback.enabled) {
            fallback.enabled = false;
            console.log(`✅ Fallback mode disabled for: ${type}`);
        }
    }
    
    setupRecoveryMechanisms() {
        // Auto-recovery for circuit breakers
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.checkCircuitBreakerRecovery();
        }, 10000);
        
        // Periodic system health check
        animationRuntime.scheduleInterval(this.runtimeOwner, () => {
            this.performSystemHealthCheck();
        }, 30000);
    }
    
    checkCircuitBreakerRecovery() {
        const now = Date.now();
        
        for (const [type, breaker] of this.circuitBreakers.entries()) {
            if (breaker.state === 'OPEN' && (now - breaker.lastFailure) > breaker.timeout) {
                breaker.state = 'HALF_OPEN';
                console.log(`🟡 Circuit breaker half-open for: ${type}`);
                
                // Test if system is stable
                animationRuntime.scheduleTimeout(this.runtimeOwner, () => {
                    if (this.isSystemStable(type)) {
                        this.closeCircuitBreaker(type);
                    } else {
                        this.openCircuitBreaker(type);
                    }
                }, 5000);
            }
        }
    }
    
    isSystemStable(type) {
        switch (type) {
            case 'memory':
                return this.checkMemoryStability().stable;
            case 'performance':
                return this.checkFPSStability().stable;
            case 'dom':
                return this.checkDOMStability().stable;
            case 'error':
                return this.checkErrorStability().stable;
            default:
                return true;
        }
    }
    
    performSystemHealthCheck() {
        const health = {
            memory: this.checkMemoryStability(),
            performance: this.checkFPSStability(),
            dom: this.checkDOMStability(),
            errors: this.checkErrorStability()
        };
        
        const overallHealth = Object.values(health).every(check => check.stable);
        
        if (!overallHealth) {
            console.warn('⚠️ System health check failed:', health);
        }
        
        return health;
    }
    
    handleError(type, error, context = {}) {
        const errorInfo = {
            type,
            message: error?.message || 'Unknown error',
            stack: error?.stack || '',
            context,
            timestamp: Date.now()
        };
        
        this.errorHistory.push(errorInfo);
        this.errorCount++;
        
        console.error(`🚨 ${type}:`, errorInfo);
        
        // Check if we should trigger recovery
        if (this.shouldTriggerRecovery(type, error)) {
            this.triggerRecovery(type, error, context);
        }
        
        // Check if we should open circuit breaker
        const breaker = this.circuitBreakers.get(type);
        if (breaker) {
            breaker.failures++;
            if (breaker.failures >= breaker.threshold) {
                this.openCircuitBreaker(type);
            }
        }
    }
    
    shouldTriggerRecovery(type, error) {
        const recentErrors = this.getRecentErrorCount();
        return recentErrors > 3 || this.isCriticalError(type, error);
    }
    
    isCriticalError(type, error) {
        const criticalTypes = ['WebGL', 'Memory', 'Canvas'];
        const criticalMessages = ['out of memory', 'context lost', 'webgl'];
        
        return criticalTypes.some(ct => type.includes(ct)) ||
               criticalMessages.some(cm => error?.message?.toLowerCase().includes(cm));
    }
    
    triggerRecovery(type, error, context) {
        const recoveryKey = `${type}-${context.filename || 'unknown'}`;
        const attempts = this.recoveryAttempts.get(recoveryKey) || 0;
        
        if (attempts >= this.maxRecoveryAttempts) {
            console.error(`❌ Max recovery attempts reached for: ${recoveryKey}`);
            return;
        }
        
        this.recoveryAttempts.set(recoveryKey, attempts + 1);
        
        console.log(`🔄 Attempting recovery for: ${type} (attempt ${attempts + 1})`);
        
        try {
            this.performRecovery(type, error, context);
        } catch (recoveryError) {
            console.error('❌ Recovery failed:', recoveryError);
        }
    }
    
    performRecovery(type, error, context) {
        switch (type) {
            case 'JavaScript Error':
                this.recoverFromJSError(error, context);
                break;
            case 'Unhandled Promise Rejection':
                this.recoverFromPromiseRejection(error, context);
                break;
            case 'Resource Loading Error':
                this.recoverFromResourceError(error, context);
                break;
            case 'GSAP Tween Error':
                this.recoverFromGSAPError(error, context);
                break;
            case 'Anime.js Error':
                this.recoverFromAnimeError(error, context);
                break;
            case 'Three.js WebGL Error':
                this.recoverFromWebGLError(error, context);
                break;
            default:
                this.recoverFromGenericError(type, error, context);
        }
    }
    
    recoverFromJSError(error, context) {
        // Try to reinitialize affected components
        if (context.filename && context.filename.includes('animation')) {
            this.reinitializeAnimationSystem();
        }
    }
    
    recoverFromPromiseRejection(error, context) {
        // Handle promise rejections gracefully
        console.log('🔄 Recovering from promise rejection');
    }
    
    recoverFromResourceError(error, context) {
        // Retry loading failed resources
        if (context.src) {
            this.retryResourceLoading(context.src);
        }
    }
    
    recoverFromGSAPError(error, context) {
        // A foreign tween error does not establish ownership of every running
        // timeline. Preserve admitted visuals and let the failing owner report
        // or dispose its own scope.
        window.performanceProfileManager?.applyProfile?.('medium', {
            reason: 'stability-gsap-error',
            message: String(error?.message || error || 'unknown')
        });
        window.dispatchEvent(new CustomEvent('3886:runtime-warning', {
            detail: { subsystem: 'gsap', context }
        }));
    }
    
    recoverFromAnimeError(error, context) {
        window.performanceProfileManager?.applyProfile?.('medium', {
            reason: 'stability-anime-error',
            message: String(error?.message || error || 'unknown')
        });
        window.dispatchEvent(new CustomEvent('3886:runtime-warning', {
            detail: { subsystem: 'anime', context }
        }));
    }
    
    recoverFromWebGLError(error, context) {
        // Fallback to Canvas renderer
        console.log('🔄 Falling back to Canvas renderer');
    }
    
    recoverFromGenericError(type, error, context) {
        // Generic recovery - restart affected systems
        console.log(`🔄 Generic recovery for: ${type}`);
    }
    
    reinitializeAnimationSystem() {
        if (window.animationManager) {
            try {
                window.animationManager.destroy();
                window.animationManager = new window.AnimationManager();
                console.log('✅ Animation system reinitialized');
            } catch (error) {
                console.error('❌ Failed to reinitialize animation system:', error);
            }
        }
    }
    
    retryResourceLoading(src) {
        // Implement resource retry logic
        console.log(`🔄 Retrying resource: ${src}`);
    }
    
    triggerStabilityAction(type, data) {
        console.log(`🎯 Triggering stability action for ${type}:`, data);
        
        switch (type) {
            case 'memory':
                this.handleMemoryPressure(data);
                break;
            case 'performance':
                this.handlePerformanceDegradation(data);
                break;
            case 'dom':
                this.handleDOMBloat(data);
                break;
            case 'error':
                this.handleErrorSpike(data);
                break;
        }
    }
    
    handleMemoryPressure(data) {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'stability-memory-pressure',
            usagePercent: data?.usagePercent
        });
    }
    
    handlePerformanceDegradation(data) {
        // Trigger performance optimizations
        if (window.performanceOptimizerV2) {
            window.performanceOptimizerV2.triggerLowFPSOptimizations();
        }

        const fps = Number(data?.fps ?? 60);
        if (fps < this.stabilityChecks.fps.minimumAcceptable) {
            this.reduceAnimationQuality();
        } else if (window.performanceProfileManager?.applyProfile) {
            window.performanceProfileManager.applyProfile('medium', {
                reason: 'stability-fps-action',
                fps
            });
        }
    }
    
    handleDOMBloat(data) {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'stability-dom-pressure',
            domNodes: data?.domCount
        });
        window.performanceElementManager?.removeOrphanedElements?.();
    }
    
    handleErrorSpike(data) {
        // Open error circuit breaker
        this.openCircuitBreaker('error');
        
        // Disable problematic features
        this.disableProblematicFeatures();
    }
    
    disableHeavyEffects() {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'stability-fallback-quality'
        });
    }
    
    reduceAnimationQuality() {
        try {
            if (window.performanceProfileManager?.applyProfile) {
                window.performanceProfileManager.applyProfile('low', {
                    reason: 'stability-fps-floor'
                });
            }
        } catch (_) {}

        const effects = document.querySelectorAll('.effect');
        effects.forEach(el => {
            el.classList.add('simplified');
        });
    }
    
    pauseNonEssentialAnimations() {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'stability-performance-fallback'
        });
    }
    
    aggressiveDOMCleanup() {
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'stability-dom-fallback'
        });
        window.performanceElementManager?.removeOrphanedElements?.();
    }
    
    disableProblematicFeatures() {
        // Disable features that are causing errors
        const problematicFeatures = document.querySelectorAll('[data-problematic]');
        problematicFeatures.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    getRecentErrorCount() {
        const now = Date.now();
        return this.errorHistory.filter(error => 
            (now - error.timestamp) < this.errorWindow
        ).length;
    }
    
    cleanupErrorHistory() {
        const now = Date.now();
        this.errorHistory = this.errorHistory.filter(error => 
            (now - error.timestamp) < this.errorWindow
        );
    }
    
    triggerEmergencyRecovery(issues) {
        if (!Array.isArray(issues) || issues.length === 0) return;

        const now = Date.now();
        if (now - this.lastEmergencyRecoveryAt < this.emergencyRecoveryCooldownMs) {
            console.warn('🚨 Emergency recovery suppressed by cooldown', issues);
            return;
        }
        this.lastEmergencyRecoveryAt = now;

        console.log('🚨 Emergency recovery triggered');
        
        // Automatic recovery changes render cost and clears bookkeeping only.
        // It never borrows the operator's emergency-stop semantics.
        window.performanceProfileManager?.applyProfile?.('low', {
            reason: 'stability-structural-recovery',
            issues: issues.map(issue => issue.type)
        });
        window.performanceElementManager?.removeOrphanedElements?.();
        window.gsapAnimationRegistry?.performPeriodicCleanup?.();
        window.animeManager?.cleanupCompleted?.();
        window.performanceOptimizerV2?.elementCache?.clear?.();
        window.dispatchEvent(new CustomEvent('3886:health-alert', {
            detail: {
                level: 'critical',
                source: 'stability-manager',
                issues: issues.map(issue => issue.type)
            }
        }));
        
        // Reset all circuit breakers
        for (const [type, breaker] of this.circuitBreakers.entries()) {
            breaker.state = 'CLOSED';
            breaker.failures = 0;
        }
        
        // Clear recovery attempts
        this.recoveryAttempts.clear();
        
        console.log('✅ Emergency recovery completed');
    }
    
    getStabilityReport() {
        return {
            errorCount: this.errorCount,
            recentErrors: this.getRecentErrorCount(),
            circuitBreakers: Object.fromEntries(this.circuitBreakers),
            fallbackModes: Object.fromEntries(
                Array.from(this.fallbackModes.entries()).map(([k, v]) => [k, v.enabled])
            ),
            recoveryAttempts: Object.fromEntries(this.recoveryAttempts),
            lowFpsSampleCount: this.lowFpsSampleCount,
            lastPerformanceActionAt: this.lastPerformanceActionAt,
            lastEmergencyRecoveryAt: this.lastEmergencyRecoveryAt
        };
    }
    
    destroy() {
        animationRuntime.disposeOwner(this.runtimeOwner);
        
        // Clear data
        this.errorHistory = [];
        this.recoveryAttempts.clear();
        this.circuitBreakers.clear();
        this.fallbackModes.clear();
        
        console.log('🧹 Stability Manager destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.stabilityManager = new StabilityManager();
}

export default StabilityManager;
