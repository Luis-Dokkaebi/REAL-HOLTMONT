const fs = require('fs');
const code = fs.readFileSync('CODIGO.js', 'utf-8');

const regex = /function deduplicateAllSheets[\s\S]*?}/;
const match = code.match(regex);
console.log(match ? match[0] : "Not found");
