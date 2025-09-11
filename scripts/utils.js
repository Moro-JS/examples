const fs = require('fs');
const path = require('path');

/**
 * Find all directories with package.json files
 * @param {string} rootDir - Root directory to search from
 * @returns {string[]} Array of example directory paths
 */
function findExampleDirectories(rootDir = process.cwd()) {
  const examples = [];

  // Get all items in the root directory
  const items = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      const dirPath = path.join(rootDir, item.name);
      const packageJsonPath = path.join(dirPath, 'package.json');

      // Skip certain directories
      if (['node_modules', '.git', 'scripts', 'logs', 'dist', 'build'].includes(item.name)) {
        continue;
      }

      // If directory has package.json, check if it's a real example or a container
      if (fs.existsSync(packageJsonPath)) {
        // Special case: microservice directory contains both a package.json AND subdirectories with examples
        if (item.name === 'microservice') {
          // Check for nested microservice examples
          try {
            const subItems = fs.readdirSync(dirPath, { withFileTypes: true });
            let hasSubExamples = false;

            for (const subItem of subItems) {
              if (subItem.isDirectory()) {
                const subDirPath = path.join(dirPath, subItem.name);
                const subPackageJsonPath = path.join(subDirPath, 'package.json');

                // Skip common non-example directories
                if (
                  ['node_modules', '.git', 'dist', 'build', 'logs', 'k8s'].includes(subItem.name)
                ) {
                  continue;
                }

                if (fs.existsSync(subPackageJsonPath)) {
                  examples.push(`${item.name}/${subItem.name}`);
                  hasSubExamples = true;
                }
              }
            }

            // Only add the parent if no sub-examples were found
            if (!hasSubExamples) {
              examples.push(item.name);
            }
          } catch (error) {
            // If we can't read subdirectories, treat as single example
            examples.push(item.name);
          }
        } else {
          // Regular directory with package.json
          examples.push(item.name);
        }
      } else {
        // Check for nested examples (like other potential container directories)
        try {
          const subItems = fs.readdirSync(dirPath, { withFileTypes: true });
          for (const subItem of subItems) {
            if (subItem.isDirectory()) {
              const subDirPath = path.join(dirPath, subItem.name);
              const subPackageJsonPath = path.join(subDirPath, 'package.json');

              // Skip common non-example directories
              if (['node_modules', '.git', 'dist', 'build', 'logs'].includes(subItem.name)) {
                continue;
              }

              if (fs.existsSync(subPackageJsonPath)) {
                examples.push(`${item.name}/${subItem.name}`);
              }
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      }
    }
  }

  return examples.sort(); // Sort alphabetically for consistent output
}

/**
 * Check if an example has a specific script in package.json
 * @param {string} examplePath - Path to the example directory
 * @param {string} scriptName - Name of the script to check for
 * @returns {boolean} True if script exists and is not a placeholder
 */
function hasScript(examplePath, scriptName) {
  const packageJsonPath = path.join(examplePath, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const script = packageJson.scripts && packageJson.scripts[scriptName];

    if (!script) {
      return false;
    }

    // Check for placeholder scripts
    const placeholders = ['echo', 'No tests', 'No build'];
    return !placeholders.some(placeholder => script.includes(placeholder));
  } catch (error) {
    return false;
  }
}

module.exports = {
  findExampleDirectories,
  hasScript,
};
