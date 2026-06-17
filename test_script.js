const fs = require('fs');

const code = fs.readFileSync('CODIGO.js', 'utf8');
const testCases = ["RESPONSABLE", "INVOLUCRADOS", "VENDEDOR"];

let allOk = true;
testCases.forEach(c => {
    let re = new RegExp(`k\\.toUpperCase\\(\\)\\.trim\\(\\) === "${c}"`);
    if (!re.test(code)) {
        console.error(`Not found check for ${c}`);
        allOk = false;
    }
});
if(allOk) console.log("All checks look good.");
