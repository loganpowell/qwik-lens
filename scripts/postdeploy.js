#!/usr/bin/env node

/**
 * Post-deployment script for GitHub Pages
 * 
 * This script copies necessary files from the dist root to the dist/qwik-lens
 * subdirectory for GitHub Pages deployment. It automatically handles all files
 * from the public folder and the build/assets directories.
 */

import { cpSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const projectRoot = join(__dirname, '..');
const distRoot = join(projectRoot, 'dist');
const publicDir = join(projectRoot, 'public');
const targetDir = join(distRoot, 'qwik-lens');

// Directories to copy
const dirsToCopy = ['build', 'assets'];

/**
 * Copy a file or directory recursively
 */
function copyRecursive(source, destination) {
  try {
    cpSync(source, destination, { recursive: true, force: true });
    console.log(`✓ Copied: ${source} → ${destination}`);
  } catch (error) {
    console.error(`✗ Failed to copy ${source}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Running post-deployment script...\n');

  // Check if target directory exists
  if (!existsSync(targetDir)) {
    console.error(`✗ Target directory does not exist: ${targetDir}`);
    console.error('  Make sure to run the build.server script first!');
    process.exit(1);
  }

  // Copy build and assets directories
  console.log('📦 Copying build directories...');
  for (const dir of dirsToCopy) {
    const source = join(distRoot, dir);
    const destination = join(targetDir, dir);
    
    if (existsSync(source)) {
      copyRecursive(source, destination);
    } else {
      console.warn(`⚠ Directory not found, skipping: ${source}`);
    }
  }

  // Copy all files from public directory
  console.log('\n📄 Copying public files...');
  if (existsSync(publicDir)) {
    const publicFiles = readdirSync(publicDir);
    
    for (const file of publicFiles) {
      const sourcePath = join(publicDir, file);
      const stat = statSync(sourcePath);
      
      // Only copy files, not directories
      if (stat.isFile()) {
        const destPath = join(targetDir, file);
        copyRecursive(sourcePath, destPath);
      }
    }
  } else {
    console.warn('⚠ Public directory not found, skipping public files');
  }

  // Also check for any JSON files at dist root (in case they're generated)
  console.log('\n📋 Checking for generated files at dist root...');
  if (existsSync(distRoot)) {
    const distFiles = readdirSync(distRoot);
    const jsonFiles = distFiles.filter(f => f.endsWith('.json') && statSync(join(distRoot, f)).isFile());
    
    for (const file of jsonFiles) {
      const sourcePath = join(distRoot, file);
      const destPath = join(targetDir, file);
      
      // Only copy if it doesn't already exist (avoid overwriting)
      if (!existsSync(destPath)) {
        copyRecursive(sourcePath, destPath);
      }
    }
  }

  console.log('\n✅ Post-deployment complete!\n');
}

// Run the script
main();
