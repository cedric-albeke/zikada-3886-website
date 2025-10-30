#!/usr/bin/env node
// Copy static assets (animations, lotties, videos) to public/ before Vite build
// Vite automatically copies everything from public/ to dist/ during build

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const dirs = ['animations', 'lotties', 'videos'];

// Ensure public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('📁 Created public/ directory');
}

// Copy each directory if it exists
dirs.forEach(dir => {
  const sourcePath = path.join(process.cwd(), dir);
  const destPath = path.join(publicDir, dir);
  
  if (fs.existsSync(sourcePath)) {
    try {
      // Remove destination if it exists
      if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
      }
      
      // Use platform-appropriate copy command
      if (process.platform === 'win32') {
        // Windows - use robocopy for reliability
        execSync(`robocopy "${sourcePath}" "${destPath}" /E /NFL /NDL /NJH /NJS`, { stdio: 'pipe' });
      } else {
        // Unix/Linux (including Nixpacks)
        execSync(`cp -r "${sourcePath}" "${publicDir}/"`, { stdio: 'inherit' });
      }
      console.log(`✅ Copied ${dir}/ to public/${dir}/`);
    } catch (error) {
      // robocopy exits with code 1 for success, ignore it
      if (process.platform === 'win32' && error.status === 1) {
        console.log(`✅ Copied ${dir}/ to public/${dir}/`);
      } else {
        console.warn(`⚠️  Failed to copy ${dir}/:`, error.message);
      }
    }
  } else {
    console.log(`ℹ️  ${dir}/ not found, skipping`);
  }
});

console.log('✅ Static assets copy complete');

