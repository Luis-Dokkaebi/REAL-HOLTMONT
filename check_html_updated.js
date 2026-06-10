const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// simple regex to find unclosed vue bindings or obvious syntax errors in script setup
try {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (match) {
    const scriptContent = match[1];
    new Function(scriptContent);
    console.log("Script setup syntax is valid.");
  } else {
    console.log("No <script> block found.");
  }
} catch (e) {
  console.error("Syntax Error in script setup:", e);
}
