/**
 * Unified Scheduler System - Safe Version
 * 
 * Centralizes all timer operations to reduce timer collisions and improve performance:
 * - Single master timer with micro-scheduling
 * - Priority-based task queuing
 * - Performance-aware throttling
 * - Automatic cleanup and memory management
 * - Integration with safe performance monitoring
 */

class UnifiedScheduler {
    constructor() {
        // Master timer control
        this.isRunning = false;
        this.masterInterval = null;
        this.tickRate = 50; // 20 FPS base rate (50ms intervals)
        this.lastTick = 0;
        
        // Task management
        this.tasks = new Map();
        this.taskCounter = 0;
        this.scheduledTasks = new Set();
        
        // Performance monitoring
        this.performanceMode = 'normal'; // normal, degraded, emergency
        this.avgExecutionTime = 0;
        this.executionHistory = [];
        this.maxExecutionHistory = 10;
        
        // Priority queues
        this.priorities = {
            critical: { tasks: [], weight: 1.0 },    // Essential system tasks
            high: { tasks: [], weight: 0.8 },       // Important animations
            normal: { tasks: [], weight: 0.6 },     // Regular tasks
            low: { tasks: [], weight: 0.3 },        // Background tasks
            idle: { tasks: [], weight: 0.1 }        // Cleanup, maintenance
        };
        
        // Time slice management
        this.maxTimeSlice = 16; // 16ms max per frame (60fps budget)
        this.emergencyTimeSlice = 8; // 8ms in emergency mode
        this.currentTimeSlice = this.maxTimeSlice;
        
        // Statistics
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            skippedTasks: 0,
            averageLoad: 0,
            peakLoad: 0,
            lastCleanup: null
        };
        
        console.log('⏰ Unified Scheduler initialized');
        
        // Auto-start scheduler
        this.start();
        
        // Listen for performance changes
        this.setupPerformanceListeners();
    }
    
    /**
     * Setup performance event listeners
     */
    setupPerformanceListeners() {
        // Listen for performance degradation events
        window.addEventListener('performance:degradation-level-changed', (event) => {
            const { level } = event.detail;
            this.handlePerformanceLevelChange(level);
        });
        
        // Listen for emergency events
        window.addEventListener('performance:emergency', () => {
            this.enterEmergencyMode();
        });
        
        // Listen for FPS updates
        window.addEventListener('performance:fps:update', (event) => {
            this.handleFPSUpdate(event.detail.fps);
        });
    }
    
    /**
     * Handle performance level changes
     */
    handlePerformanceLevelChange(level) {
        const previousMode = this.performanceMode;
        
        switch (level) {
            case 'emergency':
                this.performanceMode = 'emergency';
                this.currentTimeSlice = this.emergencyTimeSlice;
                this.tickRate = 100; // 10 FPS
                break;
            case 'critical':
                this.performanceMode = 'degraded';
                this.currentTimeSlice = this.maxTimeSlice * 0.7;
                this.tickRate = 75; // ~13 FPS
                break;
            case 'warning':
                this.performanceMode = 'degraded';
                this.currentTimeSlice = this.maxTimeSlice * 0.85;
                this.tickRate = 60; // ~16 FPS
                break;
            default:
                this.performanceMode = 'normal';
                this.currentTimeSlice = this.maxTimeSlice;
                this.tickRate = 50; // 20 FPS
                break;
        }
        
        if (previousMode !== this.performanceMode) {
            console.log(`⏰ Scheduler performance mode: ${previousMode} → ${this.performanceMode}`);
            this.restart(); // Restart with new settings
        }
    }
    
    /**
     * Handle FPS updates for adaptive scheduling
     */
    handleFPSUpdate(fps) {
        // Adjust time slices based on current FPS
        if (fps < 30) {
            this.currentTimeSlice = Math.min(this.currentTimeSlice * 0.9, this.emergencyTimeSlice);
        } else if (fps > 50) {
            this.currentTimeSlice = Math.min(this.currentTimeSlice * 1.1, this.maxTimeSlice);
        }
    }
    
    /**
     * Enter emergency mode - reduce all scheduling to minimum
     */
    enterEmergencyMode() {
        console.log('🚨 Scheduler entering emergency mode');
        
        this.performanceMode = 'emergency';
        this.currentTimeSlice = this.emergencyTimeSlice;
        this.tickRate = 200; // 5 FPS
        
        // Pause all non-critical tasks
        this.pauseTasksByPriority(['low', 'idle']);
        
        this.restart();
    }
    
    /**
     * Start the unified scheduler
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTick = performance.now();
        
        // Start master timer
        this.masterInterval = setInterval(() => {
            this.tick();
        }, this.tickRate);
        
        console.log(`⏰ Unified Scheduler started (${this.tickRate}ms tick rate)`);
    }
    
    /**
     * Stop the unified scheduler
     */
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        
        if (this.masterInterval) {
            clearInterval(this.masterInterval);
            this.masterInterval = null;
        }
        
        console.log('⏰ Unified Scheduler stopped');
    }
    
    /**
     * Restart scheduler with current settings
     */
    restart() {
        if (this.isRunning) {
            this.stop();
            this.start();
        }
    }
    
    /**
     * Main scheduler tick
     */
    tick() {
        const tickStart = performance.now();
        const deltaTime = tickStart - this.lastTick;
        this.lastTick = tickStart;
        
        // Execute tasks within time budget
        this.executeTasks(tickStart, deltaTime);
        
        // Update performance metrics
        const executionTime = performance.now() - tickStart;
        this.updatePerformanceMetrics(executionTime);
        
        // Periodic maintenance
        if (this.stats.completedTasks % 100 === 0) {
            this.performMaintenance();
        }
    }
    
    /**
     * Execute scheduled tasks within time budget
     */
    executeTasks(startTime, deltaTime) {
        let timeUsed = 0;
        let tasksExecuted = 0;
        let tasksSkipped = 0;
        
        // Process tasks by priority
        const priorityOrder = ['critical', 'high', 'normal', 'low', 'idle'];
        
        for (const priority of priorityOrder) {
            if (timeUsed >= this.currentTimeSlice) break;
            
            const queue = this.priorities[priority];
            const timeAllowance = (this.currentTimeSlice - timeUsed) * queue.weight;
            
            const result = this.executePriorityQueue(priority, timeAllowance, startTime, deltaTime);
            timeUsed += result.timeUsed;
            tasksExecuted += result.executed;
            tasksSkipped += result.skipped;
        }
        
        // Update statistics
        this.stats.completedTasks += tasksExecuted;
        this.stats.skippedTasks += tasksSkipped;
        this.updateLoadMetrics(timeUsed, tasksExecuted);
    }
    
    /**
     * Execute tasks in a specific priority queue
     */
    executePriorityQueue(priority, timeAllowance, currentTime, deltaTime) {
        const queue = this.priorities[priority].tasks;
        let timeUsed = 0;
        let executed = 0;
        let skipped = 0;
        
        // Process tasks in this priority level
        for (let i = queue.length - 1; i >= 0; i--) {
            if (timeUsed >= timeAllowance) {
                skipped += queue.length - i - 1;
                break;
            }
            
            const task = queue[i];
            if (!task || task.paused) continue;
            
            // Check if task is ready to execute
            if (currentTime - task.lastExecution < task.interval) {
                continue;
            }
            
            // Execute task
            const taskStart = performance.now();
            const shouldContinue = this.executeTask(task, deltaTime);
            const taskTime = performance.now() - taskStart;
            
            timeUsed += taskTime;
            executed++;
            
            // Update task state
            task.lastExecution = currentTime;
            task.executionCount++;
            task.totalExecutionTime += taskTime;
            
            // Remove completed tasks
            if (!shouldContinue) {
                queue.splice(i, 1);
                this.tasks.delete(task.id);
            }
        }
        
        return { timeUsed, executed, skipped };\n    }\n    \n    /**\n     * Execute a single task safely\n     */\n    executeTask(task, deltaTime) {\n        try {\n            // Call the task function\n            const result = task.callback(deltaTime, task.userData);\n            \n            // Handle different return values\n            if (result === false) {\n                return false; // Task completed, remove it\n            }\n            \n            // Check repeat count\n            if (task.maxRepeats > 0 && task.executionCount >= task.maxRepeats) {\n                return false; // Reached max repeats\n            }\n            \n            return true; // Continue task\n            \n        } catch (error) {\n            console.error(`⏰ Error executing task ${task.id} (${task.name}):`, error);\n            task.errorCount++;\n            \n            // Remove task if too many errors\n            if (task.errorCount >= 3) {\n                console.warn(`⚠️ Removing task ${task.id} due to repeated errors`);\n                return false;\n            }\n            \n            return true;\n        }\n    }\n    \n    /**\n     * Schedule a new task\n     */\n    schedule(callback, interval, options = {}) {\n        const taskId = ++this.taskCounter;\n        const task = {\n            id: taskId,\n            name: options.name || `task-${taskId}`,\n            callback: callback,\n            interval: interval,\n            priority: options.priority || 'normal',\n            maxRepeats: options.maxRepeats || -1, // -1 = infinite\n            paused: false,\n            \n            // Execution tracking\n            createdAt: performance.now(),\n            lastExecution: 0,\n            executionCount: 0,\n            errorCount: 0,\n            totalExecutionTime: 0,\n            \n            // User data\n            userData: options.userData || null,\n            category: options.category || 'general'\n        };\n        \n        // Add to tasks map and priority queue\n        this.tasks.set(taskId, task);\n        this.priorities[task.priority].tasks.push(task);\n        this.stats.totalTasks++;\n        \n        console.log(`⏰ Scheduled task: ${task.name} (${task.priority}, ${interval}ms) - ID: ${taskId}`);\n        \n        return {\n            id: taskId,\n            pause: () => this.pauseTask(taskId),\n            resume: () => this.resumeTask(taskId),\n            cancel: () => this.cancelTask(taskId)\n        };\n    }\n    \n    /**\n     * Cancel a scheduled task\n     */\n    cancelTask(taskId) {\n        const task = this.tasks.get(taskId);\n        if (!task) return false;\n        \n        // Remove from priority queue\n        const queue = this.priorities[task.priority].tasks;\n        const index = queue.findIndex(t => t.id === taskId);\n        if (index !== -1) {\n            queue.splice(index, 1);\n        }\n        \n        // Remove from tasks map\n        this.tasks.delete(taskId);\n        \n        console.log(`⏰ Cancelled task: ${task.name} (ID: ${taskId})`);\n        return true;\n    }\n    \n    /**\n     * Pause a task\n     */\n    pauseTask(taskId) {\n        const task = this.tasks.get(taskId);\n        if (task) {\n            task.paused = true;\n            return true;\n        }\n        return false;\n    }\n    \n    /**\n     * Resume a task\n     */\n    resumeTask(taskId) {\n        const task = this.tasks.get(taskId);\n        if (task) {\n            task.paused = false;\n            return true;\n        }\n        return false;\n    }\n    \n    /**\n     * Pause tasks by priority levels\n     */\n    pauseTasksByPriority(priorities) {\n        let pausedCount = 0;\n        \n        priorities.forEach(priority => {\n            if (this.priorities[priority]) {\n                this.priorities[priority].tasks.forEach(task => {\n                    if (!task.paused) {\n                        task.paused = true;\n                        pausedCount++;\n                    }\n                });\n            }\n        });\n        \n        console.log(`⏰ Paused ${pausedCount} tasks (priorities: ${priorities.join(', ')})`);\n        return pausedCount;\n    }\n    \n    /**\n     * Resume tasks by priority levels\n     */\n    resumeTasksByPriority(priorities) {\n        let resumedCount = 0;\n        \n        priorities.forEach(priority => {\n            if (this.priorities[priority]) {\n                this.priorities[priority].tasks.forEach(task => {\n                    if (task.paused) {\n                        task.paused = false;\n                        resumedCount++;\n                    }\n                });\n            }\n        });\n        \n        console.log(`⏰ Resumed ${resumedCount} tasks (priorities: ${priorities.join(', ')})`);\n        return resumedCount;\n    }\n    \n    /**\n     * Clear tasks by category\n     */\n    clearCategory(category) {\n        let clearedCount = 0;\n        const tasksToRemove = [];\n        \n        this.tasks.forEach(task => {\n            if (task.category === category) {\n                tasksToRemove.push(task.id);\n            }\n        });\n        \n        tasksToRemove.forEach(taskId => {\n            if (this.cancelTask(taskId)) {\n                clearedCount++;\n            }\n        });\n        \n        console.log(`⏰ Cleared ${clearedCount} tasks from category: ${category}`);\n        return clearedCount;\n    }\n    \n    /**\n     * Update performance metrics\n     */\n    updatePerformanceMetrics(executionTime) {\n        // Update execution time history\n        this.executionHistory.push(executionTime);\n        if (this.executionHistory.length > this.maxExecutionHistory) {\n            this.executionHistory.shift();\n        }\n        \n        // Calculate average execution time\n        this.avgExecutionTime = this.executionHistory.reduce((a, b) => a + b, 0) / this.executionHistory.length;\n    }\n    \n    /**\n     * Update load metrics\n     */\n    updateLoadMetrics(timeUsed, tasksExecuted) {\n        const loadPercent = (timeUsed / this.currentTimeSlice) * 100;\n        \n        // Update average load (rolling average)\n        this.stats.averageLoad = this.stats.averageLoad * 0.9 + loadPercent * 0.1;\n        \n        // Update peak load\n        if (loadPercent > this.stats.peakLoad) {\n            this.stats.peakLoad = loadPercent;\n        }\n    }\n    \n    /**\n     * Perform periodic maintenance\n     */\n    performMaintenance() {\n        // Clean up completed tasks\n        let cleanedTasks = 0;\n        \n        Object.values(this.priorities).forEach(queue => {\n            for (let i = queue.tasks.length - 1; i >= 0; i--) {\n                const task = queue.tasks[i];\n                \n                // Remove tasks with too many errors or very old idle tasks\n                if (task.errorCount >= 3 || \n                    (task.priority === 'idle' && performance.now() - task.lastExecution > 300000)) {\n                    queue.tasks.splice(i, 1);\n                    this.tasks.delete(task.id);\n                    cleanedTasks++;\n                }\n            }\n        });\n        \n        if (cleanedTasks > 0) {\n            console.log(`⏰ Maintenance: cleaned up ${cleanedTasks} stale tasks`);\n        }\n        \n        // Reset peak load periodically\n        this.stats.peakLoad *= 0.95;\n        this.stats.lastCleanup = performance.now();\n    }\n    \n    /**\n     * Get scheduler statistics\n     */\n    getStats() {\n        const totalTasks = this.tasks.size;\n        const tasksByPriority = {};\n        \n        Object.keys(this.priorities).forEach(priority => {\n            tasksByPriority[priority] = this.priorities[priority].tasks.length;\n        });\n        \n        return {\n            isRunning: this.isRunning,\n            performanceMode: this.performanceMode,\n            tickRate: this.tickRate,\n            currentTimeSlice: this.currentTimeSlice,\n            totalTasks: totalTasks,\n            tasksByPriority: tasksByPriority,\n            completedTasks: this.stats.completedTasks,\n            skippedTasks: this.stats.skippedTasks,\n            averageLoad: Math.round(this.stats.averageLoad * 10) / 10,\n            peakLoad: Math.round(this.stats.peakLoad * 10) / 10,\n            avgExecutionTime: Math.round(this.avgExecutionTime * 100) / 100,\n            lastCleanup: this.stats.lastCleanup\n        };\n    }\n    \n    /**\n     * Emergency stop - clear all tasks\n     */\n    emergencyStop() {\n        console.log('🚨 Scheduler emergency stop - clearing all tasks');\n        \n        // Clear all tasks\n        this.tasks.clear();\n        Object.values(this.priorities).forEach(queue => {\n            queue.tasks.length = 0;\n        });\n        \n        // Reset stats\n        this.stats.totalTasks = 0;\n        this.stats.completedTasks = 0;\n        this.stats.skippedTasks = 0;\n        this.stats.averageLoad = 0;\n        this.stats.peakLoad = 0;\n        \n        console.log('✅ All tasks cleared');\n    }\n    \n    /**\n     * Cleanup and destroy scheduler\n     */\n    destroy() {\n        console.log('💀 Destroying Unified Scheduler...');\n        \n        this.stop();\n        this.emergencyStop();\n        \n        console.log('✅ Unified Scheduler destroyed');\n    }\n}\n\n// Create global instance\nconst unifiedScheduler = new UnifiedScheduler();\n\n// Make it globally available\nwindow.unifiedScheduler = unifiedScheduler;\n\n// Add convenience functions for backward compatibility\nwindow.scheduleTask = (callback, interval, options) => {\n    return unifiedScheduler.schedule(callback, interval, options);\n};\n\nwindow.cancelScheduledTask = (taskId) => {\n    return unifiedScheduler.cancelTask(taskId);\n};\n\n// Debugging functions\nwindow.SCHEDULER_STATS = () => {\n    const stats = unifiedScheduler.getStats();\n    console.table(stats);\n    return stats;\n};\n\nwindow.SCHEDULER_EMERGENCY_STOP = () => {\n    unifiedScheduler.emergencyStop();\n};\n\nconsole.log('⏰ Unified Scheduler loaded');\nconsole.log('🔧 Debug: SCHEDULER_STATS(), SCHEDULER_EMERGENCY_STOP()');\nconsole.log('📋 Usage: scheduleTask(callback, interval, options)');\n\nexport default unifiedScheduler;