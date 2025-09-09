#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning all examples...\n');

const examples = [
  'simple-api',
  'enterprise-app',
  'enterprise-events',
  'feature-showcase',
  'runtime-examples',
  'real-time-chat',
  'ecommerce-api',
  'mcp-server',
  'microservice/user-service',
  'microservice/order-service',
  'microservice/payment-service',
];

let cleanedCount = 0;
let skippedCount = 0;

// Clean root directory first
console.log('🧹 Cleaning root directory...');
try {
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  if (fs.existsSync('package-lock.json')) {
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  }
  console.log('✅ Root directory cleaned');
} catch (error) {
  console.log('❌ Failed to clean root directory');
}

for (const example of examples) {
  const examplePath = path.join(process.cwd(), example);

  if (!fs.existsSync(examplePath)) {
    console.log(`⚠️  Skipping ${example} - directory not found`);
    skippedCount++;
    continue;
  }

  console.log(`🧹 Cleaning ${example}...`);

  try {
    const nodeModulesPath = path.join(examplePath, 'node_modules');
    const packageLockPath = path.join(examplePath, 'package-lock.json');
    const distPath = path.join(examplePath, 'dist');
    const buildPath = path.join(examplePath, 'build');

    // Remove node_modules
    if (fs.existsSync(nodeModulesPath)) {
      execSync('rm -rf node_modules', { cwd: examplePath, stdio: 'inherit' });
    }

    // Remove package-lock.json
    if (fs.existsSync(packageLockPath)) {
      execSync('rm -f package-lock.json', { cwd: examplePath, stdio: 'inherit' });
    }

    // Remove dist directory
    if (fs.existsSync(distPath)) {
      execSync('rm -rf dist', { cwd: examplePath, stdio: 'inherit' });
    }

    // Remove build directory
    if (fs.existsSync(buildPath)) {
      execSync('rm -rf build', { cwd: examplePath, stdio: 'inherit' });
    }

    console.log(`✅ ${example} - Cleaned successfully`);
    cleanedCount++;
  } catch (error) {
    console.log(`❌ ${example} - Clean failed`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 Cleaning complete!`);
console.log(`✅ Cleaned: ${cleanedCount} examples`);
console.log(`⏭️  Skipped: ${skippedCount} examples (directory not found)`);
console.log('🚀 All build artifacts and dependencies removed!');
