const fs = require('fs');
const vm = require('vm');

// Leer el código
const code = fs.readFileSync('CODIGO.js', 'utf8');

// Proveer stubs básicos
const context = {
    console: console,
    Logger: console,
    SpreadsheetApp: {
        getActiveSpreadsheet: () => ({
            getSheetByName: () => null,
            getSheets: () => [],
            insertSheet: () => ({ appendRow: () => {} })
        })
    },
    LockService: {
        getScriptLock: () => ({
            tryLock: () => true,
            releaseLock: () => {},
            waitLock: () => {}
        })
    },
    PropertiesService: {
        getScriptProperties: () => {
            const props = {};
            return {
                getProperty: (k) => props[k] || "1000",
                setProperty: (k, v) => { props[k] = v; }
            };
        }
    },
    Utilities: {
        formatDate: () => "01/01/24"
    },
    HtmlService: {},
    Session: {},
    DriveApp: {},
    ScriptApp: {},
    UrlFetchApp: {},
    MailApp: {},
    APP_CONFIG: {
        logSheetName: 'LOG',
        ppcSheetName: 'PPC'
    },
    USER_DB: {
        'TESTUSER': { staffName: 'TEST USER' }
    }
};

vm.createContext(context);

try {
    vm.runInContext(code, context);
} catch (e) {
    // Ignoramos
}

context.internalBatchUpdateTasks = (sheet, tasks) => {
    return { success: true, moved: false };
};

context.findSheetSmart = () => ({
    getDataRange: () => ({ getValues: () => [] }),
    deleteRow: () => {}
});

// Ejecutar prueba internalUpdateTask
try {
    const taskData = {
        'CONCEPTO': 'Tarea de prueba 1',
        'ESTATUS': 'NUEVO'
    };

    const result = context.internalUpdateTask('TEST USER', taskData, 'TESTUSER');

    if (result.success && result.data && result.data.FOLIO && result.data.FOLIO.startsWith('TE-')) {
        console.log("✅ internalUpdateTask generó FOLIO correctamente:", result.data.FOLIO);
    } else {
        console.error("❌ internalUpdateTask falló o no generó FOLIO:", result);
    }
} catch (e) {
    console.error("Error probando internalUpdateTask:", e);
}

// Ejecutar prueba apiSaveTrackerBatch
try {
    const taskBatch = [
        {
            'CONCEPTO': 'Tarea batch 1',
            'ESTATUS': 'NUEVO'
        },
        {
            'CONCEPTO': 'Tarea batch 2',
            'ESTATUS': 'NUEVO'
        }
    ];

    const batchResult = context.apiSaveTrackerBatch('TEST USER', taskBatch, 'TESTUSER');

    if (batchResult.success) {
        console.log("✅ apiSaveTrackerBatch completado con éxito.");
    } else {
        console.error("❌ apiSaveTrackerBatch falló:", batchResult);
    }
} catch (e) {
    console.error("Error probando apiSaveTrackerBatch:", e);
}
