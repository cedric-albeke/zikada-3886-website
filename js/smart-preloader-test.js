/**
 * Smart Preloader Test Suite for ZIKADA 3886
 * 
 * Comprehensive testing framework for:
 * - Network condition simulation and adaptation
 * - Performance state integration testing
 * - Resource loading scenarios and edge cases
 * - Budget management and cache behavior
 * - Priority queue and scheduling logic
 */

import featureFlags from './feature-flags.js';

class SmartPreloaderTest {
    constructor() {
        this.debugMode = featureFlags.isEnabled('debugMetrics');
        this.testResults = [];
        this.originalNetworkInfo = null;
        this.mockResources = [];
        
        this.initializeMockResources();
        console.log('🧪 Smart Preloader Test Suite initialized');
    }
    
    /**
     * Initialize mock resources for testing
     */
    initializeMockResources() {
        this.mockResources = [
            {
                url: 'https://example.com/critical.js',
                type: 'critical',
                estimatedSize: 15 * 1024, // 15KB
                description: 'Critical JavaScript module'
            },
            {
                url: 'https://example.com/important.css',
                type: 'important', 
                estimatedSize: 12 * 1024, // 12KB
                description: 'Important stylesheet'
            },
            {
                url: 'https://example.com/normal.json',
                type: 'normal',
                estimatedSize: 8 * 1024, // 8KB
                description: 'Normal data file'
            },
            {
                url: 'https://example.com/low-priority.png',
                type: 'low',
                estimatedSize: 4 * 1024, // 4KB
                description: 'Low priority image'
            },
            {
                url: 'https://example.com/optional.svg',
                type: 'optional',
                estimatedSize: 2 * 1024, // 2KB
                description: 'Optional decorative asset'
            },
            {
                url: 'https://example.com/large.woff2',
                type: 'normal',
                estimatedSize: 25 * 1024, // 25KB - exceeds normal maxSize
                description: 'Oversized font file'
            }
        ];
    }
    
    /**
     * Run all test scenarios
     */
    async runAllTests() {
        console.log('🧪 Starting Smart Preloader comprehensive test suite...');
        this.testResults = [];
        
        try {
            // Test 1: Network condition adaptation
            await this.testNetworkAdaptation();
            
            // Test 2: Performance state integration
            await this.testPerformanceStateIntegration();
            
            // Test 3: Budget management
            await this.testBudgetManagement();
            
            // Test 4: Priority queue management
            await this.testPriorityQueue();
            
            // Test 5: Resource scheduling and loading
            await this.testResourceScheduling();
            
            // Test 6: Cache management
            await this.testCacheManagement();
            
            // Test 7: Error handling and recovery
            await this.testErrorHandling();
            
            // Test 8: Integration with performance systems
            await this.testPerformanceSystemIntegration();
            
            console.log('🧪 All tests completed');
            this.printTestResults();
            
        } catch (error) {
            console.error('🧪 Test suite failed:', error);
        }
        
        return this.getTestSummary();
    }
    
    /**
     * Test network condition adaptation
     */
    async testNetworkAdaptation() {
        const testName = 'Network Adaptation';
        console.log(`🧪 ${testName}: Testing network-aware resource loading...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Test WiFi conditions - should allow all resource types
            this.mockNetworkCondition('wifi', '4g', 50, false);
            
            const wifiResults = {
                critical: preloader.schedulePreload(this.mockResources[0]),
                important: preloader.schedulePreload(this.mockResources[1]),
                normal: preloader.schedulePreload(this.mockResources[2]),
                low: preloader.schedulePreload(this.mockResources[3]),
                optional: preloader.schedulePreload(this.mockResources[4])
            };
            
            details.wifiResults = wifiResults;
            
            // All should be accepted on WiFi
            const wifiSuccess = Object.values(wifiResults).every(result => result === true);
            if (!wifiSuccess) {
                testPassed = false;
                details.wifiError = 'Not all resources accepted on WiFi';
            }
            
            // Clear queue
            preloader.preloadQueue = [];
            
            // Test slow network conditions - should restrict resources
            this.mockNetworkCondition('cellular', '2g', 0.5, true); // Slow 2G with data saver
            
            const slowResults = {
                critical: preloader.schedulePreload(this.mockResources[0]),
                important: preloader.schedulePreload(this.mockResources[1]),
                normal: preloader.schedulePreload(this.mockResources[2]),
                low: preloader.schedulePreload(this.mockResources[3]),
                optional: preloader.schedulePreload(this.mockResources[4])
            };
            
            details.slowResults = slowResults;
            
            // Only critical should be accepted on slow network with data saver
            if (slowResults.critical !== true || 
                slowResults.important !== false ||
                slowResults.normal !== false ||
                slowResults.low !== false ||
                slowResults.optional !== false) {
                testPassed = false;
                details.slowError = 'Incorrect resource filtering on slow network';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test performance state integration
     */
    async testPerformanceStateIntegration() {
        const testName = 'Performance State Integration';
        console.log(`🧪 ${testName}: Testing performance state coordination...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Reset to good network conditions
            this.mockNetworkCondition('wifi', '4g', 50, false);
            
            // Test S0 state (full quality) - should accept most resources
            preloader.currentPerformanceState = 'S0';
            preloader.preloadQueue = [];
            
            const s0Results = this.scheduleAllMockResources(preloader);
            details.s0Results = s0Results;
            
            const s0Expected = { critical: true, important: true, normal: true, low: true, optional: true };
            if (!this.compareResults(s0Results, s0Expected)) {
                testPassed = false;
                details.s0Error = 'S0 state should accept most resources';
            }
            
            // Test S3 state (degraded) - should restrict resources
            preloader.currentPerformanceState = 'S3';
            preloader.preloadQueue = [];
            
            const s3Results = this.scheduleAllMockResources(preloader);
            details.s3Results = s3Results;
            
            const s3Expected = { critical: true, important: true, normal: false, low: false, optional: false };
            if (!this.compareResults(s3Results, s3Expected)) {
                testPassed = false;
                details.s3Error = 'S3 state should restrict to critical/important only';
            }
            
            // Test S5 state (minimal) - should only accept critical
            preloader.currentPerformanceState = 'S5';
            preloader.preloadQueue = [];
            
            const s5Results = this.scheduleAllMockResources(preloader);
            details.s5Results = s5Results;
            
            const s5Expected = { critical: true, important: false, normal: false, low: false, optional: false };
            if (!this.compareResults(s5Results, s5Expected)) {
                testPassed = false;
                details.s5Error = 'S5 state should only accept critical resources';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test budget management
     */
    async testBudgetManagement() {
        const testName = 'Budget Management';
        console.log(`🧪 ${testName}: Testing resource budget enforcement...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Reset preloader state
            preloader.budgetUsed = 0;
            preloader.preloadQueue = [];
            preloader.currentPerformanceState = 'S0';
            this.mockNetworkCondition('wifi', '4g', 50, false);
            
            // Test normal budget operation
            const initialBudget = preloader.maxBudget;
            details.initialBudget = initialBudget;
            
            // Schedule resources within budget
            const normalResults = this.scheduleAllMockResources(preloader);
            details.normalResults = normalResults;
            
            // Calculate total estimated size
            const totalSize = this.mockResources.slice(0, 5).reduce((sum, r) => sum + r.estimatedSize, 0);
            details.totalEstimatedSize = totalSize;
            
            if (totalSize > initialBudget) {
                details.expectedBudgetViolation = true;
                // Some resources should be rejected due to budget
                if (Object.values(normalResults).every(r => r === true)) {
                    testPassed = false;
                    details.budgetError = 'Budget constraints not enforced';
                }
            } else {
                details.expectedBudgetViolation = false;
                // All should be accepted if within budget
                if (!Object.values(normalResults).every(r => r === true)) {
                    testPassed = false;
                    details.budgetError = 'Resources rejected despite being within budget';
                }
            }
            
            // Test budget exhaustion
            preloader.budgetUsed = preloader.maxBudget - 5000; // Leave only 5KB
            preloader.preloadQueue = [];
            
            const budgetExhaustedResults = {
                small: preloader.schedulePreload({ url: 'test://small', type: 'normal', estimatedSize: 3000 }),
                large: preloader.schedulePreload({ url: 'test://large', type: 'normal', estimatedSize: 10000 })
            };
            
            details.budgetExhaustedResults = budgetExhaustedResults;
            
            // Small should be accepted, large should be rejected
            if (budgetExhaustedResults.small !== true || budgetExhaustedResults.large !== false) {
                testPassed = false;
                details.exhaustionError = 'Budget exhaustion not handled correctly';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test priority queue management
     */
    async testPriorityQueue() {
        const testName = 'Priority Queue Management';
        console.log(`🧪 ${testName}: Testing resource prioritization...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Reset state
            preloader.budgetUsed = 0;
            preloader.preloadQueue = [];
            preloader.currentPerformanceState = 'S0';
            this.mockNetworkCondition('wifi', '4g', 50, false);
            
            // Schedule resources in reverse priority order (lowest to highest)
            const resources = [...this.mockResources].slice(0, 5).reverse();
            resources.forEach(resource => preloader.schedulePreload(resource));
            
            // Check queue ordering (should be highest priority first)
            const queuePriorities = preloader.preloadQueue.map(r => r.priority);
            details.queuePriorities = queuePriorities;
            
            // Verify descending priority order
            const isCorrectlyOrdered = queuePriorities.every((priority, index) => {
                if (index === 0) return true;
                return priority <= queuePriorities[index - 1];
            });
            
            if (!isCorrectlyOrdered) {
                testPassed = false;
                details.orderError = 'Queue not correctly ordered by priority';
            }
            
            // Test custom priority override
            preloader.preloadQueue = [];
            const customResource = {
                url: 'test://custom',
                type: 'normal',
                priority: 95, // Higher than normal priority (50)
                estimatedSize: 5000
            };
            
            preloader.schedulePreload(customResource);
            preloader.schedulePreload(this.mockResources[0]); // critical (priority 100)
            
            const customQueueOrder = preloader.preloadQueue.map(r => ({ url: r.url, priority: r.priority }));
            details.customQueueOrder = customQueueOrder;
            
            // Critical should be first, then custom
            if (preloader.preloadQueue.length !== 2 ||
                preloader.preloadQueue[0].priority !== 100 ||
                preloader.preloadQueue[1].priority !== 95) {
                testPassed = false;
                details.customPriorityError = 'Custom priority not respected';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test resource scheduling and loading
     */
    async testResourceScheduling() {
        const testName = 'Resource Scheduling';
        console.log(`🧪 ${testName}: Testing scheduling logic and validation...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Reset state
            preloader.preloadQueue = [];
            preloader.loadedResources.clear();
            preloader.failedResources.clear();
            
            // Test duplicate prevention
            const testUrl = 'test://duplicate';
            const resource = { url: testUrl, type: 'normal', estimatedSize: 5000 };
            
            const firstSchedule = preloader.schedulePreload(resource);
            const secondSchedule = preloader.schedulePreload(resource);
            
            details.duplicateResults = { first: firstSchedule, second: secondSchedule };
            
            if (firstSchedule !== true || secondSchedule !== false) {
                testPassed = false;
                details.duplicateError = 'Duplicate prevention not working';
            }
            
            // Test invalid resource rejection
            const invalidResults = {
                noUrl: preloader.schedulePreload({ type: 'normal' }),
                noType: preloader.schedulePreload({ url: 'test://notype' }),
                invalidType: preloader.schedulePreload({ url: 'test://invalid', type: 'invalid' }),
                nullResource: preloader.schedulePreload(null)
            };
            
            details.invalidResults = invalidResults;
            
            const allInvalidRejected = Object.values(invalidResults).every(result => result === false);
            if (!allInvalidRejected) {
                testPassed = false;
                details.validationError = 'Invalid resources not properly rejected';
            }
            
            // Test already loaded resource rejection
            preloader.loadedResources.set('test://loaded', { size: 1000 });
            const alreadyLoadedResult = preloader.schedulePreload({
                url: 'test://loaded',
                type: 'normal',
                estimatedSize: 5000
            });
            
            details.alreadyLoadedResult = alreadyLoadedResult;
            
            if (alreadyLoadedResult !== false) {
                testPassed = false;
                details.alreadyLoadedError = 'Already loaded resources not rejected';
            }
            
            // Test failed resource rejection
            preloader.failedResources.add('test://failed');
            const failedResourceResult = preloader.schedulePreload({
                url: 'test://failed',
                type: 'normal',
                estimatedSize: 5000
            });
            
            details.failedResourceResult = failedResourceResult;
            
            if (failedResourceResult !== false) {
                testPassed = false;
                details.failedResourceError = 'Failed resources not rejected';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test cache management
     */
    async testCacheManagement() {
        const testName = 'Cache Management';
        console.log(`🧪 ${testName}: Testing resource caching and cleanup...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Reset cache state
            preloader.loadedResources.clear();
            preloader.budgetUsed = 0;
            
            // Mock some cached resources
            const mockCached = [
                { url: 'test://critical', type: 'critical', size: 10000 },
                { url: 'test://normal1', type: 'normal', size: 8000 },
                { url: 'test://normal2', type: 'normal', size: 12000 },
                { url: 'test://low', type: 'low', size: 5000 }
            ];
            
            let totalSize = 0;
            mockCached.forEach(item => {
                preloader.loadedResources.set(item.url, {
                    data: new Blob([]),
                    size: item.size,
                    type: item.type,
                    loadedAt: performance.now()
                });
                totalSize += item.size;
            });
            preloader.budgetUsed = totalSize;
            
            details.initialCache = {
                count: preloader.loadedResources.size,
                size: preloader.budgetUsed
            };
            
            // Test non-critical cache clearing
            const beforeClearance = {
                count: preloader.loadedResources.size,
                budgetUsed: preloader.budgetUsed
            };
            
            preloader.clearNonCriticalCache();
            
            const afterClearance = {
                count: preloader.loadedResources.size,
                budgetUsed: preloader.budgetUsed
            };
            
            details.clearanceResults = { before: beforeClearance, after: afterClearance };
            
            // Should have fewer resources and less budget used
            if (afterClearance.count >= beforeClearance.count) {
                testPassed = false;
                details.clearanceError = 'Cache clearing did not remove resources';
            }
            
            if (afterClearance.budgetUsed >= beforeClearance.budgetUsed) {
                testPassed = false;
                details.budgetClearanceError = 'Cache clearing did not reduce budget usage';
            }
            
            // Critical resource should remain
            if (!preloader.isResourceCached('test://critical')) {
                testPassed = false;
                details.criticalPreservationError = 'Critical resource was cleared';
            }
            
            // Non-critical resources should be gone
            if (preloader.isResourceCached('test://normal1') || 
                preloader.isResourceCached('test://low')) {
                testPassed = false;
                details.nonCriticalClearanceError = 'Non-critical resources not cleared';
            }
            
            // Test resource retrieval
            const retrievedResource = preloader.getResource('test://critical');
            details.retrievedResource = retrievedResource ? 'found' : 'not found';
            
            if (!retrievedResource) {
                testPassed = false;
                details.retrievalError = 'Could not retrieve cached resource';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test error handling and recovery
     */
    async testErrorHandling() {
        const testName = 'Error Handling';
        console.log(`🧪 ${testName}: Testing error scenarios and recovery...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Test invalid network conditions handling
            const originalNetworkInfo = preloader.networkInfo;
            
            // Mock missing network API
            preloader.networkInfo = null;
            preloader.updateNetworkInfo(); // Should not crash
            
            details.missingNetworkAPI = 'handled gracefully';
            
            // Restore network info
            preloader.networkInfo = originalNetworkInfo;
            
            // Test oversized resource handling
            const oversizedResult = preloader.schedulePreload({
                url: 'test://oversized',
                type: 'normal',
                estimatedSize: 200 * 1024 // 200KB - exceeds budget
            });
            
            details.oversizedResult = oversizedResult;
            
            if (oversizedResult !== false) {
                testPassed = false;
                details.oversizedError = 'Oversized resource not rejected';
            }
            
            // Test performance emergency handling
            preloader.isActive = true;
            preloader.isPerformanceEmergency = false;
            
            // Trigger performance emergency
            preloader.pausePreloading('test_emergency');
            
            if (preloader.isActive !== false) {
                testPassed = false;
                details.emergencyError = 'Performance emergency not handled';
            }
            
            // Test resume after emergency
            preloader.resumePreloading();
            
            if (preloader.isActive !== true) {
                testPassed = false;
                details.resumeError = 'Resume after emergency not working';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Test integration with performance systems
     */
    async testPerformanceSystemIntegration() {
        const testName = 'Performance System Integration';
        console.log(`🧪 ${testName}: Testing event-driven integration...`);
        
        if (!window.SMART_PRELOADER) {
            this.recordFailure(testName, 'Smart Preloader not available');
            return;
        }
        
        const preloader = window.SMART_PRELOADER;
        let testPassed = true;
        const details = {};
        
        try {
            // Test performance state change event
            const originalState = preloader.currentPerformanceState;
            
            // Simulate performance state change event
            const stateChangeEvent = new CustomEvent('performance:state:changed', {
                detail: { to: 'S4', from: 'S0', type: 'degradation' }
            });
            
            window.dispatchEvent(stateChangeEvent);
            
            // Wait briefly for event processing
            await this.wait(100);
            
            details.stateChangeResponse = {
                originalState,
                newState: preloader.currentPerformanceState,
                eventProcessed: preloader.currentPerformanceState === 'S4'
            };
            
            if (preloader.currentPerformanceState !== 'S4') {
                testPassed = false;
                details.stateChangeError = 'Performance state change event not processed';
            }
            
            // Test memory warning event
            const originalConcurrentLoads = preloader.maxConcurrentLoads;
            
            const memoryWarningEvent = new CustomEvent('memory:warning', {
                detail: { heapGrowth: 50 }
            });
            
            window.dispatchEvent(memoryWarningEvent);
            
            // Wait for event processing
            await this.wait(100);
            
            details.memoryWarningResponse = {
                originalConcurrentLoads,
                newConcurrentLoads: preloader.maxConcurrentLoads,
                reduced: preloader.maxConcurrentLoads < originalConcurrentLoads
            };
            
            if (preloader.maxConcurrentLoads >= originalConcurrentLoads) {
                testPassed = false;
                details.memoryWarningError = 'Memory warning not processed correctly';
            }
            
            // Test performance emergency event
            const emergencyEvent = new CustomEvent('performance:emergency', {
                detail: { level: 'critical' }
            });
            
            window.dispatchEvent(emergencyEvent);
            
            // Wait for event processing
            await this.wait(100);
            
            details.emergencyResponse = {
                isEmergency: preloader.isPerformanceEmergency,
                isActive: preloader.isActive
            };
            
            if (!preloader.isPerformanceEmergency || preloader.isActive) {
                testPassed = false;
                details.emergencyEventError = 'Performance emergency event not processed';
            }
            
            this.recordResult(testName, testPassed, details);
            
        } catch (error) {
            this.recordFailure(testName, error.message, details);
        }
    }
    
    /**
     * Mock network conditions for testing
     */
    mockNetworkCondition(type, effectiveType, downlink, saveData) {
        if (!window.SMART_PRELOADER) return;
        
        const preloader = window.SMART_PRELOADER;
        preloader.networkType = type;
        preloader.effectiveType = effectiveType;
        preloader.downlink = downlink;
        preloader.saveData = saveData;
    }
    
    /**
     * Schedule all mock resources and return results
     */
    scheduleAllMockResources(preloader) {
        return {
            critical: preloader.schedulePreload(this.mockResources[0]),
            important: preloader.schedulePreload(this.mockResources[1]),
            normal: preloader.schedulePreload(this.mockResources[2]),
            low: preloader.schedulePreload(this.mockResources[3]),
            optional: preloader.schedulePreload(this.mockResources[4])
        };
    }
    
    /**
     * Compare test results with expected outcomes
     */
    compareResults(actual, expected) {
        return Object.keys(expected).every(key => actual[key] === expected[key]);
    }
    
    /**
     * Record successful test result
     */
    recordResult(testName, passed, details = {}) {
        this.testResults.push({
            name: testName,
            passed,
            details,
            timestamp: performance.now()
        });
        
        const status = passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`🧪   ${testName}: ${status}`);
        
        if (!passed && this.debugMode) {
            console.log('🧪   Details:', details);
        }
    }
    
    /**
     * Record failed test result
     */
    recordFailure(testName, error, details = {}) {
        this.testResults.push({
            name: testName,
            passed: false,
            error,
            details,
            timestamp: performance.now()
        });
        
        console.log(`🧪   ${testName}: ❌ FAILED - ${error}`);
        if (this.debugMode) {
            console.log('🧪   Details:', details);
        }
    }
    
    /**
     * Wait for specified duration
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Print comprehensive test results
     */
    printTestResults() {
        console.log('\n🧪 ===== SMART PRELOADER TEST RESULTS =====');
        
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
        
        console.log(`🧪 Overall: ${passed}/${total} tests passed (${passRate}%)`);
        console.log('🧪 ===============================================');
        
        this.testResults.forEach((test, index) => {
            const status = test.passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`🧪 Test ${index + 1}: ${test.name} - ${status}`);
            
            if (!test.passed) {
                if (test.error) {
                    console.log(`🧪   Error: ${test.error}`);
                }
                if (this.debugMode && test.details) {
                    console.log(`🧪   Details:`, test.details);
                }
            }
        });
        
        console.log('🧪 ===============================================\n');
    }
    
    /**
     * Get test summary for programmatic access
     */
    getTestSummary() {
        const passed = this.testResults.filter(t => t.passed).length;
        const total = this.testResults.length;
        
        return {
            passed,
            total,
            passRate: total > 0 ? (passed / total) * 100 : 0,
            results: this.testResults,
            success: passed === total
        };
    }
    
    /**
     * Quick test for development
     */
    async quickTest() {
        console.log('🧪 Running quick Smart Preloader test...');
        
        if (!window.SMART_PRELOADER) {
            console.error('🧪 Smart Preloader not available');
            return { success: false, error: 'Preloader not available' };
        }
        
        const preloader = window.SMART_PRELOADER;
        const initialState = preloader.getStats();
        
        console.log('🧪 Initial state:', {
            isActive: initialState.isActive,
            budgetUsed: initialState.budgetUsed,
            queueSize: initialState.queueSize,
            performanceState: initialState.performanceState
        });
        
        // Test basic scheduling
        const testResource = {
            url: 'test://quick-test',
            type: 'normal',
            estimatedSize: 5000
        };
        
        const scheduleResult = preloader.schedulePreload(testResource);
        console.log(`🧪 Schedule result: ${scheduleResult}`);
        
        const finalStats = preloader.getStats();
        console.log('🧪 Final stats:', {
            queueSize: finalStats.queueSize,
            budgetUsed: finalStats.budgetUsed,
            totalRequested: finalStats.totalRequested
        });
        
        const success = scheduleResult === true && finalStats.queueSize > initialState.queueSize;
        console.log(`🧪 Quick test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
        
        return { success, scheduleResult, initialState, finalStats };
    }
    
    /**
     * Get current preloader statistics
     */
    getPreloaderStats() {
        if (window.SMART_PRELOADER) {
            return window.SMART_PRELOADER.getStats();
        }
        return null;
    }
    
    /**
     * Force a specific network condition for testing
     */
    setNetworkCondition(type, effectiveType, downlink, saveData = false) {
        this.mockNetworkCondition(type, effectiveType, downlink, saveData);
        console.log(`🧪 Network condition set: ${effectiveType} (${downlink} Mbps)${saveData ? ' [Data Saver]' : ''}`);
    }
    
    /**
     * Clear preloader state for testing
     */
    resetPreloader() {
        if (window.SMART_PRELOADER) {
            const preloader = window.SMART_PRELOADER;
            preloader.preloadQueue = [];
            preloader.loadedResources.clear();
            preloader.failedResources.clear();
            preloader.budgetUsed = 0;
            preloader.currentPerformanceState = 'S0';
            preloader.isPerformanceEmergency = false;
            console.log('🧪 Preloader state reset');
            return true;
        }
        return false;
    }
}

// Create and expose test instance
const smartPreloaderTest = new SmartPreloaderTest();

// Expose for manual testing in browser console
if (typeof window !== 'undefined') {
    window.SMART_PRELOADER_TEST = smartPreloaderTest;
    
    // Add convenience methods to window for easy console access
    window.testSmartPreloader = () => smartPreloaderTest.runAllTests();
    window.quickTestPreloader = () => smartPreloaderTest.quickTest();
    window.getPreloaderStats = () => smartPreloaderTest.getPreloaderStats();
    window.setNetworkCondition = (type, effectiveType, downlink, saveData) => 
        smartPreloaderTest.setNetworkCondition(type, effectiveType, downlink, saveData);
    window.resetPreloader = () => smartPreloaderTest.resetPreloader();
}

export default smartPreloaderTest;