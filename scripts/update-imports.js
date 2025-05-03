#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findFiles(dir, extension, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findFiles(fullPath, extension, files);
    } else if (stat.isFile() && item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function updateImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Update import statements
  const patterns = [
    /from ['"]moro['"]/g,
    /import.*from ['"]moro['"]/g
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match) => {
        updated = true;
        return match.replace("'moro'", "'@morojs/moro'").replace('"moro"', '"@morojs/moro"');
      });
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  }
}

console.log('🔄 Updating imports from "moro" to "@morojs/moro"...\n');

// Find all TypeScript files
const tsFiles = findFiles(process.cwd(), '.ts');
let updatedCount = 0;

for (const file of tsFiles) {
  const originalContent = fs.readFileSync(file, 'utf8');
  updateImports(file);
  const newContent = fs.readFileSync(file, 'utf8');
  
  if (originalContent !== newContent) {
    updatedCount++;
  }
}

console.log(`\n✨ Updated ${updatedCount} files with new import statements!`);
console.log('📦 Remember to run "npm install" in each example to install @morojs/moro from npm.'); 