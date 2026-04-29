const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// simple regex to find unclosed vue bindings or obvious syntax errors in script setup
try {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  console.log("Found script content, length:", scriptContent.length);
  // Just parsing it
} catch (e) {
  console.error("Error:", e);
}
