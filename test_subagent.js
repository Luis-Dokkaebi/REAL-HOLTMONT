const fs = require('fs');
const vm = require('vm');

// Extract the needed functions from CODIGO.js
const code = fs.readFileSync('CODIGO.js', 'utf8');

// We will test if the lateral distribution logic captures fields like RESPONSABLE and INVOLUCRADOS as well as VENDEDOR.
const regex = /const vKey = Object\.keys\(t\)\.find\(k => k\.toUpperCase\(\)\.trim\(\) === "VENDEDOR"\);/g;
const match = code.match(regex);
console.log("Matches found:", match ? match.length : 0);
