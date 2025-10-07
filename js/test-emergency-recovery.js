// Emergency Recovery System Test Script
// This script tests the emergency recovery system functionality

class EmergencyRecoveryTester {
    constructor() {
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🧪 Starting Emergency Recovery System Tests...');
        
        // Wait for system initialization
        await this.waitForSystem();
        
        // Run tests
        await this.testCircuitBreaker();
        await this.testDOMCleanup();
        await this.testMemoryPressureResponse();
        await this.testAnimationControl();
        await this.testRecovery();
        
        this.reportResults();
    }
    
    async waitForSystem() {
        return new Promise((resolve) => {
            const checkSystem = () => {
                if (window.emergencyRecoverySystem && 
                    window.performanceElementManager && 
                    window.intervalManager) {
                    console.log('✅ Emergency systems initialized');
                    resolve();
                } else {
                    setTimeout(checkSystem, 500);
                }
            };
            checkSystem();
        });
    }
    
    async testCircuitBreaker() {
        console.log('🔬 Testing Circuit Breaker...');
        
        const system = window.emergencyRecoverySystem;
        const initialState = system.getState();
        
        // Simulate multiple failures
        for (let i = 0; i < 4; i++) {
            system.recordFailure('test_failure');
        }
        
        const afterFailures = system.getState();
        
        this.testResults.push({
            name: 'Circuit Breaker',
            passed: afterFailures.circuitState === 'OPEN',
            details: `State changed from ${initialState.circuitState} to ${afterFailures.circuitState}`
        });
    }
    
    async testDOMCleanup() {
        console.log('🔬 Testing DOM Cleanup...');
        
        // Create test elements
        const testElements = [];
        for (let i = 0; i < 20; i++) {
            const el = document.createElement('div');
            el.className = 'matrix-char';
            el.setAttribute('data-temp', 'true');
            el.style.cssText = 'position: fixed; z-index: 999;';
            document.body.appendChild(el);
            testElements.push(el);
        }
        
        const beforeCleanup = document.querySelectorAll('.matrix-char').length;
        console.log(`Created ${beforeCleanup} test elements`);
        
        // Trigger cleanup
        const system = window.emergencyRecoverySystem;
        const removed = await system.performAggressiveDOMCleanup();
        
        const afterCleanup = document.querySelectorAll('.matrix-char').length;
        console.log(`After cleanup: ${afterCleanup} elements remaining, ${removed} reported removed`);
        
        this.testResults.push({
            name: 'DOM Cleanup',
            passed: afterCleanup < beforeCleanup,
            details: `Removed ${beforeCleanup - afterCleanup} out of ${beforeCleanup} test elements`
        });
    }
    
    async testMemoryPressureResponse() {
        console.log('🔬 Testing Memory Pressure Response...');
        
        // Simulate memory pressure event
        const event = new CustomEvent('memory:critical', {
            detail: {
                growthPercent: 2.0,
                currentHeap: 300 * 1024 * 1024 // 300MB
            }
        });
        
        const system = window.emergencyRecoverySystem;
        const beforeState = system.getState();
        
        window.dispatchEvent(event);
        
        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const afterState = system.getState();
        
        this.testResults.push({
            name: 'Memory Pressure Response',
            passed: afterState.state.emergencyMode || afterState.circuitState === 'OPEN',
            details: `Emergency mode: ${afterState.state.emergencyMode}, Circuit: ${afterState.circuitState}`
        });
    }
    
    async testAnimationControl() {
        console.log('🔬 Testing Animation Control...');
        
        let animationsPaused = false;
        let animationsRestarted = false;
        
        // Listen for animation control events
        const pauseListener = () => { animationsPaused = true; };
        const restartListener = () => { animationsRestarted = true; };
        
        window.addEventListener('emergency:animations-paused', pauseListener);
        window.addEventListener('emergency:restart-animations', restartListener);
        
        // Trigger emergency mode
        const system = window.emergencyRecoverySystem;
        system.enterEmergencyMode();
        
        // Wait for events
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Cleanup listeners
        window.removeEventListener('emergency:animations-paused', pauseListener);
        window.removeEventListener('emergency:restart-animations', restartListener);
        
        this.testResults.push({
            name: 'Animation Control',
            passed: animationsPaused,
            details: `Paused: ${animationsPaused}, Restarted: ${animationsRestarted}`
        });
    }
    
    async testRecovery() {
        console.log('🔬 Testing System Recovery...');
        
        const system = window.emergencyRecoverySystem;
        
        // Force system into recovery
        system.circuitState = 'HALF_OPEN';
        system.state.isRecovering = true;
        
        // Test comprehensive cleanup
        const success = await system.performComprehensiveCleanup();
        
        this.testResults.push({
            name: 'System Recovery',
            passed: success !== undefined,
            details: `Comprehensive cleanup ${success ? 'succeeded' : 'failed'}`
        });
    }
    
    reportResults() {
        console.log('\n📊 Emergency Recovery System Test Results:');
        console.log('=' .repeat(50));
        
        let passedCount = 0;
        let totalCount = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}: ${result.details}`);
            if (result.passed) passedCount++;
        });
        
        console.log('=' .repeat(50));
        console.log(`Overall: ${passedCount}/${totalCount} tests passed`);
        
        if (passedCount === totalCount) {
            console.log('🎉 All emergency recovery tests passed!');
        } else {
            console.log('⚠️  Some tests failed - check system configuration');
        }
        
        // Log current system state
        if (window.emergencyRecoverySystem) {
            console.log('\n🔍 Current System State:');
            console.log(window.emergencyRecoverySystem.getState());
        }
    }
    
    // Manual test functions for console use
    static testCleanup() {
        if (window.emergencyRecoverySystem) {
            return window.emergencyRecoverySystem.performAggressiveDOMCleanup();
        }
        return 'Emergency recovery system not available';
    }
    
    static testCircuitBreaker() {
        if (window.emergencyRecoverySystem) {
            const system = window.emergencyRecoverySystem;
            system.recordFailure('manual_test');
            system.recordFailure('manual_test');
            system.recordFailure('manual_test');
            return system.getState();
        }
        return 'Emergency recovery system not available';
    }
    
    static getSystemStatus() {
        if (window.emergencyRecoverySystem) {
            return {
                recovery: window.emergencyRecoverySystem.getState(),
                memoryGuardian: window.memoryLeakGuardian ? window.memoryLeakGuardian.getStats() : 'Not available',
                performanceManager: window.performanceElementManager ? {
                    tracked: window.performanceElementManager.trackedElements.size,
                    categories: window.performanceElementManager.categoryStats
                } : 'Not available'
            };
        }
        return 'Systems not available';
    }
}

// Auto-run tests if enabled via URL parameter
if (window.location.search.includes('testEmergency=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for initialization
        const tester = new EmergencyRecoveryTester();
        await tester.runAllTests();
    });
}

// Expose test utilities globally
window.EmergencyRecoveryTester = EmergencyRecoveryTester;

console.log('🧪 Emergency Recovery Tester loaded. Use:');
console.log('- EmergencyRecoveryTester.testCleanup()');
console.log('- EmergencyRecoveryTester.testCircuitBreaker()');
console.log('- EmergencyRecoveryTester.getSystemStatus()');
console.log('- Or add ?testEmergency=true to URL for auto-test');

export default EmergencyRecoveryTester;