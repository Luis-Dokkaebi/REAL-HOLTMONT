const fs = require('fs');

let code = fs.readFileSync('CODIGO.js', 'utf8');

// Function helper to get Draft Sheet Name
const getDraftSheetNameHelper = `
function getDraftSheetNameForType(tipo) {
  if (!tipo) return APP_CONFIG.draftSheetName;
  const t = String(tipo).toUpperCase().trim();
  if (t.includes('PROYECTO') && t.includes('INTERDISCIPLINARIA')) return 'PPC_BORRADOR_PROYECTO';
  if (t.includes('INTERNA')) return 'PPC_BORRADOR_INTERNA';
  if (t.includes('CLIENTE')) return 'PPC_BORRADOR_CLIENTE';
  if (t.includes('GENERAL') && t.includes('PREOPERATIVA')) return 'PPC_BORRADOR_GENERAL';
  if (t.includes('PROYECTO') && t.includes('PREOPERATIVA')) return 'PPC_BORRADOR_PREOP_PROY';
  return APP_CONFIG.draftSheetName;
}
`;

// Replace apiFetchDrafts
code = code.replace(
  /function apiFetchDrafts\(\) \{([\s\S]*?)const sheet = findSheetSmart\(APP_CONFIG\.draftSheetName\);/,
  `function apiFetchDrafts(tipo) {
  try {
    const sheetName = getDraftSheetNameForType(tipo);
    const sheet = findSheetSmart(sheetName);`
);

// Replace apiSyncDrafts
code = code.replace(
  /function apiSyncDrafts\(drafts\) \{([\s\S]*?)let sheet = findSheetSmart\(APP_CONFIG\.draftSheetName\);\n\s+if \(\!sheet\) \{ sheet = SS\.insertSheet\(APP_CONFIG\.draftSheetName\); \}/,
  `function apiSyncDrafts(drafts, tipo) {
  const lock = LockService.getScriptLock();
  if (lock.tryLock(5000)) {
    try {
      const sheetName = getDraftSheetNameForType(tipo);
      let sheet = findSheetSmart(sheetName);
      if (!sheet) { sheet = SS.insertSheet(sheetName); }`
);

// Add "SAVED_STATUS" to headers
code = code.replace(
  /"RUTA_CRITICA", "ZONA", "CONTRATISTA", "CUANT_REQ", "CUANT_REAL", "DIAS_JSON"/,
  `"RUTA_CRITICA", "ZONA", "CONTRATISTA", "CUANT_REQ", "CUANT_REAL", "DIAS_JSON", "SAVED_STATUS"`
);

// Add mapping for item.saved in apiSyncDrafts
code = code.replace(
  /JSON\.stringify\(d\.dias \|\| \{\}\)/,
  `JSON.stringify(d.dias || {}), d.saved === true ? 'TRUE' : 'FALSE'`
);

// Modify apiFetchDrafts map to load saved status
code = code.replace(
  /dias: diasObj\n\s+\};/,
  `dias: diasObj,
        saved: String(r[20]).toUpperCase() === 'TRUE'
      };`
);

// Replace apiClearDrafts
code = code.replace(
  /function apiClearDrafts\(\) \{([\s\S]*?)const sheet = findSheetSmart\(APP_CONFIG\.draftSheetName\);/,
  `function apiClearDrafts(tipo) {
  try {
    const sheetName = getDraftSheetNameForType(tipo);
    const sheet = findSheetSmart(sheetName);`
);

// Insert helper function
code = code.replace(
  /function apiFetchDrafts/,
  getDraftSheetNameHelper + '\nfunction apiFetchDrafts'
);


fs.writeFileSync('CODIGO.js', code);
