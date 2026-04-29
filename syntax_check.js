const fs = require('fs');
const acorn = require('acorn');

const html = fs.readFileSync('index.html', 'utf8');
const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

try {
  acorn.parse(scriptContent, { ecmaVersion: 2022 });
  console.log("Syntax is OK");
} catch (e) {
  console.error("Syntax error:", e);
}
