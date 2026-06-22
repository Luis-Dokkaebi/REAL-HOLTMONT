console.log("The issue says: 'Analiza el codigo y dime porque cuando ANTONIA_VENTAS guarda tareas desaparecen de su tabla, necesito una explicación y que se corrija'");

console.log("Looking at internalBatchUpdateTasks in CODIGO.js (around line 2011), the AVANCE field check is:");
console.log(`
            // FIX ROBUSTO: Detección de 100% (Soporta "100,0", "100.0", "1", "1.0")
            let isComplete = false;
            const strictMatch = val === "100" || val === "100%" || val === "1.0" || val === "1";

            if (strictMatch) {
                isComplete = true;
            } else {
                // Limpieza para formatos de moneda/porcentaje latinos (ej. "100,0")
                const cleanVal = val.replace('%', '').replace(',', '.').trim();
                const num = parseFloat(cleanVal);
                if (!isNaN(num)) {
                   // Comprobar si es 1 (Factor) o 100 (Entero)
                   if (Math.abs(num - 100) < 0.01 || Math.abs(num - 1) < 0.001) {
                       isComplete = true;
                   }
                }
            }
`);
console.log("If the user enters '1', strictMatch becomes true, and isComplete=true.");
console.log("And the memory clearly says: Evaluations against '1' or '1.0' are prohibited to prevent 1% progress inputs from incorrectly marking tasks as finished.");

console.log("So if someone inputs 1 for 1% progress, it gets evaluated as complete and archived (disappears from active table)!");
