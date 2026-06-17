const fs = require('fs');

try {
  const code = fs.readFileSync('CODIGO.js', 'utf8');
  // Attempt to parse to check for syntax errors
  new Function(code);
  console.log("No syntax errors.");
} catch (e) {
  console.error("Syntax Error:", e);
}
