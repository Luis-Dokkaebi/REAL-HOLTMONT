const fs = require('fs');
let code = fs.readFileSync('CODIGO.js', 'utf8');

// We need to add CLIENTE checking to the gatekeeper if it exists in the sheet.
const target = `
          const tConcept = String(task['CONCEPTO'] || task['DESCRIPCION'] || task['TAREA'] || "").trim().toUpperCase().substring(0, 50);
          const tDate = String(task['FECHA'] || task['F. INICIO'] || "").trim();

          if (tConcept) {
             const conceptIdx = getColIdx('CONCEPTO') > -1 ? getColIdx('CONCEPTO') : getColIdx('DESCRIPCION');
             const dateIdx = getColIdx('FECHA') > -1 ? getColIdx('FECHA') : getColIdx('F. INICIO');
`;

const replacement = `
          const tConcept = String(task['CONCEPTO'] || task['DESCRIPCION'] || task['TAREA'] || "").trim().toUpperCase().substring(0, 50);
          const tDate = String(task['FECHA'] || task['F. INICIO'] || "").trim();
          const tCliente = String(task['CLIENTE'] || "").trim().toUpperCase();

          if (tConcept) {
             const conceptIdx = getColIdx('CONCEPTO') > -1 ? getColIdx('CONCEPTO') : getColIdx('DESCRIPCION');
             const dateIdx = getColIdx('FECHA') > -1 ? getColIdx('FECHA') : getColIdx('F. INICIO');
             const clienteIdx = getColIdx('CLIENTE');
`;

const target2 = `
                     // RELAXED GATEKEEPER: If both dates are empty, or if they match, we consider it a duplicate
                     // Since new tasks might be sent without date and generated on the fly, a strict date match causes duplicates.
                     const isDateMatch = (cleanTDate === "" && cleanRowDate === "") ||
                                         ((cleanTDate !== "" && cleanRowDate !== "") && (cleanRowDate.includes(cleanTDate) || cleanTDate.includes(cleanRowDate)));

                     if (rowConcept === tConcept && isDateMatch) {
`;

const replacement2 = `
                     // RELAXED GATEKEEPER: If both dates are empty, or if they match, we consider it a duplicate
                     // Since new tasks might be sent without date and generated on the fly, a strict date match causes duplicates.
                     const isDateMatch = (cleanTDate === "" && cleanRowDate === "") ||
                                         ((cleanTDate !== "" && cleanRowDate !== "") && (cleanRowDate.includes(cleanTDate) || cleanTDate.includes(cleanRowDate)));

                     let isClienteMatch = true;
                     if (clienteIdx > -1 && tCliente) {
                         const rowCliente = String(row[clienteIdx] || "").trim().toUpperCase();
                         isClienteMatch = rowCliente === tCliente;
                     }

                     if (rowConcept === tConcept && isDateMatch && isClienteMatch) {
`;

code = code.replace(target, replacement);
code = code.replace(target2, replacement2);

fs.writeFileSync('CODIGO.js', code);
console.log("Patched Gatekeeper in CODIGO.js successfully!");
