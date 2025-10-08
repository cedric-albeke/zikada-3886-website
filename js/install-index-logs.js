/**
 * ============================================
 * ZIKADA 3886 - INDEX PAGE LOG INSTALLER
 * ============================================
 * 
 * Installs console interceptor for index page to broadcast logs
 * to control panel in real-time
 */

import { logBus } from './logger-bus.js';

try {
  logBus.installConsoleInterceptor({ sourceTag: 'index' });
  console.log('🎛️ Live console bus initialized for index page');
} catch (e) {
  console.warn('Failed to initialize live console bus on index:', e);
}