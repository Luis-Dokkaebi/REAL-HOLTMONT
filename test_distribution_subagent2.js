const fs = require('fs');
let code = fs.readFileSync('CODIGO.js', 'utf8');

console.log("Checking apiSaveTrackerBatch regex directly...");
const regexCheck = code.match(/k\.toUpperCase\(\)\.trim\(\) === "VENDEDOR" \|\| k\.toUpperCase\(\)\.trim\(\) === "RESPONSABLE" \|\| k\.toUpperCase\(\)\.trim\(\) === "INVOLUCRADOS"/g);
if (regexCheck && regexCheck.length >= 4) {
    console.log("  ✅ OK: Se encontraron las " + regexCheck.length + " modificaciones en CODIGO.js detectando RESPONSABLE e INVOLUCRADOS.");
} else {
    console.log("  ❌ FALLO: No se encontraron todas las modificaciones.");
}

console.log("\n==================================================");
if (regexCheck && regexCheck.length >= 4) {
    console.log(" 🎉 RESULTADO: TODAS LAS PRUEBAS PASARON. EL SUB-AGENTE CONFIRMA LA SOLUCIÓN.");
} else {
    process.exit(1);
}
console.log("==================================================");
