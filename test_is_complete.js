const doneStatuses = ['HECHO', 'TERMINADO', 'FINALIZADO', 'REALIZADO', 'COMPLETADO', 'DONE'];
const valEstatus = "PENDIENTE";
let isComplete = false;

if (doneStatuses.includes(valEstatus)) {
    isComplete = true;
}

const rawVal = "0%";
const valStr = String(rawVal || "").trim();
const strictMatch = valStr === "100" || valStr === "100%" || valStr.toUpperCase() === "SI";
if (strictMatch) {
    isComplete = true;
} else if (valStr) {
    const cleanVal = valStr.replace('%', '').replace(',', '.').trim();
    const num = parseFloat(cleanVal);
    if (!isNaN(num) && Math.abs(num - 100) < 0.01) {
        isComplete = true;
    } else if (typeof rawVal === 'number' && Math.abs(rawVal - 1) < 0.001) {
        isComplete = true;
    }
}

console.log("isComplete:", isComplete);
