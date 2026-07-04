const vals = [0, 1, 0.5, 100, "0%", "100%", "1%", "50%"];

vals.forEach(rawVal => {
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
});
