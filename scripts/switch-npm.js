#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findExampleDirectories } = require('./utils');

console.log('🎯 Switching all examples to NPM mode (GitHub-ready)...\n');
// Always use latest for better compatibility
const latestVersion = 'latest';
// Get latest version from npm
// let latestVersion;
// try {
//   latestVersion = execSync('npm view @morojs/moro version', { encoding: 'utf8' }).trim();
//   console.log(`📦 Latest MoroJS version: ${latestVersion}\n`);
// } catch (error) {
//   console.log('⚠️  Could not fetch latest version, using @latest tag\n');
//   latestVersion = 'latest';
// }
console.log(`📦 Using MoroJS version: ${latestVersion}\n`);

const examples = findExampleDirectories();

console.log(`Found ${examples.length} examples:`);
examples.forEach(example => console.log(`  • ${example}`));
console.log('');

function updateTsConfigForNpm(examplePath) {
  const tsConfigPath = path.join(examplePath, 'tsconfig.json');

  if (!fs.existsSync(tsConfigPath)) {
    return false;
  }

  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

    // Remove path mappings that point to local development files
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      const paths = tsConfig.compilerOptions.paths;
      let modified = false;

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

      if (modified) {
        fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
        return true;
      }
    }
  } catch (error) {
    console.log(`   Warning: Could not update tsconfig.json - ${error.message}`);
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

    // Update TypeScript configuration to remove path mappings
    const tsConfigUpdated = updateTsConfigForNpm(examplePath);
    if (tsConfigUpdated) {
      console.log(`   ✓ Updated tsconfig.json to use npm packages`);
    }

    // Install @morojs/moro from npm
    execSync(`npm install @morojs/moro@${latestVersion}`, {
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
