/**
 * Trigger Effects Diagnostic Tool
 * Tests all trigger effects to ensure they work correctly and don't cause screen blackouts
 */

class TriggerEffectsDiagnostic {
    constructor() {
        this.testResults = new Map();
        this.testQueue = [];
        this.isRunning = false;
        this.originalBodyState = null;
        this.dangerousElements = ['body', 'html', '.main-wrapper', '#app', '.control-panel'];
        
        // All trigger effects to test
        this.effects = [
            // Missing effects that were just added
            'chroma-pulse', 'chroma', 'spotlight-sweep', 'spotlight', 'heat-shimmer', 'shimmer',
            
            // Animation system effects
            'logo-pulse', 'logo-spin', 'logo-glow', 'matrix-flash', 'matrix-rain', 'matrix-glitch',
            'bg-warp', 'bg-shake', 'bg-zoom', 'text-scramble', 'text-wave', 'full-chaos',
            
            // Other trigger effects from control panel
            'strobe', 'blackout', 'whiteout', 'rgbsplit', 'shake', 'ripple', 'pulse',
            'cosmic', 'vignette-pulse', 'scanlines-sweep', 'noise-burst', 'grid-flash', 
            'lens-flare', 'zoom-blur', 'invert-flicker'
        ];
    }

    // Store original state before tests
    captureOriginalState() {
        this.originalBodyState = {
            opacity: document.body.style.opacity || '1',
            transform: document.body.style.transform || 'none',
            filter: document.body.style.filter || 'none',
            visibility: document.body.style.visibility || 'visible',
            display: document.body.style.display || 'block'
        };
        
        console.log('📸 Captured original body state:', this.originalBodyState);
    }

    // Check if any dangerous state occurred
    checkForBlackout() {
        const body = document.body;
        const isBlackedOut = (
            body.style.opacity === '0' ||
            body.style.visibility === 'hidden' ||
            body.style.display === 'none' ||
            (body.style.filter && body.style.filter.includes('opacity(0)'))
        );

        const hasWrongTransform = body.style.transform && 
            body.style.transform !== 'none' && 
            body.style.transform !== this.originalBodyState.transform;

        return {
            blackout: isBlackedOut,
            transformChanged: hasWrongTransform,
            currentOpacity: body.style.opacity,
            currentTransform: body.style.transform,
            currentFilter: body.style.filter
        };
    }

    // Test individual trigger effect
    async testTriggerEffect(effectName) {
        console.log(`🧪 Testing trigger effect: ${effectName}`);
        
        const testStart = performance.now();
        let error = null;
        let blackoutDetected = false;
        let transformIssue = false;

        try {
            // Capture state before trigger
            const stateBefore = this.checkForBlackout();
            
            // Trigger the effect
            if (window.vjReceiver && typeof window.vjReceiver.handleAnimeTrigger === 'function') {
                await window.vjReceiver.handleAnimeTrigger(effectName);
            } else if (window.animationManager && typeof window.animationManager.trigger === 'function') {
                await window.animationManager.trigger(effectName);
            } else {
                throw new Error('No animation system available');
            }

            // Wait a bit for effect to complete
            await this.delay(500);

            // Check for blackout or issues
            const stateAfter = this.checkForBlackout();
            blackoutDetected = stateAfter.blackout;
            transformIssue = stateAfter.transformChanged;

            // Wait for cleanup
            await this.delay(1000);

            // Check final state
            const finalState = this.checkForBlackout();
            const recovered = !finalState.blackout && !finalState.transformChanged;

        } catch (err) {
            error = err;
            console.error(`❌ Error testing ${effectName}:`, err);
        }

        const testEnd = performance.now();
        const duration = testEnd - testStart;

        const result = {
            effect: effectName,
            success: !error,
            error: error ? error.message : null,
            blackoutDetected,
            transformIssue,
            duration,
            timestamp: Date.now()
        };

        this.testResults.set(effectName, result);
        
        // Log result
        const status = result.success && !result.blackoutDetected && !result.transformIssue ? '✅' : '❌';
        console.log(`${status} ${effectName}: ${result.success ? 'OK' : 'FAILED'} (${duration.toFixed(0)}ms)`);
        
        if (result.blackoutDetected) {
            console.warn(`🚨 BLACKOUT detected during ${effectName}`);
        }
        if (result.transformIssue) {
            console.warn(`⚠️ Transform issue detected during ${effectName}`);
        }

        return result;
    }

    // Run all tests
    async runAllTests() {
        if (this.isRunning) {
            console.warn('Tests already running');
            return;
        }

        this.isRunning = true;
        this.testResults.clear();
        
        console.log('🧪 Starting trigger effects diagnostic test');
        console.log(`📋 Testing ${this.effects.length} effects`);
        
        this.captureOriginalState();
        
        const startTime = performance.now();

        for (const effect of this.effects) {
            try {
                await this.testTriggerEffect(effect);
                
                // Restore original state between tests
                this.restoreOriginalState();
                
                // Small delay between tests
                await this.delay(200);
            } catch (err) {
                console.error(`Fatal error testing ${effect}:`, err);
            }
        }

        const endTime = performance.now();
        const totalDuration = endTime - startTime;

        this.isRunning = false;
        
        // Generate report
        this.generateReport(totalDuration);
    }

    // Restore body to original state
    restoreOriginalState() {
        if (this.originalBodyState) {
            const body = document.body;
            body.style.opacity = this.originalBodyState.opacity;
            body.style.transform = this.originalBodyState.transform;
            body.style.filter = this.originalBodyState.filter;
            body.style.visibility = this.originalBodyState.visibility;
            body.style.display = this.originalBodyState.display;
            
            // Also reset transition
            body.style.transition = '';
        }
    }

    // Generate test report
    generateReport(totalDuration) {
        const results = Array.from(this.testResults.values());
        const successful = results.filter(r => r.success && !r.blackoutDetected && !r.transformIssue);
        const failed = results.filter(r => !r.success);
        const blackouts = results.filter(r => r.blackoutDetected);
        const transformIssues = results.filter(r => r.transformIssue);

        console.log('\n📊 TRIGGER EFFECTS DIAGNOSTIC REPORT');
        console.log('=====================================');
        console.log(`Total Effects Tested: ${results.length}`);
        console.log(`✅ Successful: ${successful.length}`);
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`🚨 Blackouts Detected: ${blackouts.length}`);
        console.log(`⚠️ Transform Issues: ${transformIssues.length}`);
        console.log(`⏱️ Total Test Duration: ${(totalDuration / 1000).toFixed(2)}s`);

        if (failed.length > 0) {
            console.log('\n❌ FAILED EFFECTS:');
            failed.forEach(result => {
                console.log(`  - ${result.effect}: ${result.error}`);
            });
        }

        if (blackouts.length > 0) {
            console.log('\n🚨 BLACKOUT EFFECTS (DANGEROUS):');
            blackouts.forEach(result => {
                console.log(`  - ${result.effect}`);
            });
        }

        if (transformIssues.length > 0) {
            console.log('\n⚠️ TRANSFORM ISSUE EFFECTS:');
            transformIssues.forEach(result => {
                console.log(`  - ${result.effect}`);
            });
        }

        // List working effects
        if (successful.length > 0) {
            console.log('\n✅ WORKING EFFECTS:');
            successful.forEach(result => {
                console.log(`  - ${result.effect} (${result.duration.toFixed(0)}ms)`);
            });
        }

        // Store results globally for further analysis
        window.triggerTestResults = {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            blackouts: blackouts.length,
            transformIssues: transformIssues.length,
            duration: totalDuration,
            results: results
        };

        console.log('\n📝 Results stored in window.triggerTestResults');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Quick test specific effects
    async quickTest(effectNames) {
        if (typeof effectNames === 'string') {
            effectNames = [effectNames];
        }

        this.captureOriginalState();

        for (const effectName of effectNames) {
            await this.testTriggerEffect(effectName);
            this.restoreOriginalState();
            await this.delay(100);
        }
    }
}

// Create global instance
const triggerDiagnostic = new TriggerEffectsDiagnostic();

// Make it globally available
if (typeof window !== 'undefined') {
    window.triggerDiagnostic = triggerDiagnostic;
    
    // Add convenient global functions
    window.testAllTriggers = () => triggerDiagnostic.runAllTests();
    window.testTrigger = (effectName) => triggerDiagnostic.quickTest(effectName);
}

console.log('🧪 Trigger Effects Diagnostic loaded');
console.log('Usage: window.testAllTriggers() or window.testTrigger("logo-pulse")');

export default triggerDiagnostic;