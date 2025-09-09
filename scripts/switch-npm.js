#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 Switching all examples to NPM mode (GitHub-ready)...\n');

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

let successCount = 0;
let errorCount = 0;

for (const example of examples) {
  const examplePath = path.join(process.cwd(), example);
  const packageJsonPath = path.join(examplePath, 'package.json');

  if (!fs.existsSync(examplePath)) {
    console.log(`⚠️  Skipping ${example} - directory not found`);
    continue;
  }

  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  Skipping ${example} - no package.json found`);
    continue;
  }

  // Check if example has switch:npm script
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const switchScript = packageJson.scripts && packageJson.scripts['switch:npm'];

  if (!switchScript) {
    console.log(`⚠️  Skipping ${example} - no switch:npm script found`);
    continue;
  }

  console.log(`🔄 Switching ${example} to NPM mode...`);

  try {
    // Remove node_modules and package-lock.json to ensure clean install
    const nodeModulesPath = path.join(examplePath, 'node_modules');
    const lockfilePath = path.join(examplePath, 'package-lock.json');

    if (fs.existsSync(nodeModulesPath)) {
      execSync(`rm -rf "${nodeModulesPath}"`, { cwd: examplePath });
    }

    if (fs.existsSync(lockfilePath)) {
      execSync(`rm -f "${lockfilePath}"`, { cwd: examplePath });
    }

    // Install @morojs/moro from npm
    execSync('npm install @morojs/moro@latest', {
      cwd: examplePath,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    console.log(`✅ ${example} - Switched to NPM mode successfully`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${example} - Failed to switch to NPM mode`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 NPM mode switch complete!`);
console.log(`✅ Success: ${successCount} examples`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
}

console.log('\n📚 All examples are now using @morojs/moro from npm');
console.log('🚀 Ready for public GitHub repository!');
console.log('\n💡 To switch back to local development, run: npm run switch:local');
