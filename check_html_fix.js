const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// simple regex to find unclosed vue bindings or obvious syntax errors in script setup
try {
  let match = html.match(/<script>([\s\S]*?)<\/script>/); // The file uses <script> instead of <script setup> possibly?
  if(!match) match = html.match(/<script setup>([\s\S]*?)<\/script>/);
  if(match) {
      new Function(match[1]);
      console.log("Script syntax is valid.");
  } else {
      console.log("No script tag found.");
  }
} catch (e) {
  console.error("Syntax Error in script:", e);
}
