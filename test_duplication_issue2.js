const fs = require('fs');
let SRC = fs.readFileSync('CODIGO.js', 'utf8');

SRC = SRC.replace(/const SS = SpreadsheetApp\.getActiveSpreadsheet\(\);/g, 'const SS = { getSheetByName: (n) => global.mockFindSheet(n) };');
SRC = SRC.replace(/SpreadsheetApp/g, '{}');

global.mockFindSheet = function(name) {
    if (name === "ANTONIA_VENTAS") return {
        getName: () => "ANTONIA_VENTAS",
        getDataRange: () => ({ getValues: () => [[]] })
    };
    return null;
};

global.registrarLog = function() {};
global.generateNumericSequence = function() { return 123; };
global.PropertiesService = { getScriptProperties: () => ({ getProperty: () => 1000, setProperty: () => {} }) };
global.LockService = { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) };
global.NotifierService = { sendToOutlook: () => ({ success: true }) };
global.findUserEmailByLabel = () => "mock@holtmont.com";
global.CacheService = { getScriptCache: () => ({ get: () => null, put: () => {} }) };

let calls = {};
global.internalBatchUpdateTasks = function(sheetName, tasksArray) {
    if (!calls[sheetName]) calls[sheetName] = 0;
    calls[sheetName] += tasksArray.length;
    console.log(`internalBatchUpdateTasks called for ${sheetName} with ${tasksArray.length} tasks`);
    return { success: true };
};

let codeToRun = SRC.replace(/function doPost/g, 'function disabled_doPost').replace(/function doGet/g, 'function disabled_doGet');

try { eval(codeToRun); } catch (e) {}

try {
    const origInternalBatchUpdateTasks = internalBatchUpdateTasks;
    internalBatchUpdateTasks = function(sheetName, tasksArray) {
        if (!calls[sheetName]) calls[sheetName] = 0;
        calls[sheetName] += tasksArray.length;
        console.log(`[MOCK] internalBatchUpdateTasks called for ${sheetName} with ${tasksArray.length} tasks`);
        return { success: true };
    };

    calls = {};
    const taskFromAntonia = { 'FOLIO': 'AV-1001', 'CONCEPTO': 'Test Task', 'RESPONSABLE': 'ANTONIA_VENTAS' };
    apiSaveTrackerBatch("ANTONIA_VENTAS", [taskFromAntonia], "ANTONIA_VENTAS");

    console.log("\nSummary of calls:", calls);
} catch(e) {
    console.error("Failed: ", e);
}
