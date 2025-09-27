import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const captureScreenshot = async (phase = 'before') => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    console.log('Navigating to control panel...');
    await page.goto('http://localhost:3886/control-panel.html', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for the control panel to fully render
    await page.waitForSelector('.control-panel', { timeout: 10000 });
    await page.waitForTimeout(1500); // Give animations time to settle
    
    const screenshotDir = join(__dirname, '..', 'docs', 'screenshots', phase);
    
    // Capture viewport screenshot
    const viewportPath = join(screenshotDir, 'control-panel-1920x1080.png');
    await page.screenshot({ 
      path: viewportPath,
      type: 'png'
    });
    console.log(`✓ Viewport screenshot saved: ${viewportPath}`);
    
    // Capture full page screenshot
    const fullPagePath = join(screenshotDir, 'control-panel-1920x1080-fullpage.png');
    await page.screenshot({ 
      path: fullPagePath,
      fullPage: true,
      type: 'png'
    });
    console.log(`✓ Full page screenshot saved: ${fullPagePath}`);
    
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

// Get phase from command line argument
const phase = process.argv[2] || 'before';
captureScreenshot(phase).catch(err => {
  console.error('Failed to capture screenshot:', err);
  process.exit(1);
});