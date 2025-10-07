/**
 * Performance Degradation Ladder Test Suite
 * Simple test scenarios to verify state transitions work correctly.
 */

import featureFlags from './feature-flags.js';

class PerformanceLadderTest {
    constructor() {
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        console.log('🧪 Performance Ladder Test Suite initialized');
    }
    
    /**
     * Get current performance state from the ladder
     */
    getCurrentState() {
        if (window.PERFORMANCE_LADDER) {
            return window.PERFORMANCE_LADDER.currentState;
        }
        return 'UNKNOWN';
    }
    
    /**
     * Simulate specific FPS for a duration
     */
    async simulateFPSForDuration(targetFPS, durationMs) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const updateInterval = 100; // Update every 100ms
            
            const updateFPS = () => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed >= durationMs) {
                    resolve();
                    return;
                }
                
                // Send FPS to performance ladder
                if (window.PERFORMANCE_LADDER) {
                    // Add some realistic variation (±2 FPS)
                    const variation = (Math.random() - 0.5) * 4;
                    const simulatedFPS = Math.max(1, targetFPS + variation);
                    window.PERFORMANCE_LADDER.updateFPS(simulatedFPS);
                }
                
                setTimeout(updateFPS, updateInterval);
            };
            
            updateFPS();
        });
    }
    
    /**
     * Wait for specified duration
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Quick manual test for development
     */
    async quickTest() {
        console.log('🧪 Running quick performance ladder test...');
        
        if (!window.PERFORMANCE_LADDER) {
            console.error('🧪 Performance ladder not found. Make sure it is loaded and running.');
            return;
        }
        
        const initialState = this.getCurrentState();
        console.log(`🧪 Initial state: ${initialState}`);
        
        // Test 1: Force low FPS to trigger degradation
        console.log('🧪 Test 1: Forcing 15 FPS for 5 seconds...');
        await this.simulateFPSForDuration(15, 5000);
        await this.wait(1000); // Allow state transition time
        const lowFPSState = this.getCurrentState();
        console.log(`🧪 State after low FPS: ${lowFPSState}`);
        
        // Test 2: Force high FPS but not long enough for recovery
        console.log('🧪 Test 2: Forcing 100 FPS for 5 seconds (should NOT recover)...');
        await this.simulateFPSForDuration(100, 5000);
        await this.wait(1000);
        const shortHighFPSState = this.getCurrentState();
        console.log(`🧪 State after short high FPS: ${shortHighFPSState}`);
        
        // Test 3: Force high FPS for long enough to trigger recovery
        console.log('🧪 Test 3: Forcing 100 FPS for 18 seconds (should trigger recovery)...');
        await this.simulateFPSForDuration(100, 18000);
        await this.wait(2000); // Extra time for recovery
        const recoveredState = this.getCurrentState();
        console.log(`🧪 State after sustained high FPS: ${recoveredState}`);
        
        // Summary
        console.log('🧪 === TEST SUMMARY ===');
        console.log(`🧪 Initial: ${initialState}`);
        console.log(`🧪 After degradation: ${lowFPSState}`);
        console.log(`🧪 After short recovery: ${shortHighFPSState}`);
        console.log(`🧪 After sustained recovery: ${recoveredState}`);
        
        // Basic validation
        const degradationWorked = lowFPSState !== initialState;
        const hysteresisWorked = shortHighFPSState === lowFPSState;
        const recoveryWorked = recoveredState !== lowFPSState;
        
        console.log('🧪 === RESULTS ===');
        console.log(`🧪 Degradation works: ${degradationWorked ? '✅' : '❌'}`);
        console.log(`🧪 Hysteresis works: ${hysteresisWorked ? '✅' : '❌'}`);
        console.log(`🧪 Recovery works: ${recoveryWorked ? '✅' : '❌'}`);
        
        if (degradationWorked && hysteresisWorked && recoveryWorked) {
            console.log('🧪 🎉 All basic tests PASSED!');
        } else {
            console.log('🧪 ⚠️ Some tests FAILED - check implementation');
        }
        
        console.log('🧪 Quick test completed');
        return { degradationWorked, hysteresisWorked, recoveryWorked };
    }
    
    /**
     * Test state transitions with manual FPS control
     */
    async testStateTransitions() {
        console.log('🧪 Testing state transitions...');
        
        if (!window.PERFORMANCE_LADDER) {
            console.error('🧪 Performance ladder not available');
            return;
        }
        
        const states = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
        console.log('🧪 Testing degradation through all states...');
        
        // Test degradation by progressively lowering FPS
        const testSequence = [
            { fps: 80, expectedState: 'S0', duration: 2000 },
            { fps: 65, expectedState: 'S1', duration: 4000 },
            { fps: 50, expectedState: 'S2', duration: 4000 },
            { fps: 35, expectedState: 'S3', duration: 4000 },
            { fps: 15, expectedState: 'S4', duration: 4000 },
            { fps: 8, expectedState: 'S5', duration: 4000 }
        ];
        
        for (const step of testSequence) {
            console.log(`🧪 Setting ${step.fps} FPS, expecting state ${step.expectedState}...`);
            await this.simulateFPSForDuration(step.fps, step.duration);
            await this.wait(1000);
            
            const currentState = this.getCurrentState();
            const correct = currentState === step.expectedState;
            console.log(`🧪 Current state: ${currentState} ${correct ? '✅' : '❌'}`);
        }
        
        console.log('🧪 State transition test completed');
    }
    
    /**
     * Monitor performance ladder stats
     */
    getPerformanceStats() {
        if (window.PERFORMANCE_LADDER && window.PERFORMANCE_LADDER.getPerformanceStats) {
            return window.PERFORMANCE_LADDER.getPerformanceStats();
        }
        return null;
    }
    
    /**
     * Force a specific state (for testing)
     */
    forceState(state) {
        if (window.PERFORMANCE_LADDER && window.PERFORMANCE_LADDER.forceState) {
            return window.PERFORMANCE_LADDER.forceState(state, 'test');
        }
        return false;
    }
}

// Create and expose test instance
const performanceLadderTest = new PerformanceLadderTest();

// Expose for manual testing in browser console
if (typeof window !== 'undefined') {
    window.PERFORMANCE_LADDER_TEST = performanceLadderTest;
    
    // Add convenience methods to window for easy console access
    window.testPerformanceLadder = () => performanceLadderTest.quickTest();
    window.testStateTransitions = () => performanceLadderTest.testStateTransitions();
    window.getPerformanceStats = () => performanceLadderTest.getPerformanceStats();
    window.forcePerformanceState = (state) => performanceLadderTest.forceState(state);
}

export default performanceLadderTest;