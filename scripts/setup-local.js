#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up MoroJS Examples for LOCAL DEVELOPMENT...\n');

// Check if MoroJS framework exists
const moroJSPath = path.resolve('../MoroJS');
if (!fs.existsSync(moroJSPath)) {
  console.log('❌ MoroJS framework not found at expected path: ../MoroJS');
  console.log('   Make sure the MoroJS repository is cloned at the correct location.');
  process.exit(1);
}

console.log(`✅ Found MoroJS framework at: ${moroJSPath}\n`);

const examples = [
  'simple-api',
  'enterprise-app',
  'enterprise-events',
  'feature-showcase',
  'runtime-examples',
  'real-time-chat',
  'ecommerce-api',
  'microservice/user-service',
  'microservice/order-service',
  'microservice/payment-service',
];

function updatePackageJsonForLocal(examplePath, depth = 2) {
  const packageJsonPath = path.join(examplePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Update @morojs/moro dependency to use local file
  const localPath = depth === 3 ? '../../../MoroJS' : '../../MoroJS';

  if (packageJson.dependencies && packageJson.dependencies['@morojs/moro']) {
    packageJson.dependencies['@morojs/moro'] = `file:${localPath}`;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return true;
  }

  return false;
}

let successCount = 0;
let errorCount = 0;

for (const example of examples) {
  const examplePath = path.join(process.cwd(), example);

  if (!fs.existsSync(examplePath)) {
    console.log(`⚠️  Skipping ${example} - directory not found`);
    continue;
  }

  console.log(`🔧 Setting up ${example} for local development...`);

  try {
    // Determine depth for relative path
    const depth = example.includes('/') ? 3 : 2;

    // Update package.json to use local file reference
    const updated = updatePackageJsonForLocal(examplePath, depth);

    if (!updated) {
      console.log(`⚠️  ${example} - No @morojs/moro dependency found to update`);
      continue;
    }

    // Remove node_modules to force fresh install
    const nodeModulesPath = path.join(examplePath, 'node_modules');
    const lockfilePath = path.join(examplePath, 'package-lock.json');

    if (fs.existsSync(nodeModulesPath)) {
      execSync(`rm -rf "${nodeModulesPath}"`, { cwd: examplePath });
    }

    if (fs.existsSync(lockfilePath)) {
      execSync(`rm -f "${lockfilePath}"`, { cwd: examplePath });
    }

    // Install with local reference
    execSync('npm install', {
      cwd: examplePath,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    console.log(`✅ ${example} - Configured for local development`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${example} - Failed to setup local development`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 Local development setup complete!`);
console.log(`✅ Success: ${successCount} examples`);
if (errorCount > 0) {
  console.log(`❌ Errors: ${errorCount} examples`);
}

console.log('\n🔧 All examples now use local MoroJS framework');
console.log('⚡ Changes to the framework will be reflected immediately!');
console.log('\n💡 To switch back to npm packages, run: npm run setup:npm');
