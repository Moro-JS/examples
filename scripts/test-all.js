#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findExampleDirectories, hasScript } = require('./utils');

console.log('🧪 Running tests for all examples...\n');

const examples = findExampleDirectories();

console.log(`Found ${examples.length} examples:`);
examples.forEach(example => console.log(`  • ${example}`));
console.log('');

let successCount = 0;
let errorCount = 0;
let skippedCount = 0;

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

  // Check if example has test script
  if (!hasScript(examplePath, 'test')) {
    console.log(`⏭️  Skipping ${example} - no tests configured`);
    skippedCount++;
    continue;
  }

  console.log(`🧪 Running tests for ${example}...`);

  try {
    execSync('npm test', {
      cwd: examplePath,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    console.log(`✅ ${example} - Tests passed`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${example} - Tests failed`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 Testing complete!`);
console.log(`✅ Success: ${successCount} examples`);
console.log(`⏭️  Skipped: ${skippedCount} examples (no tests configured)`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
}
