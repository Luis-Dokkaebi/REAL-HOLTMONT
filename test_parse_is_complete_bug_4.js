const fs = require('fs');
const content = fs.readFileSync('CODIGO.js', 'utf8');

const regex = /isComplete = true;/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found isComplete = true at index ${match.index}`);
}
