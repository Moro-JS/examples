#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findExampleDirectories } = require('./utils');

console.log('🔧 Switching all examples to LOCAL DEVELOPMENT mode...\n');

// Check if MoroJS framework exists
const moroJSPath = path.resolve('../MoroJS');
if (!fs.existsSync(moroJSPath)) {
  console.log('❌ MoroJS framework not found at expected path: ../MoroJS');
  console.log('   Make sure the MoroJS repository is cloned at the correct location.');
  process.exit(1);
}

console.log(`✅ Found MoroJS framework at: ${moroJSPath}\n`);

const examples = findExampleDirectories();

console.log(`Found ${examples.length} examples:`);
examples.forEach(example => console.log(`  • ${example}`));
console.log('');

function updatePackageJsonForLocal(examplePath, example) {
  const packageJsonPath = path.join(examplePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Update @morojs/moro dependency to use local file
  // Calculate depth based on directory structure
  const depth = example.split('/').length;
  const localPath = depth === 1 ? '../../MoroJS' : '../../../MoroJS';

  if (packageJson.dependencies && packageJson.dependencies['@morojs/moro']) {
    packageJson.dependencies['@morojs/moro'] = `file:${localPath}`;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    return true;
  }

  return false;
}

function updateTsConfigForLocal(examplePath, example) {
  const tsConfigPath = path.join(examplePath, 'tsconfig.json');

  if (!fs.existsSync(tsConfigPath)) {
    return false;
  }

  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

    // Ensure compilerOptions exists
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
    }

    // Ensure baseUrl exists
    if (!tsConfig.compilerOptions.baseUrl) {
      tsConfig.compilerOptions.baseUrl = '.';
    }

    // Set up path mappings for local development
    // Calculate depth based on directory structure
    const depth = example.split('/').length;
    const localPath = depth === 1 ? '../../MoroJS/src/index.ts' : '../../../MoroJS/src/index.ts';

    if (!tsConfig.compilerOptions.paths) {
      tsConfig.compilerOptions.paths = {};
    }

    // Add path mapping for @morojs/moro to point to local source
    tsConfig.compilerOptions.paths['@morojs/moro'] = [localPath];

    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
    return true;
  } catch (error) {
    console.log(`   Warning: Could not update tsconfig.json - ${error.message}`);
    return false;
  }
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

  // Check if example has switch:local script
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const switchScript = packageJson.scripts && packageJson.scripts['switch:local'];

  if (!switchScript) {
    console.log(`⚠️  Skipping ${example} - no switch:local script found`);
    continue;
  }

  console.log(`🔄 Switching ${example} to LOCAL mode...`);

  try {
    // Update package.json to use local file reference
    const packageUpdated = updatePackageJsonForLocal(examplePath, example);

    if (!packageUpdated) {
      console.log(`⚠️  ${example} - No @morojs/moro dependency found to update`);
      continue;
    }

    // Update TypeScript configuration to use local path mappings
    const tsConfigUpdated = updateTsConfigForLocal(examplePath, example);
    if (tsConfigUpdated) {
      console.log(`   ✓ Updated tsconfig.json for local development`);
    }

    // Remove node_modules and package-lock.json to ensure clean install
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

    console.log(`✅ ${example} - Switched to LOCAL mode successfully`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${example} - Failed to switch to LOCAL mode`);
    console.log(`   Error: ${error.message.split('\n')[0]}`);
    errorCount++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`🎉 Local development mode switch complete!`);
console.log(`✅ Success: ${successCount} examples`);
if (errorCount > 0) {
  console.log(`❌ Failed: ${errorCount} examples`);
}

console.log('\n🔧 All examples now use local MoroJS framework');
console.log('⚡ Changes to the framework will be reflected immediately!');
console.log('\n💡 To switch back to npm packages, run: npm run switch:npm');
