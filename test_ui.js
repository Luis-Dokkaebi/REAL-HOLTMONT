const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(indexHtml);
const document = dom.window.document;

// Verify there is no direct MAP COT column block
const htmlStr = document.body.innerHTML;
console.log("Found direct MAP COT div:", htmlStr.includes('v-else-if="isCol(h, [\'MAP COT\', \'PROCESO\'])"'));

// Look for our injected map cot logic inside ESTATUS block
const matches = htmlStr.match(/v-else-if="isCol\(h, \['ESTATUS','STATUS'\]\)"([\s\S]*?)<\/div>\s*<div v-else-if="isCol\(h, \['REQUISITOR'\]\)"/);

if(matches) {
   console.log("Found the ESTATUS block.");
   const estatusInner = matches[1];
   console.log("Has timeline container inside ESTATUS?", estatusInner.includes('hp-timeline-container'));
} else {
   console.log("Could not find the modified ESTATUS block via regex.");
}
