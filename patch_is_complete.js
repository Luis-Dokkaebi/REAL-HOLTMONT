const fs = require('fs');
let code = fs.readFileSync('CODIGO.js', 'utf8');

const regex = /\} else if \(typeof rawVal === 'number' && Math\.abs\(rawVal - 1\) < 0\.001\) \{\s*\/\/[^\n]*\n\s*isComplete = true;\s*\}/g;

if (regex.test(code)) {
    code = code.replace(regex, '');
    fs.writeFileSync('CODIGO.js', code);
    console.log("Patched CODIGO.js successfully!");
} else {
    console.log("Regex didn't match.");
}
