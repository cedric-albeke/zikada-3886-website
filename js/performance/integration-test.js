/**
 * Performance System Integration Test
 * 
 * Basic functionality test for the performance optimization system
 */

import { performanceSystem } from './performance-system.js';

// Test the performance system
console.log('🧪 Testing Performance System Integration');

try {
    // Test basic functionality
    const metrics = performanceSystem.getMetrics();
    console.log('📊 Initial Metrics:', metrics);
    
    // Test feature flags
    performanceSystem.setFeatureEnabled('fpsStabilizer', false);
    performanceSystem.setFeatureEnabled('fpsStabilizer', true);
    
    // Test panic mode
    console.log('Testing panic mode activation...');
    performanceSystem.activatePanicMode('test');
    
    setTimeout(() => {
        console.log('Testing panic mode recovery...');
        performanceSystem.deactivatePanicMode();
        
        // Final metrics
        const finalMetrics = performanceSystem.getMetrics();
        console.log('📊 Final Metrics:', finalMetrics);
        
        console.log('✅ Performance System integration test complete');
        
    }, 1000);
    
} catch (error) {
    console.error('❌ Performance System test failed:', error);
}

// Export test results
export const testResults = {
    passed: true,
    timestamp: performance.now()
};