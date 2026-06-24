const fs = require('fs');
let SRC = fs.readFileSync('CODIGO.js', 'utf8');

SRC = SRC.replace(/const SS = SpreadsheetApp\.getActiveSpreadsheet\(\);/g, 'const SS = { getSheetByName: (n) => global.mockFindSheet(n) };');
SRC = SRC.replace(/SpreadsheetApp/g, '{}');

global.mockFindSheet = function(name) {
    if (name === "TEST_SHEET") return {
        getName: () => "TEST_SHEET",
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
global.generatePrefix = () => "TE-";

let processedTasks = [];
global.internalBatchUpdateTasks = function(sheetName, tasksArray) {
    processedTasks = tasksArray;
    return { success: true };
};

let codeToRun = SRC.replace(/function doPost/g, 'function disabled_doPost').replace(/function doGet/g, 'function disabled_doGet');

try { eval(codeToRun); } catch (e) {}

try {
    const taskNew = { 'CONCEPTO': 'Test Task', 'RESPONSABLE': 'TERESA GARZA' };
    const resNew = apiSaveTrackerBatch("TEST_SHEET", [taskNew], "TESTUSER");
    console.log("New Task ID:", resNew.data[0]['FOLIO']);

    const taskExisting = { 'folio': 'TE-1001', 'CONCEPTO': 'Test Task Updated', 'RESPONSABLE': 'TERESA GARZA' };
    const resExisting = apiSaveTrackerBatch("TEST_SHEET", [taskExisting], "TESTUSER");

    // Check if it assigned a new folio anyway or kept the original one
    const returnedData = resExisting.data[0];
    console.log("Existing Task Update Result (Keys):", Object.keys(returnedData));
    console.log("Existing Task Final FOLIO:", returnedData['FOLIO'] || returnedData['folio']);

    if (returnedData['FOLIO'] !== 'TE-123') {
        console.log("SUCCESS! The system properly ignored assigning a new folio, keeping the lowercase one.");
    } else {
        console.log("FAIL! The system assigned a new folio despite the lower-case 'folio' key being present.");
    }

} catch(e) {
    console.error("Failed: ", e);
}
