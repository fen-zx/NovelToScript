const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/33257/Downloads/吞噬星空 (1).yaml';
let content = fs.readFileSync(filePath, 'utf8');

// Fix: Add 2-space indent to each "- sceneNumber:" line (currently at column 0)
// Only match at line start, not inside strings
content = content.replace(/^(\s*)- sceneNumber:/gm, '  - sceneNumber:');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed! Added 2-space indent to all - sceneNumber: lines');

// Verify with yaml parser
const yaml = require('yaml');
try {
  yaml.parse(content);
  console.log('YAML is now valid!');
} catch(e) {
  console.log('Still has error:', e.message);
}
