const fs = require('fs');
const code = fs.readFileSync('CODIGO.js', 'utf8');

const match = code.match(/hasTaskFolio[\s\S]*?hasTaskFolio/g);
console.log(match);
