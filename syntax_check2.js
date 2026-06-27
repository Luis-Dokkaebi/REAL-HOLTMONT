const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

try {
  new Function(scriptContent);
  console.log("No syntax errors found by Function constructor.");
} catch (e) {
  console.error("Syntax error in script block:", e);
}
