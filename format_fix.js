const fs = require('fs');
let code = fs.readFileSync('CODIGO.js', 'utf8');

// The replacement above left `\n                    }` which breaks the bracket alignment slightly but is syntactically valid since the previous block ends with `}`.
// Let's ensure syntax is fine by running check_html.js or check_html2.js
