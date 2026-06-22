const fs = require('fs');

let content = fs.readFileSync('CODIGO.js', 'utf8');

// Fixing internalUpdateTask
content = content.replace(
`        if (isAntonia) {
             // 1. AUTO-INCREMENT FOLIO (Before Saving)
             if (!taskData['FOLIO'] && !taskData['ID']) {
                 // NEW TASK -> GENERATE ID
                 const seqNum = generateNumericSequence('ANTONIA_SEQ_V2');
                 taskData['FOLIO'] = "AV-" + seqNum;
             } else {`,
`        // 1. AUTO-INCREMENT FOLIO (Before Saving)
        if (!taskData['FOLIO'] && !taskData['ID']) {
             // NEW TASK -> GENERATE ID for any user
             let prefix = isAntonia ? "AV-" : generatePrefix(username || personName);
             let seqKey = isAntonia ? 'ANTONIA_SEQ_V2' : prefix;
             const seqNum = generateNumericSequence(seqKey);
             taskData['FOLIO'] = prefix + seqNum;
        }

        if (isAntonia) {
             if (taskData['FOLIO'] || taskData['ID']) {`
);

// Fixing apiSaveTrackerBatch
content = content.replace(
`        if (isAntonia) {
             if (!taskData['FOLIO'] && !taskData['ID']) {
                 // GHOST BUSTING: Verificar contenido antes de asignar Folio
                 const clean = (val) => val ? String(val).trim() : "";
                 const c = clean(taskData['CONCEPTO']);
                 const d = clean(taskData['DESCRIPCION']);
                 const cl = clean(taskData['CLIENTE']);
                 const vk = Object.keys(taskData).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
                 const v = vk ? clean(taskData[vk]) : "";

                 // Ignorar si VENDEDOR es solo el default "ANTONIA_VENTAS" y no hay nada más
                 const isVendedorDefault = v.toUpperCase() === "ANTONIA_VENTAS";

                 const hasContent = (c !== "") ||
                                    (d !== "") ||
                                    (cl !== "") ||
                                    (v !== "" && !isVendedorDefault);

                 if (!hasContent) return; // SKIP EMPTY ROWS (Don't process, don't distribute)

                 // Use robust locked generator to avoid duplicates during mass-inserts
                 const prefix = generatePrefix(username || personName);
                 const seqNum = generateNumericSequence(prefix);
                 taskData['FOLIO'] = prefix + seqNum;
             } else {`,
`        // GHOST BUSTING: Verificar contenido antes de asignar Folio
        const clean = (val) => val ? String(val).trim() : "";
        const c = clean(taskData['CONCEPTO']);
        const d = clean(taskData['DESCRIPCION']);
        const cl = clean(taskData['CLIENTE']);
        const vk = Object.keys(taskData).find(k => k.toUpperCase().trim() === "VENDEDOR" || k.toUpperCase().trim() === "RESPONSABLE" || k.toUpperCase().trim() === "INVOLUCRADOS");
        const v = vk ? clean(taskData[vk]) : "";

        // Ignorar si VENDEDOR es solo el default "ANTONIA_VENTAS" y no hay nada más
        const isVendedorDefault = isAntonia ? v.toUpperCase() === "ANTONIA_VENTAS" : false;

        const hasContent = (c !== "") ||
                           (d !== "") ||
                           (cl !== "") ||
                           (v !== "" && !isVendedorDefault);

        if (!hasContent && !taskData['FOLIO'] && !taskData['ID']) return; // SKIP EMPTY ROWS (Don't process, don't distribute)

        // Use robust locked generator to avoid duplicates during mass-inserts
        if (!taskData['FOLIO'] && !taskData['ID'] && hasContent) {
            let prefix = isAntonia ? "AV-" : generatePrefix(username || personName);
            let seqKey = isAntonia ? 'ANTONIA_SEQ_V2' : prefix;
            const seqNum = generateNumericSequence(seqKey);
            taskData['FOLIO'] = prefix + seqNum;
        }

        if (isAntonia) {
             if (taskData['FOLIO'] || taskData['ID']) {`
);

fs.writeFileSync('CODIGO.js', content, 'utf8');
