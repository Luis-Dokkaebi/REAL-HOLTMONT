const fs = require('fs');
const code = fs.readFileSync('CODIGO.js', 'utf8');

const regex = /if \(!isAntonia && distributionTasks\.length > 0\) \{([\s\S]*?)registrarLog/g;
let match;
while ((match = regex.exec(code)) !== null) {
    console.log(match[0].substring(0, 500));
}
