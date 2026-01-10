
function apiFetchInfoBankData(year, monthName, companyName, folderName) {
  try {
    const sheetName = "ANTONIA_VENTAS";
    const res = internalFetchSheetData(sheetName);
    if (!res.success) return { success: false, message: res.message };

    const monthMap = {
        'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3, 'MAYO': 4, 'JUNIO': 5,
        'JULIO': 6, 'AGOSTO': 7, 'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
    };
    const targetMonth = monthMap[String(monthName).toUpperCase().trim()];
    const targetYear = parseInt(year) || 2025;
    const targetCompany = String(companyName).toUpperCase().trim();

    if (targetMonth === undefined) return { success: false, message: "Mes inválido" };

    // Filtrar datos
    const filtered = res.data.filter(row => {
       // 1. Company Match (Loose)
       const rowClient = String(row['CLIENTE'] || '').toUpperCase().trim();
       if (!rowClient) return false;

       // Check bidirectional inclusion to handle variations
       if (!rowClient.includes(targetCompany) && !targetCompany.includes(rowClient)) return false;

       // 2. Date Match (FECHA INICIO)
       const dateVal = row['FECHA'] || row['ALTA'] || row['FECHA_ALTA'] || row['FECHA INICIO'] || row['FECHA_INICIO'] || row['FECHA VISITA'];
       if (!dateVal) return false;

       let dObj = null;
       if (dateVal instanceof Date) {
           dObj = dateVal;
       } else {
           // Try parsing string dd/mm/yy
           const parts = String(dateVal).split('/');
           if (parts.length === 3) {
               let y = parseInt(parts[2]);
               if (y < 100) y += 2000;
               dObj = new Date(y, parseInt(parts[1])-1, parseInt(parts[0]));
           }
       }

       if (!dObj || isNaN(dObj.getTime())) return false;
       if (dObj.getMonth() !== targetMonth) return false;
       if (dObj.getFullYear() !== targetYear) return false;

       return true;
    });

    return { success: true, data: filtered };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}
