/**
 * Animation Batcher - GSAP Coordination System
 * 
 * Simplified animation batching for performance optimization
 * - Frame-aligned animation updates
 * - Priority-based scheduling
 * - Integration with existing GSAP registry
 */

export class AnimationBatcher {
    constructor() {
        this.animationQueue = [];
        this.priorityQueues = {
            critical: [],
            high: [],
            normal: [],
            low: []
        };
        
        this.enabled = false; // DISABLED BY DEFAULT
        this.frameRequestId = null;
        this.lastFrameTime = 0;
        
        this.metrics = {
            batchedAnimations: 0,
            frameUpdates: 0
        };
        
        console.log('✅ Animation Batcher initialized');
    }
    
    /**
     * Batch animation updates for next frame
     * @param {function} animationFn - Animation function to execute
     * @param {string} priority - Priority level
     */
    batchAnimation(animationFn, priority = 'normal') {
        if (!this.enabled) {
            animationFn();
            return;
        }
        
        this.priorityQueues[priority].push(animationFn);
        this.scheduleUpdate();
    }
    
    /**
     * Schedule frame update
     */
    scheduleUpdate() {
        if (this.frameRequestId) return;
        
        this.frameRequestId = requestAnimationFrame((time) => {
            this.processFrame(time);
        });
    }
    
    /**
     * Process batched animations for current frame
     * @param {number} frameTime - Current frame timestamp
     */
    processFrame(frameTime) {
        this.frameRequestId = null;
        this.lastFrameTime = frameTime;
        
        // Process priority queues in order
        const priorities = ['critical', 'high', 'normal', 'low'];
        let processedCount = 0;
        
        priorities.forEach(priority => {
            const queue = this.priorityQueues[priority];
            while (queue.length > 0) {
                const animationFn = queue.shift();
                try {
                    animationFn();
                    processedCount++;
                } catch (error) {
                    console.error('Animation batch error:', error);
                }
            }
        });
        
        this.metrics.batchedAnimations += processedCount;
        this.metrics.frameUpdates++;
    }
    
    /**
     * Get metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Enable/disable batching
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.enabled = false;
        if (this.frameRequestId) {
            cancelAnimationFrame(this.frameRequestId);
        }
        
        // Clear queues
        Object.keys(this.priorityQueues).forEach(key => {
            this.priorityQueues[key] = [];
        });
        
        console.log('🧹 Animation Batcher destroyed');
    }
}

export const animationBatcher = new AnimationBatcher();