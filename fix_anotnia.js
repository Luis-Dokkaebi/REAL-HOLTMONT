const fs = require('fs');

let code = fs.readFileSync('CODIGO.js', 'utf8');

code = code.replace(
    /const v = clean\(taskData\['VENDEDOR'\]\);/,
    `const vk = Object.keys(taskData).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
                 const v = vk ? clean(taskData[vk]) : "";`
);

fs.writeFileSync('CODIGO.js', code);
