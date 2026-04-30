const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// simple regex to find unclosed vue bindings or obvious syntax errors in script setup
try {
  const scriptContent = html.match(/<script setup>([\s\S]*?)<\/script>/)[1];
  new Function(scriptContent);
  console.log("Script setup syntax is valid.");
} catch (e) {
  console.error("Syntax Error in script setup:", e);
}
