const valStrs = ["0%", "1%", "50%", "100%", "0", "1", "100", "0.0", "1.0", "0.5"];

valStrs.forEach(valStr => {
    let isComplete = false;
    const strictMatch = valStr === "100" || valStr === "100%" || valStr.toUpperCase() === "SI";
    if (strictMatch) {
        isComplete = true;
    } else if (valStr) {
        const cleanVal = valStr.replace('%', '').replace(',', '.').trim();
        const num = parseFloat(cleanVal);
        if (!isNaN(num) && Math.abs(num - 100) < 0.01) {
            isComplete = true;
        }
    }
    console.log(`Value '${valStr}' isComplete: ${isComplete}`);
});
