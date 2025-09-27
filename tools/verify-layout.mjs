import { chromium } from '@playwright/test';

const URL = 'http://localhost:3886/control-panel.html';
const VIEWPORT = { width: 1920, height: 1080 };

const main = async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);
  
  try {
    console.log('Navigating to control panel...');
    await page.goto(URL, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for the control panel to fully render
    await page.waitForSelector('.control-panel', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => {
      const pick = sel => document.querySelector(sel);
      
      // Try multiple selectors for sections
      const scene = pick('.section--scenes') || pick('.scene-control');
      const fx = pick('.section--intensity') || pick('.effects-control');
      const tempo = pick('.section--tempo') || pick('.speed-control');
      const triggers = pick('.section--triggers') || pick('.trigger-control');
      const animation = pick('.section--animation');
      const veLayers = pick('.section--ve-layers') || pick('.effects-layers-control');
      
      return {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        sceneWidth: scene ? scene.offsetWidth : null,
        sceneHeight: scene ? scene.offsetHeight : null,
        fxWidth: fx ? fx.offsetWidth : null,
        fxHeight: fx ? fx.offsetHeight : null,
        tempoWidth: tempo ? tempo.offsetWidth : null,
        tempoHeight: tempo ? tempo.offsetHeight : null,
        triggersWidth: triggers ? triggers.offsetWidth : null,
        animationWidth: animation ? animation.offsetWidth : null,
        veLayersWidth: veLayers ? veLayers.offsetWidth : null,
        veLayersHeight: veLayers ? veLayers.offsetHeight : null,
        
        // Check if scene grid has scrollbar
        sceneGridOverflow: (() => {
          const grid = pick('.scene-grid');
          return grid ? grid.scrollHeight > grid.clientHeight : false;
        })()
      };
    });

    const pct = (v, total) => v === null ? null : Math.round((v / total) * 100);
    
    console.log('\n📊 Layout Analysis at 1920x1080:');
    console.log('━'.repeat(50));
    
    console.log('\n🎬 SCENE SELECT:');
    console.log(`  Width: ${metrics.sceneWidth}px (${pct(metrics.sceneWidth, metrics.viewportWidth)}% of viewport)`);
    console.log(`  Height: ${metrics.sceneHeight}px`);
    console.log(`  Has scrollbar: ${metrics.sceneGridOverflow ? '✓ Yes' : '✗ No'}`);
    
    console.log('\n🎚️ FX INTENSITY:');
    console.log(`  Width: ${metrics.fxWidth}px (${pct(metrics.fxWidth, metrics.viewportWidth)}% of viewport)`);
    console.log(`  Height: ${metrics.fxHeight}px`);
    
    console.log('\n⏱️ TEMPO:');
    console.log(`  Width: ${metrics.tempoWidth}px (${pct(metrics.tempoWidth, metrics.viewportWidth)}% of viewport)`);
    console.log(`  Height: ${metrics.tempoHeight}px`);
    
    console.log('\n🎯 TRIGGERS:');
    console.log(`  Width: ${metrics.triggersWidth}px (${pct(metrics.triggersWidth, metrics.viewportWidth)}% of viewport)`);
    
    console.log('\n🎭 ANIMATION SYSTEM:');
    console.log(`  Width: ${metrics.animationWidth}px (${pct(metrics.animationWidth, metrics.viewportWidth)}% of viewport)`);
    
    console.log('\n✨ VISUAL EFFECTS & LAYERS:');
    console.log(`  Width: ${metrics.veLayersWidth}px (${pct(metrics.veLayersWidth, metrics.viewportWidth)}% of viewport)`);
    console.log(`  Height: ${metrics.veLayersHeight}px`);
    
    // Validation checks
    console.log('\n✅ Validation Results:');
    console.log('━'.repeat(50));
    
    const sceneWidthPct = metrics.sceneWidth ? metrics.sceneWidth / metrics.viewportWidth : 0;
    const isSceneCompact = sceneWidthPct <= 0.32;
    
    console.log(`  Scene width ≤ 32% of viewport: ${isSceneCompact ? '✅ PASS' : '❌ FAIL'} (${Math.round(sceneWidthPct * 100)}%)`);
    
    // Check total width usage
    const totalWidth = (metrics.sceneWidth || 0) + (metrics.fxWidth || 0) + (metrics.tempoWidth || 0);
    const totalPct = pct(totalWidth, metrics.viewportWidth);
    console.log(`  Total row width usage: ${totalWidth}px (${totalPct}% of viewport)`);
    
    // Check if viewport height is exceeded
    const totalHeight = Math.max(
      metrics.sceneHeight || 0,
      metrics.fxHeight || 0,
      metrics.tempoHeight || 0
    ) + (metrics.veLayersHeight || 0);
    const fitsViewport = totalHeight <= metrics.viewportHeight;
    console.log(`  Fits in viewport height: ${fitsViewport ? '✅ YES' : '⚠️ NO'} (${totalHeight}px / ${metrics.viewportHeight}px)`);
    
    if (!isSceneCompact) {
      throw new Error(`SCENE SELECT exceeds 32% of viewport width (${Math.round(sceneWidthPct * 100)}%)`);
    }
    
    console.log('\n✨ Layout verification complete! All checks passed.');
    
  } catch (error) {
    console.error('\n❌ Layout verification failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
};

main().catch(err => {
  console.error('Failed to verify layout:', err);
  process.exit(1);
});