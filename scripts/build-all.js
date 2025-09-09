#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building all examples...\n');

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
  'microservice/payment-service'
];

let successCount = 0;
let errorCount = 0;
let skippedCount = 0;

for (const example of examples) {
  const examplePath = path.join(process.cwd(), example);
  const packageJsonPath = path.join(examplePath, 'package.json');
  const tsconfigPath = path.join(examplePath, 'tsconfig.json');
  
  if (!fs.existsSync(examplePath)) {
    console.log(`⚠️  Skipping ${example} - directory not found`);
    skippedCount++;
    continue;
  }

  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  Skipping ${example} - no package.json found`);
    skippedCount++;
    continue;
  }

  if (!fs.existsSync(tsconfigPath)) {
    console.log(`⚠️  Skipping ${example} - no tsconfig.json found`);
    skippedCount++;
    continue;
  }

  // Check if example has build script
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const buildScript = packageJson.scripts && packageJson.scripts.build;
  
  if (!buildScript) {
    console.log(`⏭️  Skipping ${example} - no build script configured`);
    skippedCount++;
    continue;
  }

  console.log(`🔨 Building ${example}...`);
  
  try {
    execSync('npm run build', { 
      cwd: examplePath, 
      stdio: ['inherit', 'pipe', 'pipe'] 
    });
    
    console.log(`✅ ${example} - Build successful`);
    successCount++;
    
  } catch (error) {
    console.log(`❌ ${example} - Build failed`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 Build complete!`);
console.log(`✅ Success: ${successCount} examples`);
console.log(`⏭️  Skipped: ${skippedCount} examples (no build script or missing files)`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
  process.exit(1);
}

console.log('🚀 All builds completed successfully!'); 