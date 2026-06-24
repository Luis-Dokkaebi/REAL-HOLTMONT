const fs = require('fs');
const code = fs.readFileSync('CODIGO.js', 'utf8');

const regex = /_tempId/g;
let count = 0;
while ((match = regex.exec(code)) !== null) {
    count++;
}
console.log('_tempId count in CODIGO.js:', count);
