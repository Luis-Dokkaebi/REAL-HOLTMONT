// Mocking GAS environment to test the reverse sync logic in CODIGO.js
const fs = require('fs');

let codigoJS = fs.readFileSync('CODIGO.js', 'utf8');

// We need to inject mocks for GAS services
const mockContext = `
let logs = [];
function registrarLog(user, type, msg) {
    logs.push({user, type, msg});
}

const SpreadsheetApp = {
  getActiveSpreadsheet: () => ({
    getId: () => 'mock-id'
  })
};

const LockService = {
  getScriptLock: () => ({
    waitLock: () => true,
    releaseLock: () => true
  })
};

let dbAntonia = [
  { 'FOLIO': 'AV-0001', 'MAP COT': '⚪ L | 🟡 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC', 'PROCESO_LOG': JSON.stringify([
      { step: 'CD', status: 'IN_PROGRESS', assignee: 'ANGEL SALINAS' },
      { step: 'CD', status: 'IN_PROGRESS', assignee: 'OTRO TRABAJADOR' }
  ]) }
];

let dbAngel = [
  { 'FOLIO': 'AV-0001', 'ESTATUS': 'PENDIENTE', 'AVANCE': '0%' }
];
let dbOtro = [
  { 'FOLIO': 'AV-0001', 'ESTATUS': 'PENDIENTE', 'AVANCE': '0%' }
];

function internalFetchSheetData(sheetName) {
  if (sheetName === 'ANTONIA_VENTAS') return { success: true, data: dbAntonia };
  return { success: false, data: [] };
}

function internalBatchUpdateTasks(sheetName, tasks, flag) {
  if (sheetName === 'ANTONIA_VENTAS') {
    dbAntonia[0] = Object.assign(dbAntonia[0], tasks[0]);
  }
  return { success: true };
}

`;

// Strip out existing internalBatchUpdateTasks and internalFetchSheetData if needed,
// actually we just want to extract the reverse sync block.
