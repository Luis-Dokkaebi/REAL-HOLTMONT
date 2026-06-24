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
    USER_DB: { 'ANTONIA': { staffName: 'ANTONIA_VENTAS' } }
};

vm.createContext(context);
try { vm.runInContext(code, context); } catch (e) {}

context.internalBatchUpdateTasks = (sheet, tasks) => { return { success: true, moved: false }; };
context.findSheetSmart = () => ({ getDataRange: () => ({ getValues: () => [ ['FOLIO'], ['TE-2023'] ] }), deleteRow: () => { console.log('✅ deleteRow called!'); } });
context.registrarLog = () => {};

try {
    const taskData = {
        'folio': 'TE-2023',
        'CONCEPTO': 'Tarea a remover',
        '_removeWorker': 'TEST WORKER'
    };

    context.internalUpdateTask('ANTONIA_VENTAS', taskData, 'ANTONIA');
} catch (e) {
    console.error("Error:", e);
}
