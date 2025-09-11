#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findExampleDirectories } = require('./utils');

console.log('📦 Installing dependencies for all examples...\n');

const examples = findExampleDirectories();

console.log(`Found ${examples.length} examples:`);
examples.forEach(example => console.log(`  • ${example}`));
console.log('');

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
    // Remove package-lock.json to ensure fresh install with latest versions
    const lockfilePath = path.join(examplePath, 'package-lock.json');
    if (fs.existsSync(lockfilePath)) {
      fs.unlinkSync(lockfilePath);
    }

    execSync('npm install', {
      cwd: examplePath,
      stdio: ['inherit', 'pipe', 'pipe'],
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
console.log(`🎉 Installation complete!`);
console.log(`✅ Success: ${successCount} examples`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
}
