let rawVal = "1";
let isComplete = false;
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
console.log(`Value '${rawVal}' isComplete: ${isComplete}`);

rawVal = 1;
isComplete = false;
const valStr2 = String(rawVal || "").trim();
const strictMatch2 = valStr2 === "100" || valStr2 === "100%" || valStr2.toUpperCase() === "SI";
if (strictMatch2) {
    isComplete = true;
} else if (valStr2) {
    const cleanVal = valStr2.replace('%', '').replace(',', '.').trim();
    const num = parseFloat(cleanVal);
    if (!isNaN(num) && Math.abs(num - 100) < 0.01) {
        isComplete = true;
    } else if (typeof rawVal === 'number' && Math.abs(rawVal - 1) < 0.001) {
        isComplete = true;
    }
}
console.log(`Value '${rawVal}' isComplete: ${isComplete}`);
