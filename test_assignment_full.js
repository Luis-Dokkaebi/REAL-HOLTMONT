const fs = require('fs');

let codigoJS = fs.readFileSync('CODIGO.js', 'utf8');

// A very lightweight mock to test the exact logic block from CODIGO.js lines ~5312 to 5352

function testAssignment() {
    let taskData = {
        'FOLIO': 'AV-0001',
        'ESTATUS': 'PENDIENTE',
        'AVANCE': '0%',
        '_assignToWorker': ['ANGEL SALINAS', 'ALEXA HERNANDEZ'],
        '_assignStep': 'CD'
    };

    let distributed = {};

    function internalBatchUpdateTasks(worker, [assignData]) {
        if (!distributed[worker]) distributed[worker] = [];
        distributed[worker].push(assignData);
    }

    function findUserEmailByLabel(w) { return "test@holtmont.com"; }
    const NotifierService = { sendToOutlook: (payload) => { /* console.log("Sent notification to " + payload.destinatarios); */ } };
    function registrarLog() {}

    // Extract assignment block
    const distData = JSON.parse(JSON.stringify(taskData));
    delete distData._rowIndex;
    delete distData['PROCESO_LOG'];
    delete distData['PROCESO'];

    if (taskData._assignToWorker && taskData._assignStep) {
        try {
            const workers = Array.isArray(taskData._assignToWorker) ? taskData._assignToWorker : [taskData._assignToWorker];
            const stepTitle = taskData._assignStep;
            const folioStr = taskData["FOLIO"] || "SIN-FOLIO";
            const clienteStr = taskData["CLIENTE"] || "Desconocido";

            for (let worker of workers) {
                const assignData = JSON.parse(JSON.stringify(distData));
                assignData['ESTATUS'] = 'PENDIENTE';
                assignData['AVANCE'] = '0%';
                internalBatchUpdateTasks(worker, [assignData]);

                // INTEGRACIÓN OUTLOOK: Enviar evento al trabajador asignado
                const userEmail = findUserEmailByLabel(worker);
                if (userEmail) {
                    const fInicio = new Date();
                    const fFin = new Date(fInicio.getTime() + (2 * 60 * 60 * 1000));

                    NotifierService.sendToOutlook({
                        destinatarios: [userEmail],
                        titulo: `Asignación Papa Caliente: ${stepTitle} - ${clienteStr}`,
                        descripcion: `Se te ha delegado la etapa [${stepTitle}] para el cliente ${clienteStr} con folio ${folioStr}. Por favor actualiza tu estatus cuando termines.`,
                        fechaInicio: fInicio.toISOString(),
                        fechaFin: fFin.toISOString()
                    });
                }
            }
        } catch(e) {
            registrarLog("ANTONIA", "DIST_ERROR", e.toString());
        }

        delete taskData._assignToWorker;
        delete taskData._assignStep;
    }

    console.log("Distributed to Angel:", distributed['ANGEL SALINAS'] ? "Yes" : "No");
    console.log("Distributed to Alexa:", distributed['ALEXA HERNANDEZ'] ? "Yes" : "No");
    console.log("Original Task assign data removed?", taskData._assignToWorker === undefined);
}

testAssignment();
