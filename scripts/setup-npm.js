#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 Setting up MoroJS Examples for NPM usage (GitHub-ready)...\n');

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
  'microservice/payment-service'
];

let successCount = 0;
let errorCount = 0;

for (const example of examples) {
  const examplePath = path.join(process.cwd(), example);
  
  if (!fs.existsSync(examplePath)) {
    console.log(`⚠️  Skipping ${example} - directory not found`);
    continue;
  }

  console.log(`📦 Installing dependencies for ${example}...`);
  
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
    
    // Install from npm
    execSync('npm install', { 
      cwd: examplePath, 
      stdio: ['inherit', 'pipe', 'pipe'] 
    });
    
    console.log(`✅ ${example} - Dependencies installed successfully`);
    successCount++;
    
  } catch (error) {
    console.log(`❌ ${example} - Failed to install dependencies`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 Setup complete!`);
console.log(`✅ Success: ${successCount} examples`);
if (errorCount > 0) {
  console.log(`❌ Errors: ${errorCount} examples`);
}

console.log('\n📚 All examples are now using @morojs/moro from npm');
console.log('🚀 Ready for public GitHub repository!');
console.log('\n💡 To switch back to local development, run: npm run setup:local'); 