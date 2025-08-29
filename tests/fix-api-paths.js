const fs = require('fs');
const path = require('path');

// Function to recursively find all test files
function findTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (item.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// API endpoint mappings
const endpointMappings = [
  ['/auth/', '/api/auth/'],
  ['/users/', '/api/users/'],
  ['/vehicles/', '/api/vehicles/'],
  ['/races/', '/api/races/'],
  ['/meetups/', '/api/meetups/'],
  ['/friends/', '/api/friends/'],
  ['/uploads/', '/api/uploads/'],
  ['/ai/', '/api/ai/']
];

// Find all test files
const testDir = path.join(__dirname);
const testFiles = findTestFiles(testDir);

console.log(`Found ${testFiles.length} test files to update:`);

let totalReplacements = 0;

for (const file of testFiles) {
  console.log(`\\nProcessing: ${path.relative(testDir, file)}`);
  
  let content = fs.readFileSync(file, 'utf8');
  let fileReplacements = 0;
  
  for (const [oldPath, newPath] of endpointMappings) {
    const regex = new RegExp(`'${oldPath.replace('/', '\\/')}`, 'g');
    const matches = content.match(regex) || [];
    
    if (matches.length > 0) {
      content = content.replace(regex, `'${newPath}`);
      fileReplacements += matches.length;
      console.log(`  ✅ Replaced ${matches.length} instances of '${oldPath}' with '${newPath}'`);
    }
  }
  
  if (fileReplacements > 0) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplacements += fileReplacements;
    console.log(`  📝 Updated ${fileReplacements} endpoints in file`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
}

console.log(`\\n🎉 Complete! Updated ${totalReplacements} API endpoints across ${testFiles.length} test files.`);
console.log('All test files now use the correct /api prefix for backend routes.');