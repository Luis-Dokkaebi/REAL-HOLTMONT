const esprima = require('esprima');
const fs2 = require('fs');

try {
  const code = fs2.readFileSync('CODIGO.js', 'utf8');
  esprima.parseScript(code);
  console.log("No syntax errors in CODIGO.js");
} catch (e) {
  console.log("Syntax error in CODIGO.js:", e.message);
}
