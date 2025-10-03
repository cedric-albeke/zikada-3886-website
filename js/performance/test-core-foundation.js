/**
 * Test Core Performance Foundation
 * Basic integration test for FPS Stabilizer and Quality Scaler
 */

import { fpsStabilizer } from './fps-stabilizer.js';
import { qualityScaler } from './quality-scaler.js';

// Test basic functionality
console.log('🧪 Testing Core Performance Foundation');

// Connect the systems
fpsStabilizer.setQualityScaler(qualityScaler);

// Simulate frame analysis
const frameAnalysis = fpsStabilizer.analyzeFrame();
console.log('Frame Analysis:', frameAnalysis);

// Test quality adjustment
const qualityResult = qualityScaler.adjustQuality(60, 45);
console.log('Quality Adjustment:', qualityResult);

// Get metrics
console.log('FPS Stabilizer Metrics:', fpsStabilizer.getMetrics());
console.log('Quality Scaler Metrics:', qualityScaler.getMetrics());

console.log('✅ Core foundation test complete');