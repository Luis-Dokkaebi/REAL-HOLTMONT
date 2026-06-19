function deduplicateAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let totalDeleted = 0;

  // We only want to run this on actual data sheets, not system/config sheets
  const excludeSheets = ["DB_DIRECTORY", "ESTATUS", "APP_CONFIG", "DASHBOARD", "PPC_BORRADOR"];

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const sheetName = sheet.getName();

    if (excludeSheets.some(ex => sheetName.includes(ex))) {
      continue;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) continue; // Skip empty sheets or just headers

    const headers = data[0].map(h => String(h).toUpperCase().trim());

    const folioIdx = headers.indexOf("FOLIO");
    const idIdx = headers.indexOf("ID");
    const conceptoIdx = headers.indexOf("CONCEPTO");
    const descIdx = headers.indexOf("DESCRIPCION");
    const fechaIdx = headers.indexOf("FECHA");
    const fInicioIdx = headers.indexOf("F. INICIO");

    const seenFolios = new Set();
    const seenCombos = new Set();
    const rowsToDelete = [];

    // Go from top to bottom to identify duplicates (keeping the first one we see)
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      let isDuplicate = false;

      const folio = (folioIdx > -1 ? row[folioIdx] : "") || (idIdx > -1 ? row[idIdx] : "");
      const folioStr = String(folio).trim();

      if (folioStr !== "" && folioStr !== "SIN-FOLIO") {
        if (seenFolios.has(folioStr)) {
          isDuplicate = true;
        } else {
          seenFolios.add(folioStr);
        }
      } else {
        // No folio, use concept/desc + date combination
        const concept = (conceptoIdx > -1 ? row[conceptoIdx] : "") || (descIdx > -1 ? row[descIdx] : "");
        const dateRaw = (fechaIdx > -1 ? row[fechaIdx] : "") || (fInicioIdx > -1 ? row[fInicioIdx] : "");

        let dateStr = "";
        if (dateRaw instanceof Date) {
            // just standard format for comparison
            dateStr = dateRaw.toISOString().split('T')[0];
        } else {
            dateStr = String(dateRaw).trim();
        }

        const conceptStr = String(concept).trim().toUpperCase();

        if (conceptStr !== "") {
            const comboKey = conceptStr + "|||" + dateStr;
            if (seenCombos.has(comboKey)) {
                isDuplicate = true;
            } else {
                seenCombos.add(comboKey);
            }
        }
      }

      if (isDuplicate) {
        // Row to delete is r + 1 (1-based index in sheets)
        rowsToDelete.push(r + 1);
      }
    }

    // Delete rows from bottom to top to preserve indices
    if (rowsToDelete.length > 0) {
      Logger.log(`Found ${rowsToDelete.length} duplicates in sheet ${sheetName}`);
      for (let j = rowsToDelete.length - 1; j >= 0; j--) {
        sheet.deleteRow(rowsToDelete[j]);
        totalDeleted++;
      }
    }
  }

  Logger.log(`Total duplicate rows deleted across all sheets: ${totalDeleted}`);
  return totalDeleted;
}
