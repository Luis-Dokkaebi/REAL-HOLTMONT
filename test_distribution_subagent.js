/**
 * SUB-AGENTE DE TESTING
 * Objetivo: Verificar que la lógica de distribución lateral y maestro-detalle
 * detecte correctamente las asignaciones en las columnas RESPONSABLE e INVOLUCRADOS,
 * no solamente en la columna VENDEDOR.
 */

const fs = require('fs');

console.log("==================================================");
console.log(" INICIANDO SUB-AGENTE DE TESTING DE DISTRIBUCIÓN");
console.log("==================================================");

let code = fs.readFileSync('CODIGO.js', 'utf8');

// Modificar el código fuente de Apps Script para correr en el ambiente Node.js
code = code.replace(/const SS = SpreadsheetApp\.getActiveSpreadsheet\(\);/g, 'const SS = { getSheetByName: (n) => global.findSheetSmart(n) };');
code = code.replace(/SpreadsheetApp/g, '{}');

// Mocks globales de las funciones de Apps Script
global.registrarLog = function(u, action, msg) {
    console.log(`  [LOG] ${u} - ${action}: ${msg}`);
};

global.findSheetSmart = function(name) {
    const validSheets = ["TERESA GARZA", "ALFONSO CORREA", "JUAN JOSE SANCHEZ", "ANTONIA_VENTAS"];
    const nClean = name.replace(" (VENTAS)", "");
    if (validSheets.includes(nClean) || validSheets.includes(name)) {
        return {
            getName: () => name,
            getDataRange: () => ({ getValues: () => [[]] }),
            deleteRow: () => {}
        };
    }
    return null;
};

global.generateNumericSequence = function(key) { return Math.floor(Math.random() * 1000); };
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 1000, setProperty: () => {} }) };
global.LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) };

let interceptedCalls = [];

global.NotifierService = {
    sendToOutlook: function(payload) {
        console.log(`  [OUTLOOK] Notificación enviada a: ${payload.correoDestino} | Título: ${payload.titulo}`);
        return { success: true };
    }
};

global.findUserEmailByLabel = function(label) { return "mock@holtmont.com"; };

// Evaluar CODIGO.js en el contexto de Node
try {
    eval(code);
} catch (e) {
    console.error("  [ERROR] Fallo al cargar CODIGO.js en el entorno de pruebas:", e.message);
    process.exit(1);
}

// Sobreescribir internalBatchUpdateTasks DESPUÉS del eval para interceptar las llamadas
global.internalBatchUpdateTasks = function(sheetName, tasksArray, useOwnLock) {
    console.log(`  [MOCK] Guardando datos en hoja: '${sheetName}'`);
    interceptedCalls.push({sheetName, tasksArray});
    return { success: true };
};

let errors = 0;

function assert(condition, message) {
    if (!condition) {
        console.error(`  ❌ FALLO: ${message}`);
        errors++;
    } else {
        console.log(`  ✅ OK: ${message}`);
    }
}

try {
    console.log("\n--- CASO 1: ANTONIA_VENTAS distribuye usando 'RESPONSABLE' ---");
    interceptedCalls = [];
    const task1 = { 'FOLIO': '', 'CONCEPTO': 'Cotización Diseño', 'RESPONSABLE': 'TERESA GARZA' };

    // Llamar a la función del backend
    apiSaveTrackerBatch("ANTONIA_VENTAS", [task1], "ANTONIA_VENTAS");

    // Validar resultados
    assert(interceptedCalls.some(c => c.sheetName === "TERESA GARZA" || c.sheetName === "TERESA GARZA (VENTAS)"), "La tarea debe enviarse a la hoja de TERESA GARZA");

    console.log("\n--- CASO 2: Usuario regular distribuye lateralmente usando 'INVOLUCRADOS' ---");
    interceptedCalls = [];
    const task2 = { 'ID': 'TEST-002', 'CONCEPTO': 'Revisión en campo', 'INVOLUCRADOS': 'ALFONSO CORREA' };

    apiSaveTrackerBatch("JUAN JOSE SANCHEZ", [task2], "JUAN_JOSE_SANCHEZ");

    assert(interceptedCalls.some(c => c.sheetName === "ALFONSO CORREA" || c.sheetName === "ALFONSO CORREA (VENTAS)"), "La tarea lateral debe enviarse a la hoja de ALFONSO CORREA");
    assert(interceptedCalls.some(c => c.sheetName === "ANTONIA_VENTAS"), "La tarea también debe sincronizarse con ANTONIA_VENTAS");

} catch(e) {
    console.error("  [ERROR CRÍTICO] Excepción durante la ejecución de las pruebas: ", e);
    errors++;
}

console.log("\n==================================================");
if (errors === 0) {
    console.log(" 🎉 RESULTADO: TODAS LAS PRUEBAS PASARON. EL SUB-AGENTE CONFIRMA LA SOLUCIÓN.");
} else {
    console.log(` ⚠️ RESULTADO: SE ENCONTRARON ${errors} ERROR(ES). REVISAR LÓGICA.`);
    process.exit(1);
}
console.log("==================================================");
