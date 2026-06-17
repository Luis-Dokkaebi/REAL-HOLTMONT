const fs = require('fs');
let code = fs.readFileSync('CODIGO.js', 'utf8');

// replace SS calls for testing
code = code.replace(/const SS = SpreadsheetApp\.getActiveSpreadsheet\(\);/g, 'const SS = { getSheetByName: (n) => global.findSheetSmart(n) };');
code = code.replace(/SpreadsheetApp/g, '{}');

global.registrarLog = function(u, action, msg) {
    console.log(`[LOG] ${u} - ${action}: ${msg}`);
};
global.findSheetSmart = function(name) {
    if (name === "TERESA GARZA") return { getName: () => "TERESA GARZA", getDataRange: () => ({ getValues: () => [[]] }) };
    if (name === "ALFONSO CORREA") return { getName: () => "ALFONSO CORREA", getDataRange: () => ({ getValues: () => [[]] }) };
    if (name === "JUAN JOSE SANCHEZ") return { getName: () => "JUAN JOSE SANCHEZ", getDataRange: () => ({ getValues: () => [[]] }) };
    if (name === "ANTONIA_VENTAS") return { getName: () => "ANTONIA_VENTAS", getDataRange: () => ({ getValues: () => [[]] }) };
    return null;
};
global.generateNumericSequence = function(key) { return 123; };
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 1000, setProperty: () => {} }) };
global.LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) };

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
global.findUserEmailByLabel = function(label) { return "mock@holtmont.com"; };

try { eval(code); } catch (e) { console.log("Eval error: " + e.message); }

// Test logic
global.internalBatchUpdateTasks = function(sheetName, tasksArray, useOwnLock) {
    console.log(`[internalBatchUpdateTasks] called with target: ${sheetName}, tasks: ${JSON.stringify(tasksArray.map(t => t.FOLIO || t.ID))}`);
    return { success: true };
};

try {
    console.log("\n--- TEST: Antonia Saves a task assigned to TERESA GARZA ---");
    const taskFromAntonia = { 'FOLIO': '', 'CONCEPTO': 'Test Task', 'RESPONSABLE': 'TERESA GARZA' };
    apiSaveTrackerBatch("ANTONIA_VENTAS", [taskFromAntonia], "ANTONIA_VENTAS");

    console.log("\n--- TEST: Juan Jose assigns a task to Alfonso Correa ---");
    const taskFromJuan = { 'ID': 'JJ-1', 'CONCEPTO': 'Test Lateral', 'INVOLUCRADOS': 'ALFONSO CORREA' };
    apiSaveTrackerBatch("JUAN JOSE SANCHEZ", [taskFromJuan], "JUAN_JOSE_SANCHEZ");
} catch(e) {
    console.error("Test execution failed: ", e);
}
