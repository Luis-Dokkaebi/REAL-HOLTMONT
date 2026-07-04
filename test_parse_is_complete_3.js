const vals = [
    { estatus: "ASIGNADO", avance: "0%" },
    { estatus: "", avance: "" },
    { estatus: "HECHO", avance: "100" },
    { estatus: "EN CURSO", avance: "50%" },
    { estatus: undefined, avance: undefined },
    { estatus: " PENDIENTE ", avance: " " },
    { estatus: " PENDIENTE ", avance: "0" },
    { estatus: "ASIGNADO", avance: 0 },
    { estatus: "", avance: 1 },
];

vals.forEach(row => {
    let isComplete = false;
    const valEstatus = row.estatus ? String(row.estatus).toUpperCase().trim() : "";
    const doneStatuses = ['HECHO', 'TERMINADO', 'FINALIZADO', 'REALIZADO', 'COMPLETADO', 'DONE'];
    if (doneStatuses.includes(valEstatus)) {
        isComplete = true;
    }

    const rawVal = row.avance;
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
    console.log(`Row: ESTATUS=${row.estatus}, AVANCE=${row.avance} -> isComplete: ${isComplete}`);
});
