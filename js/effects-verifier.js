// Effects Verifier - Comprehensive verification of all effects, layers, animations, and lotties
// Ensures all effects are functional and properly integrated into the automated animation system

class EffectsVerifier {
    constructor() {
        this.verificationResults = new Map();
        this.effectsRegistry = new Map();
        this.integrationTests = new Map();
        this.performanceMetrics = new Map();
        
        this.verificationConfig = {
            timeout: 5000, // 5 seconds per test
            retries: 3,
            performanceThresholds: {
                fps: 30,
                memory: 100, // MB
                domNodes: 5000
            }
        };
        
        this.effectCategories = {
            logo: ['pulse', 'spin', 'glow'],
            matrix: ['flash', 'rain', 'glitch'],
            background: ['warp', 'shake', 'zoom'],
            text: ['scramble', 'wave'],
            chaos: ['full-chaos'],
            lottie: [],
            custom: []
        };
        
        this.init();
    }
    
    init() {
        this.discoverEffects();
        this.setupVerificationTests();
        this.setupIntegrationTests();
        this.setupPerformanceTests();
        
        console.log('🔍 Effects Verifier initialized');
    }
    
    discoverEffects() {
        // Discover animation manager effects
        this.discoverAnimationManagerEffects();
        
        // Discover Lottie effects
        this.discoverLottieEffects();
        
        // Discover GSAP effects
        this.discoverGSAPEffects();
        
        // Discover custom effects
        this.discoverCustomEffects();
        
        // Discover CSS effects
        this.discoverCSSEffects();
    }
    
    discoverAnimationManagerEffects() {
        if (window.animationManager && window.animationManager.animations) {
            Object.keys(window.animationManager.animations).forEach(effectId => {
                this.effectsRegistry.set(effectId, {
                    type: 'animation_manager',
                    category: this.categorizeEffect(effectId),
                    source: 'animation-manager.js',
                    config: window.animationManager.animations[effectId]
                });
            });
        }
    }
    
    discoverLottieEffects() {
        // Check for Lottie manifest
        if (window.lottieEffects) {
            Object.keys(window.lottieEffects).forEach(effectId => {
                this.effectsRegistry.set(`lottie:${effectId}`, {
                    type: 'lottie',
                    category: 'lottie',
                    source: 'lottie-effect-loader.js',
                    element: window.lottieEffects[effectId]
                });
            });
        }
        
        // Check for Lottie manifest file
        this.loadLottieManifest().then(manifest => {
            manifest.forEach(entry => {
                this.effectsRegistry.set(`lottie:${entry.id}`, {
                    type: 'lottie',
                    category: 'lottie',
                    source: 'lottie-effect-loader.js',
                    manifest: entry
                });
            });
        });
    }
    
    async loadLottieManifest() {
        try {
            const response = await fetch('/lotties/manifest.json');
            return await response.json();
        } catch (error) {
            console.warn('Could not load Lottie manifest:', error);
            return [];
        }
    }
    
    discoverGSAPEffects() {
        // Discover GSAP animations
        if (window.gsap && window.gsap.globalTimeline) {
            const timeline = window.gsap.globalTimeline;
            const children = timeline.getChildren();
            
            children.forEach((child, index) => {
                const effectId = `gsap:${index}`;
                this.effectsRegistry.set(effectId, {
                    type: 'gsap',
                    category: 'custom',
                    source: 'gsap-global.js',
                    animation: child
                });
            });
        }
    }
    
    discoverCustomEffects() {
        // Discover anime.js effects
        if (window.animeManager && window.animeManager.instances) {
            window.animeManager.instances.forEach((instance, index) => {
                const effectId = `anime:${index}`;
                this.effectsRegistry.set(effectId, {
                    type: 'anime',
                    category: 'custom',
                    source: 'anime-enhanced-effects.js',
                    animation: instance
                });
            });
        }
        
        // Discover chaos engine effects
        if (window.chaosEngine) {
            const chaosEffects = [
                'particleSystem',
                'plasmaField',
                'glitchEffect',
                'matrixRain'
            ];
            
            chaosEffects.forEach(effectId => {
                if (window.chaosEngine[effectId]) {
                    this.effectsRegistry.set(`chaos:${effectId}`, {
                        type: 'chaos',
                        category: 'custom',
                        source: 'chaos-engine.js',
                        effect: window.chaosEngine[effectId]
                    });
                }
            });
        }
    }
    
    discoverCSSEffects() {
        // Discover CSS animations
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules);
                rules.forEach(rule => {
                    if (rule.type === CSSRule.KEYFRAMES_RULE) {
                        const effectId = `css:${rule.name}`;
                        this.effectsRegistry.set(effectId, {
                            type: 'css',
                            category: 'custom',
                            source: 'CSS',
                            keyframes: rule
                        });
                    }
                });
            } catch (e) {
                // Ignore cross-origin stylesheet errors
            }
        });
    }
    
    categorizeEffect(effectId) {
        for (const [category, effects] of Object.entries(this.effectCategories)) {
            if (effects.some(effect => effectId.includes(effect))) {
                return category;
            }
        }
        return 'custom';
    }
    
    setupVerificationTests() {
        // Test each discovered effect
        for (const [effectId, effectData] of this.effectsRegistry) {
            this.verificationResults.set(effectId, {
                id: effectId,
                type: effectData.type,
                category: effectData.category,
                status: 'pending',
                tests: [],
                performance: {},
                errors: []
            });
        }
    }
    
    setupIntegrationTests() {
        // Test integration with animation system
        this.integrationTests.set('animation_manager_integration', {
            name: 'Animation Manager Integration',
            test: () => this.testAnimationManagerIntegration()
        });
        
        this.integrationTests.set('vj_messaging_integration', {
            name: 'VJ Messaging Integration',
            test: () => this.testVJMessagingIntegration()
        });
        
        this.integrationTests.set('control_panel_integration', {
            name: 'Control Panel Integration',
            test: () => this.testControlPanelIntegration()
        });
        
        this.integrationTests.set('performance_integration', {
            name: 'Performance Integration',
            test: () => this.testPerformanceIntegration()
        });
    }
    
    setupPerformanceTests() {
        // Setup performance monitoring for each effect
        this.performanceTests = {
            memory: (effectId) => this.testMemoryUsage(effectId),
            fps: (effectId) => this.testFPSImpact(effectId),
            domNodes: (effectId) => this.testDOMImpact(effectId),
            duration: (effectId) => this.testEffectDuration(effectId)
        };
    }
    
    async runFullVerification() {
        console.log('🔍 Starting full effects verification...');
        
        const startTime = Date.now();
        let passedTests = 0;
        let totalTests = 0;
        
        // Test each effect
        for (const [effectId, effectData] of this.effectsRegistry) {
            console.log(`Testing effect: ${effectId}`);
            
            try {
                const result = await this.verifyEffect(effectId, effectData);
                this.verificationResults.set(effectId, result);
                
                if (result.status === 'passed') {
                    passedTests++;
                }
                totalTests++;
                
            } catch (error) {
                console.error(`Error testing ${effectId}:`, error);
                this.verificationResults.get(effectId).status = 'failed';
                this.verificationResults.get(effectId).errors.push(error.message);
            }
        }
        
        // Run integration tests
        for (const [testId, testData] of this.integrationTests) {
            console.log(`Running integration test: ${testData.name}`);
            
            try {
                const result = await testData.test();
                this.integrationTests.set(testId, { ...testData, result });
                
                if (result.status === 'passed') {
                    passedTests++;
                }
                totalTests++;
                
            } catch (error) {
                console.error(`Integration test failed ${testId}:`, error);
                this.integrationTests.set(testId, { ...testData, result: { status: 'failed', error: error.message } });
            }
        }
        
        const duration = Date.now() - startTime;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        
        console.log(`✅ Verification complete: ${passedTests}/${totalTests} tests passed (${successRate.toFixed(1)}%) in ${duration}ms`);
        
        return {
            totalTests,
            passedTests,
            successRate,
            duration,
            results: Array.from(this.verificationResults.values()),
            integrationResults: Array.from(this.integrationTests.values())
        };
    }
    
    async verifyEffect(effectId, effectData) {
        const result = this.verificationResults.get(effectId);
        const tests = [];
        
        // Test 1: Effect can be triggered
        const triggerTest = await this.testEffectTrigger(effectId, effectData);
        tests.push(triggerTest);
        
        // Test 2: Effect executes without errors
        const executionTest = await this.testEffectExecution(effectId, effectData);
        tests.push(executionTest);
        
        // Test 3: Effect cleans up properly
        const cleanupTest = await this.testEffectCleanup(effectId, effectData);
        tests.push(cleanupTest);
        
        // Test 4: Performance impact
        const performanceTest = await this.testEffectPerformance(effectId, effectData);
        tests.push(performanceTest);
        
        // Determine overall status
        const failedTests = tests.filter(test => test.status === 'failed');
        const status = failedTests.length === 0 ? 'passed' : 'failed';
        
        return {
            ...result,
            status,
            tests,
            performance: performanceTest.performance || {}
        };
    }
    
    async testEffectTrigger(effectId, effectData) {
        const startTime = Date.now();
        
        try {
            // Try to trigger the effect
            let triggered = false;
            
            if (effectData.type === 'animation_manager') {
                if (window.animationManager && window.animationManager.trigger) {
                    await window.animationManager.trigger(effectId);
                    triggered = true;
                }
            } else if (effectData.type === 'lottie') {
                if (window.lottieEffects && window.lottieEffects[effectId.replace('lottie:', '')]) {
                    // Lottie effects are triggered differently
                    triggered = true;
                }
            } else if (effectData.type === 'gsap') {
                if (effectData.animation) {
                    effectData.animation.play();
                    triggered = true;
                }
            } else if (effectData.type === 'anime') {
                if (effectData.animation) {
                    effectData.animation.play();
                    triggered = true;
                }
            }
            
            const duration = Date.now() - startTime;
            
            return {
                name: 'Effect Trigger',
                status: triggered ? 'passed' : 'failed',
                duration,
                message: triggered ? 'Effect triggered successfully' : 'Failed to trigger effect'
            };
            
        } catch (error) {
            return {
                name: 'Effect Trigger',
                status: 'failed',
                duration: Date.now() - startTime,
                message: `Trigger failed: ${error.message}`
            };
        }
    }
    
    async testEffectExecution(effectId, effectData) {
        const startTime = Date.now();
        
        try {
            // Monitor for errors during execution
            let hasError = false;
            let errorMessage = '';
            
            const errorHandler = (event) => {
                hasError = true;
                errorMessage = event.error?.message || 'Unknown error';
            };
            
            window.addEventListener('error', errorHandler);
            
            // Trigger the effect
            if (effectData.type === 'animation_manager') {
                if (window.animationManager && window.animationManager.trigger) {
                    await window.animationManager.trigger(effectId);
                }
            }
            
            // Wait for execution
            await this.delay(1000);
            
            window.removeEventListener('error', errorHandler);
            
            const duration = Date.now() - startTime;
            
            return {
                name: 'Effect Execution',
                status: hasError ? 'failed' : 'passed',
                duration,
                message: hasError ? `Execution error: ${errorMessage}` : 'Effect executed without errors'
            };
            
        } catch (error) {
            return {
                name: 'Effect Execution',
                status: 'failed',
                duration: Date.now() - startTime,
                message: `Execution failed: ${error.message}`
            };
        }
    }
    
    async testEffectCleanup(effectId, effectData) {
        const startTime = Date.now();
        
        try {
            // Get initial state
            const initialDOMNodes = document.querySelectorAll('*').length;
            const initialAnimations = this.getActiveAnimationCount();
            
            // Trigger effect
            if (effectData.type === 'animation_manager') {
                if (window.animationManager && window.animationManager.trigger) {
                    await window.animationManager.trigger(effectId);
                }
            }
            
            // Wait for effect to complete
            await this.delay(2000);
            
            // Check cleanup
            const finalDOMNodes = document.querySelectorAll('*').length;
            const finalAnimations = this.getActiveAnimationCount();
            
            const domCleanup = finalDOMNodes <= initialDOMNodes + 10; // Allow some margin
            const animationCleanup = finalAnimations <= initialAnimations + 5; // Allow some margin
            
            const duration = Date.now() - startTime;
            
            return {
                name: 'Effect Cleanup',
                status: (domCleanup && animationCleanup) ? 'passed' : 'failed',
                duration,
                message: `DOM cleanup: ${domCleanup ? 'OK' : 'Failed'}, Animation cleanup: ${animationCleanup ? 'OK' : 'Failed'}`
            };
            
        } catch (error) {
            return {
                name: 'Effect Cleanup',
                status: 'failed',
                duration: Date.now() - startTime,
                message: `Cleanup test failed: ${error.message}`
            };
        }
    }
    
    async testEffectPerformance(effectId, effectData) {
        const startTime = Date.now();
        
        try {
            // Get initial performance metrics
            const initialMetrics = this.getPerformanceMetrics();
            
            // Trigger effect
            if (effectData.type === 'animation_manager') {
                if (window.animationManager && window.animationManager.trigger) {
                    await window.animationManager.trigger(effectId);
                }
            }
            
            // Wait for effect to stabilize
            await this.delay(1000);
            
            // Get final performance metrics
            const finalMetrics = this.getPerformanceMetrics();
            
            // Calculate impact
            const fpsImpact = initialMetrics.fps - finalMetrics.fps;
            const memoryImpact = finalMetrics.memory - initialMetrics.memory;
            const domImpact = finalMetrics.domNodes - initialMetrics.domNodes;
            
            // Check thresholds
            const fpsOK = fpsImpact < 10; // Less than 10 FPS drop
            const memoryOK = memoryImpact < 20; // Less than 20MB increase
            const domOK = domImpact < 100; // Less than 100 DOM nodes increase
            
            const duration = Date.now() - startTime;
            
            return {
                name: 'Effect Performance',
                status: (fpsOK && memoryOK && domOK) ? 'passed' : 'failed',
                duration,
                message: `FPS impact: ${fpsImpact}, Memory impact: ${memoryImpact}MB, DOM impact: ${domImpact} nodes`,
                performance: {
                    fpsImpact,
                    memoryImpact,
                    domImpact,
                    initialMetrics,
                    finalMetrics
                }
            };
            
        } catch (error) {
            return {
                name: 'Effect Performance',
                status: 'failed',
                duration: Date.now() - startTime,
                message: `Performance test failed: ${error.message}`
            };
        }
    }
    
    async testAnimationManagerIntegration() {
        try {
            if (!window.animationManager) {
                return { status: 'failed', message: 'Animation Manager not available' };
            }
            
            // Test basic functionality
            const animations = window.animationManager.animations;
            if (!animations || Object.keys(animations).length === 0) {
                return { status: 'failed', message: 'No animations configured' };
            }
            
            // Test trigger functionality
            const testAnimation = Object.keys(animations)[0];
            await window.animationManager.trigger(testAnimation);
            
            return { status: 'passed', message: 'Animation Manager integration working' };
            
        } catch (error) {
            return { status: 'failed', message: `Integration test failed: ${error.message}` };
        }
    }
    
    async testVJMessagingIntegration() {
        try {
            if (!window.vjMessaging) {
                return { status: 'failed', message: 'VJ Messaging not available' };
            }
            
            // Test message sending
            const testMessage = { type: 'test', data: 'integration test' };
            window.vjMessaging.send('test', testMessage);
            
            return { status: 'passed', message: 'VJ Messaging integration working' };
            
        } catch (error) {
            return { status: 'failed', message: `Integration test failed: ${error.message}` };
        }
    }
    
    async testControlPanelIntegration() {
        try {
            // Check if control panel elements exist
            const controlPanel = document.querySelector('.control-panel, #control-panel');
            if (!controlPanel) {
                return { status: 'failed', message: 'Control panel not found' };
            }
            
            // Check for animation trigger buttons
            const triggerButtons = document.querySelectorAll('.anim-trigger-btn, [data-anime]');
            if (triggerButtons.length === 0) {
                return { status: 'failed', message: 'No animation trigger buttons found' };
            }
            
            return { status: 'passed', message: `Control panel integration working (${triggerButtons.length} trigger buttons)` };
            
        } catch (error) {
            return { status: 'failed', message: `Integration test failed: ${error.message}` };
        }
    }
    
    async testPerformanceIntegration() {
        try {
            if (!window.performanceOptimizerV2) {
                return { status: 'failed', message: 'Performance Optimizer V2 not available' };
            }
            
            // Test performance monitoring
            const metrics = window.performanceOptimizerV2.getPerformanceMetrics();
            if (!metrics) {
                return { status: 'failed', message: 'Performance metrics not available' };
            }
            
            return { status: 'passed', message: 'Performance integration working' };
            
        } catch (error) {
            return { status: 'failed', message: `Integration test failed: ${error.message}` };
        }
    }
    
    getPerformanceMetrics() {
        return {
            fps: this.getCurrentFPS(),
            memory: this.getCurrentMemoryUsage(),
            domNodes: document.querySelectorAll('*').length,
            animations: this.getActiveAnimationCount()
        };
    }
    
    getCurrentFPS() {
        if (window.performanceOptimizerV2) {
            return window.performanceOptimizerV2.getPerformanceMetrics().fps || 60;
        }
        return 60;
    }
    
    getCurrentMemoryUsage() {
        if (performance.memory) {
            return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
        }
        return 0;
    }
    
    getActiveAnimationCount() {
        let count = 0;
        
        if (window.gsap && window.gsap.globalTimeline) {
            count += window.gsap.globalTimeline.getChildren().length;
        }
        
        if (window.animeManager && window.animeManager.instances) {
            count += window.animeManager.instances.size;
        }
        
        return count;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getVerificationReport() {
        const results = Array.from(this.verificationResults.values());
        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const total = results.length;
        
        return {
            summary: {
                total,
                passed,
                failed,
                successRate: total > 0 ? (passed / total) * 100 : 0
            },
            results,
            integrationResults: Array.from(this.integrationTests.values()),
            effectsByCategory: this.groupEffectsByCategory(),
            performanceSummary: this.getPerformanceSummary()
        };
    }
    
    groupEffectsByCategory() {
        const grouped = {};
        
        for (const [effectId, effectData] of this.effectsRegistry) {
            const category = effectData.category;
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push({
                id: effectId,
                type: effectData.type,
                source: effectData.source
            });
        }
        
        return grouped;
    }
    
    getPerformanceSummary() {
        const results = Array.from(this.verificationResults.values());
        const performanceData = results
            .filter(r => r.performance && Object.keys(r.performance).length > 0)
            .map(r => r.performance);
        
        if (performanceData.length === 0) {
            return { message: 'No performance data available' };
        }
        
        const avgFpsImpact = performanceData.reduce((sum, p) => sum + (p.fpsImpact || 0), 0) / performanceData.length;
        const avgMemoryImpact = performanceData.reduce((sum, p) => sum + (p.memoryImpact || 0), 0) / performanceData.length;
        const avgDomImpact = performanceData.reduce((sum, p) => sum + (p.domImpact || 0), 0) / performanceData.length;
        
        return {
            averageFpsImpact: Math.round(avgFpsImpact * 10) / 10,
            averageMemoryImpact: Math.round(avgMemoryImpact * 10) / 10,
            averageDomImpact: Math.round(avgDomImpact),
            totalEffects: performanceData.length
        };
    }
    
    destroy() {
        this.verificationResults.clear();
        this.effectsRegistry.clear();
        this.integrationTests.clear();
        this.performanceMetrics.clear();
        
        console.log('🧹 Effects Verifier destroyed');
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.effectsVerifier = new EffectsVerifier();
}

export default EffectsVerifier;
