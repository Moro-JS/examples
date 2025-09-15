#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findExampleDirectories } = require('./utils');

console.log('🧹 Preparing examples for Git commit...\n');

const examples = findExampleDirectories();

console.log(`Found ${examples.length} examples:`);
examples.forEach(example => console.log(`  • ${example}`));
console.log('');

function cleanPackageJson(examplePath) {
  const packageJsonPath = path.join(examplePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let modified = false;

  // Set @morojs/moro to "latest" if it exists
  if (packageJson.dependencies && packageJson.dependencies['@morojs/moro']) {
    packageJson.dependencies['@morojs/moro'] = 'latest';
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return true;
  }

  return false;
}

function cleanTsConfig(examplePath) {
  const tsConfigPath = path.join(examplePath, 'tsconfig.json');

  if (!fs.existsSync(tsConfigPath)) {
    return false;
  }

  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    let modified = false;

    // Remove path mappings that point to local development files
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      const paths = tsConfig.compilerOptions.paths;

      // Remove mappings for @morojs/moro, moro, and moro/*
      if (paths['@morojs/moro']) {
        delete paths['@morojs/moro'];
        modified = true;
      }
      if (paths['moro']) {
        delete paths['moro'];
        modified = true;
      }
      if (paths['moro/*']) {
        delete paths['moro/*'];
        modified = true;
      }

      // If paths object is now empty, remove it entirely
      if (Object.keys(paths).length === 0) {
        delete tsConfig.compilerOptions.paths;
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      return true;
    }
  } catch (error) {
    console.log(`   Warning: Could not clean tsconfig.json - ${error.message}`);
  }

  return false;
}

function removeFileOrDir(filePath, description) {
  if (fs.existsSync(filePath)) {
    try {
      if (fs.statSync(filePath).isDirectory()) {
        execSync(`rm -rf "${filePath}"`);
      } else {
        execSync(`rm -f "${filePath}"`);
      }
      return true;
    } catch (error) {
      console.log(`   Warning: Could not remove ${description} - ${error.message}`);
      return false;
    }
  }
  return false;
}

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

  console.log(`🧹 Cleaning ${example}...`);

  try {
    let cleaned = false;

    // Clean package.json - set moro to "latest"
    const packageCleaned = cleanPackageJson(examplePath);
    if (packageCleaned) {
      console.log(`   ✓ Set @morojs/moro to "latest" in package.json`);
      cleaned = true;
    }

    // Clean tsconfig.json - remove local path mappings
    const tsConfigCleaned = cleanTsConfig(examplePath);
    if (tsConfigCleaned) {
      console.log(`   ✓ Removed local path mappings from tsconfig.json`);
      cleaned = true;
    }

    // Remove node_modules
    const nodeModulesPath = path.join(examplePath, 'node_modules');
    const nodeModulesRemoved = removeFileOrDir(nodeModulesPath, 'node_modules');
    if (nodeModulesRemoved) {
      console.log(`   ✓ Removed node_modules directory`);
      cleaned = true;
    }

    // Remove package-lock.json
    const lockfilePath = path.join(examplePath, 'package-lock.json');
    const lockfileRemoved = removeFileOrDir(lockfilePath, 'package-lock.json');
    if (lockfileRemoved) {
      console.log(`   ✓ Removed package-lock.json`);
      cleaned = true;
    }

    // Remove any dist directories
    const distPath = path.join(examplePath, 'dist');
    const distRemoved = removeFileOrDir(distPath, 'dist directory');
    if (distRemoved) {
      console.log(`   ✓ Removed dist directory`);
      cleaned = true;
    }

    if (cleaned) {
      console.log(`✅ ${example} - Cleaned for Git`);
    } else {
      console.log(`✨ ${example} - Already clean`);
    }
    successCount++;
  } catch (error) {
    console.log(`❌ ${example} - Failed to clean`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🧹 Git preparation complete!`);
console.log(`✅ Success: ${successCount} examples`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
}

console.log('\n📝 All examples are now ready for Git commit:');
console.log('   • @morojs/moro set to "latest"');
console.log('   • Local development artifacts removed');
console.log('   • Package locks and node_modules cleaned');
console.log('\n💡 Remember to run "npm run switch:local" after pull to resume development');
