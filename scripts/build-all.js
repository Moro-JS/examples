#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findExampleDirectories, hasScript } = require('./utils');

console.log('🏗️ Building all examples...\n');

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

  // Check if example has build script
  if (!hasScript(examplePath, 'build')) {
    console.log(`⏭️  Skipping ${example} - no build script configured`);
    skippedCount++;
    continue;
  }

  console.log(`🏗️ Building ${example}...`);

  try {
    execSync('npm run build', {
      cwd: examplePath,
      stdio: ['inherit', 'pipe', 'pipe'],
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
console.log(`⏭️  Skipped: ${skippedCount} examples (no build script)`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
  process.exit(1);
}

console.log('\n🚀 All builds completed successfully!');
