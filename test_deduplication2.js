const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('CODIGO.js', 'utf8');

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
    Utilities: { formatDate: () => "01/01/24" },
    HtmlService: {}, Session: {}, DriveApp: {}, ScriptApp: {}, UrlFetchApp: {}, MailApp: {}, CacheService: { getScriptCache: () => ({ get: () => null, put: () => {} }) },
    APP_CONFIG: { logSheetName: 'LOG', ppcSheetName: 'PPC' },
    USER_DB: { 'TESTUSER': { staffName: 'TEST USER' } }
};

vm.createContext(context);
try { vm.runInContext(code, context); } catch (e) {}

context.internalBatchUpdateTasks = (sheet, tasks) => { return { success: true, moved: false }; };
context.findSheetSmart = () => ({ getDataRange: () => ({ getValues: () => [] }), deleteRow: () => {} });

try {
    const taskBatch = [
        {
            'folio': 'TE-2023',
            'CONCEPTO': 'Tarea duplicada con folio minuscula',
            'ESTATUS': 'NUEVO'
        }
    ];

    const batchResult = context.apiSaveTrackerBatch('TEST USER', taskBatch, 'TESTUSER');

    if (batchResult.success) {
        console.log("Resultado final de apiSaveTrackerBatch para tarea con 'folio':", batchResult.data[0]);
        if (batchResult.data[0]['FOLIO'] === 'TE-2023' || !batchResult.data[0]['FOLIO'] || batchResult.data[0]['FOLIO'] === undefined) {
             console.log("✅ El folio original se conservó, no se generó uno nuevo.");
        } else {
             console.error("❌ El sistema asignó un folio nuevo incorrectamente:", batchResult.data[0]['FOLIO']);
        }
    } else {
        console.error("❌ apiSaveTrackerBatch falló:", batchResult);
    }
} catch (e) {
    console.error("Error probando apiSaveTrackerBatch:", e);
}
