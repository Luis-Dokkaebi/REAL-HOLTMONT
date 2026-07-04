const fs = require('fs');
let code = fs.readFileSync('CODIGO.js', 'utf8');

// We want to replace this exact block:
// } else if (typeof rawVal === 'number' && Math.abs(rawVal - 1) < 0.001) {
//     // Handles Google Sheets native 100% (1.0) percentage formatting
//     isComplete = true;
// }

const regex = /\} else if \(typeof rawVal === 'number' && Math\.abs\(rawVal - 1\) < 0\.001\) \{\s*\/\/[^\n]*\n\s*isComplete = true;\s*\}/g;

if (regex.test(code)) {
    code = code.replace(regex, '}'); // replace the removed closing bracket from the previous IF!
    fs.writeFileSync('CODIGO.js', code);
    console.log("Patched CODIGO.js successfully!");
} else {
    console.log("Regex didn't match.");
}
