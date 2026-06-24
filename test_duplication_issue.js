const fs = require('fs');

const SRC = fs.readFileSync('CODIGO.js', 'utf8');

// A very simple mock of the environment
global.registrarLog = function(u, action, msg) {
    console.log(`[LOG] ${u} - ${action}: ${msg}`);
};
global.findSheetSmart = function(name) {
    if (name === "ANTONIA_VENTAS") return { getName: () => "ANTONIA_VENTAS" };
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

let callCounter = {};
global.internalBatchUpdateTasks = function(sheetName, tasksArray, useOwnLock) {
    if (!callCounter[sheetName]) callCounter[sheetName] = 0;
    callCounter[sheetName] += tasksArray.length;
    console.log(`[internalBatchUpdateTasks] target: ${sheetName}, task count: ${tasksArray.length}`);
    return { success: true };
};

global.NotifierService = { sendToOutlook: function() { return { success: true }; } };
global.findUserEmailByLabel = function() { return "mock@holtmont.com"; };
global.CacheService = { getScriptCache: () => ({ get: () => null, put: () => {} }) };

let codeToRun = SRC.replace(/function doPost/g, 'function disabled_doPost')
                   .replace(/function doGet/g, 'function disabled_doGet');

try {
    eval(codeToRun);
} catch (e) {
    // Expected to fail partly
}

try {
    console.log("TESTING SAVE FOR ANTONIA");
    callCounter = {};
    const taskFromAntonia = {
        'FOLIO': 'AV-1001',
        'CONCEPTO': 'Test Task',
        'RESPONSABLE': 'ANTONIA_VENTAS'
    };
    apiSaveTrackerBatch("ANTONIA_VENTAS", [taskFromAntonia], "ANTONIA_VENTAS");

    console.log("Summary of calls:", callCounter);

} catch(e) {
    console.error("Test execution failed: ", e);
}
