const fs = require('fs');
const content = fs.readFileSync('CODIGO.js', 'utf8');
const lines = content.split('\n');

for (let i = 2470; i < 2510; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
