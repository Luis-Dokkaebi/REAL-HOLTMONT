const fs = require('fs');

const SRC = fs.readFileSync('CODIGO.js', 'utf8');

// A very simple mock of the environment
global.registrarLog = function(u, action, msg) {
    console.log(`[LOG] ${u} - ${action}: ${msg}`);
};
global.findSheetSmart = function(name) {
    if (name === "TERESA GARZA") return { getName: () => "TERESA GARZA" };
    if (name === "ALFONSO CORREA") return { getName: () => "ALFONSO CORREA" };
    return null;
};
global.generateNumericSequence = function(key) { return 123; };

global.PropertiesService = {
    getScriptProperties: function() {
        return {
            getProperty: function() { return 1000; },
            setProperty: function() {}
        };
    }
};
global.LockService = {
    getScriptLock: function() {
        return { tryLock: () => true, releaseLock: () => {} };
    }
};

let interceptedCalls = [];
global.internalBatchUpdateTasks = function(sheetName, tasksArray, useOwnLock) {
    console.log(`[internalBatchUpdateTasks] called with target: ${sheetName}, tasks: ${JSON.stringify(tasksArray.map(t => t.FOLIO || t.ID))}`);
    interceptedCalls.push({sheetName, tasksArray});
    return { success: true };
};

global.NotifierService = {
    sendToOutlook: function(payload) {
        console.log(`[OUTLOOK NOTIFICATION] to: ${payload.correoDestino}, title: ${payload.titulo}`);
        return { success: true };
    }
};
global.findUserEmailByLabel = function(label) {
    return "mock@holtmont.com";
};

// We will test `apiSaveTrackerBatch` which is the entry point
// We need to eval CODIGO.js but avoid executing some auto-run stuff.
// Actually, it's safer to just extract `apiSaveTrackerBatch` or wrap CODIGO.js.

let codeToRun = SRC.replace(/function doPost/g, 'function disabled_doPost')
                   .replace(/function doGet/g, 'function disabled_doGet')
                   .replace(/function processQuoteRow/g, 'function processQuoteRow_mock(){} function disabled_processQuoteRow');

try {
    eval(codeToRun);
} catch (e) {
    console.log("Eval error, probably referencing undefined Google services: " + e.message);
}

try {
    console.log("\n--- TEST: Antonia Saves a task assigned to TERESA GARZA ---");
    interceptedCalls = [];
    const taskFromAntonia = {
        'FOLIO': '',
        'CONCEPTO': 'Test Task',
        'RESPONSABLE': 'TERESA GARZA' // Using RESPONSABLE instead of VENDEDOR
    };
    apiSaveTrackerBatch("ANTONIA_VENTAS", [taskFromAntonia], "ANTONIA_VENTAS");

    console.log("\n--- TEST: Juan Jose assigns a task to Alfonso Correa ---");
    interceptedCalls = [];
    const taskFromJuan = {
        'ID': 'JJ-1',
        'CONCEPTO': 'Test Lateral',
        'INVOLUCRADOS': 'ALFONSO CORREA' // Using INVOLUCRADOS instead of VENDEDOR
    };
    apiSaveTrackerBatch("JUAN JOSE SANCHEZ", [taskFromJuan], "JUAN_JOSE_SANCHEZ");

} catch(e) {
    console.error("Test execution failed: ", e);
}
