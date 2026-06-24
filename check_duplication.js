const fs = require('fs');

const code = fs.readFileSync('CODIGO.js', 'utf8');
const processed = [];
let idx = 0;
while ((idx = code.indexOf('internalBatchUpdateTasks(', idx)) !== -1) {
  const endIdx = code.indexOf(';', idx);
  processed.push(code.substring(idx, endIdx + 1));
  idx = endIdx;
}
console.log('Calls to internalBatchUpdateTasks:');
processed.forEach(p => console.log(p.trim()));
