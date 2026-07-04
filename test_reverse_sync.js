const testData = {
    ESTATUS: "HECHO",
    FOLIO: "AV-1234",
    AVANCE: "100"
};

const getTVal = (keys) => {
    for (let k of keys) {
        let found = Object.keys(testData).find(key => key.toUpperCase().trim() === k);
        if (found && testData[found]) return testData[found];
    }
    return "";
};

const estatus = String(getTVal(['ESTATUS', 'STATUS', 'ESTADO'])).toUpperCase().trim();
const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'])).replace(/%/g, '').trim();
const avanceNum = parseFloat(avanceRaw);
const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || estatus === 'REALIZADO' || estatus === 'COMPLETADO' || estatus === 'DONE' || avanceRaw === '100' || avanceNum === 100 || avanceRaw.toUpperCase() === 'SI';
const tFolio = String(getTVal(['FOLIO', 'ID'])).toUpperCase().trim();

console.log("isDone:", isDone);
