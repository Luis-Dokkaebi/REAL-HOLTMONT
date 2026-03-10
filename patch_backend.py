import re

with open("CODIGO.js", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Forward sync internalUpdateTask
old_internal_fwd = r"""        if \(isAntonia\) \{
             const distData = JSON\.parse\(JSON\.stringify\(taskData\)\);
             delete distData\._rowIndex;
             delete distData\['PROCESO_LOG'\];
                          delete distData\['PROCESO'\];

             // MODIFICADO: Se comenta la distribución a vendedores"""

new_internal_fwd = r"""        if (isAntonia) {
             const distData = JSON.parse(JSON.stringify(taskData));
             delete distData._rowIndex;
             delete distData['PROCESO_LOG'];
                          delete distData['PROCESO'];

             if (taskData._assignToWorker && taskData._assignStep) {
                 try {
                     const assignData = JSON.parse(JSON.stringify(distData));
                     assignData['ESTATUS'] = 'PENDIENTE';
                     assignData['AVANCE'] = '0%';
                     const tRes = internalBatchUpdateTasks(taskData._assignToWorker, [assignData]);
                     if (!tRes.success) registrarLog("ANTONIA", "DIST_FAIL", `Fallo envío a ${taskData._assignToWorker}: ${tRes.message}`);
                 } catch(e) {
                     registrarLog("ANTONIA", "DIST_ERROR", e.toString());
                 }
             }

             // MODIFICADO: Se comenta la distribución a vendedores"""

code = re.sub(old_internal_fwd, new_internal_fwd, code, count=1)

# 2. Reverse Sync internalUpdateTask
old_internal_rev = r"""        \} else if \(String\(personName\)\.toUpperCase\(\)\.includes\(\"\(VENTAS\)\"\)\) \{
             // Sincronización Inversa: Vendedor -> ANTONIA_VENTAS
             // Si el vendedor actualiza su tabla, replicamos el cambio a la maestra de ANTONIA
             try \{
                 const syncData = JSON\.parse\(JSON\.stringify\(taskData\)\);
                 delete syncData\._rowIndex;
                 delete syncData\['PROCESO_LOG'\];
                                  delete syncData\['PROCESO'\]; // Evitar conflictos de índice de fila

                 // Intentamos actualizar en ANTONIA_VENTAS
                 const syncRes = internalBatchUpdateTasks\(\"ANTONIA_VENTAS\", \[syncData\]\);
                 if \(\!syncRes\.success\) \{
                     console\.warn\(\"Fallo sincronización inversa a ANTONIA_VENTAS: \" \+ syncRes\.message\);
                 \}

                 // Sincronización Lateral \(Peer-to-Peer via VENDEDOR field\)"""

new_internal_rev = r"""        } else {
             try {
                 const syncData = JSON.parse(JSON.stringify(taskData));
                 delete syncData._rowIndex;
                 delete syncData['PROCESO_LOG'];
                 delete syncData['PROCESO'];

                 const getTVal = (keys) => {
                     for (let k of keys) {
                         let found = Object.keys(syncData).find(key => key.toUpperCase().trim() === k);
                         if (found && syncData[found]) return syncData[found];
                     }
                     return "";
                 };

                 const estatus = String(getTVal(['ESTATUS', 'STATUS', 'ESTADO'])).toUpperCase().trim();
                 const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '%'])).replace(/%/g, '').trim();
                 const avanceNum = parseFloat(avanceRaw);
                 const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || avanceRaw === '100' || avanceNum === 100 || avanceNum === 1;

                 const tFolio = String(getTVal(['FOLIO', 'ID'])).toUpperCase().trim();

                 if (tFolio) {
                     const antData = internalFetchSheetData("ANTONIA_VENTAS");
                     if (antData.success && antData.data) {
                         const targetRow = antData.data.find(r => String(r['FOLIO'] || r['ID'] || "").toUpperCase().trim() === tFolio);

                         if (targetRow) {
                             let log = [];
                             try {
                                 if (targetRow['PROCESO_LOG']) log = JSON.parse(targetRow['PROCESO_LOG']);
                             } catch(e) {}

                             let updated = false;
                             const updatedLog = log.map(entry => {
                                 let wNorm = String(personName).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "");
                                 let eNorm = entry.assignee ? String(entry.assignee).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "") : "";

                                 if (entry.status === 'IN_PROGRESS' && (eNorm === wNorm || eNorm.includes(wNorm) || wNorm.includes(eNorm) || eNorm === "" || wNorm === "") && isDone) {
                                     entry.status = 'DONE';
                                     updated = true;
                                     registrarLog("SYSTEM", "REVERSE_SYNC", `${personName} completed step ${entry.step} for FOLIO ${tFolio}`);
                                 }
                                 return entry;
                             });

                             if (updated) {
                                 const stepsOrder = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                                 let oldParts = (targetRow["MAP COT"] || "").split(/\||>|\//).map(p => p.trim());
                                 let mapCotParts = stepsOrder.map(step => {
                                     const stepEntry = updatedLog.find(e => e.step === step || e.to === step);
                                     if (stepEntry) {
                                         if (stepEntry.status === 'DONE') return '🟢 ' + step;
                                         if (stepEntry.status === 'IN_PROGRESS') return '🟡 ' + step;
                                         if (stepEntry.status === 'PENDING') return '🔴 ' + step;
                                     }
                                     let oldPart = oldParts.find(p => p.includes(step));
                                     if (oldPart && oldPart.includes('🟢')) return '🟢 ' + step;
                                     if (oldPart && oldPart.includes('🟡')) return '🟡 ' + step;
                                     if (oldPart && oldPart.includes('🔴')) return '🔴 ' + step;
                                     return '⚪ ' + step;
                                 });

                                 let syncToAntonia = {
                                     'FOLIO': targetRow['FOLIO'] || tFolio,
                                     'PROCESO_LOG': JSON.stringify(updatedLog),
                                     'MAP COT': mapCotParts.join(' | ')
                                 };

                                 const fileCols = ['ARCHIVO', 'F2', 'LAYOUT', 'COTIZACION', 'EVIDENCIA'];
                                 fileCols.forEach(col => {
                                     let wKey = Object.keys(taskData).find(k => k.toUpperCase().trim() === col);
                                     if (wKey && taskData[wKey] && String(taskData[wKey]).trim() !== "") {
                                         syncToAntonia[wKey] = taskData[wKey];
                                     }
                                 });

                                 internalBatchUpdateTasks("ANTONIA_VENTAS", [syncToAntonia]);
                             } else if (String(personName).toUpperCase().includes("(VENTAS)")) {
                                 internalBatchUpdateTasks("ANTONIA_VENTAS", [syncData]);
                             }
                         }
                     }
                 }

                 // Sincronización Lateral (Peer-to-Peer via VENDEDOR field)"""

code = re.sub(old_internal_rev, new_internal_rev, code, count=1)

# 3. Forward sync internalBatchUpdateTasks
old_batch_fwd = r"""             delete distData\['PROCESO'\];
             distributionTasks\.push\(distData\);
        \} else if \(String\(personName\)\.toUpperCase\(\)\.includes\(\"\(VENTAS\)\"\)\) \{"""

new_batch_fwd = r"""             delete distData['PROCESO'];
             if (taskData._assignToWorker && taskData._assignStep) {
                 try {
                     const assignData = JSON.parse(JSON.stringify(distData));
                     assignData['ESTATUS'] = 'PENDIENTE';
                     assignData['AVANCE'] = '0%';
                     internalBatchUpdateTasks(taskData._assignToWorker, [assignData]);
                 } catch(e) {}
             }
             distributionTasks.push(distData);
        } else {"""

code = re.sub(old_batch_fwd, new_batch_fwd, code, count=1)

# 4. Reverse Sync internalBatchUpdateTasks
# Replacing lines from "// Handle Reverse Sync (Vendor -> Antonia)" down to "// Handle Peer-to-Peer Sync"
old_batch_rev = r"""          // Handle Reverse Sync \(Vendor -> Antonia\)
          if \(String\(personName\)\.toUpperCase\(\)\.includes\(\"\(VENTAS\)\"\) && \!isAntonia && distributionTasks\.length > 0\) \{
               internalBatchUpdateTasks\(\"ANTONIA_VENTAS\", distributionTasks, false\);

               // Handle Peer-to-Peer Sync"""

new_batch_rev = r"""          // Handle Reverse Sync (Vendor -> Antonia)
          if (!isAntonia && distributionTasks.length > 0) {
               const syncPayloads = [];
               let antDataFetched = false;
               let antDataRows = [];

               distributionTasks.forEach(taskData => {
                   const getTVal = (keys) => {
                       for (let k of keys) {
                           let found = Object.keys(taskData).find(key => key.toUpperCase().trim() === k);
                           if (found && taskData[found]) return taskData[found];
                       }
                       return "";
                   };

                   const estatus = String(getTVal(['ESTATUS', 'STATUS', 'ESTADO'])).toUpperCase().trim();
                   const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '%'])).replace(/%/g, '').trim();
                   const avanceNum = parseFloat(avanceRaw);
                   const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || avanceRaw === '100' || avanceNum === 100 || avanceNum === 1;
                   const tFolio = String(getTVal(['FOLIO', 'ID'])).toUpperCase().trim();

                   if (tFolio && isDone) {
                       if (!antDataFetched) {
                           const antData = internalFetchSheetData("ANTONIA_VENTAS");
                           if (antData.success && antData.data) antDataRows = antData.data;
                           antDataFetched = true;
                       }

                       const targetRow = antDataRows.find(r => String(r['FOLIO'] || r['ID'] || "").toUpperCase().trim() === tFolio);
                       if (targetRow) {
                           let log = [];
                           try {
                               if (targetRow['PROCESO_LOG']) log = JSON.parse(targetRow['PROCESO_LOG']);
                           } catch(e) {}

                           let updated = false;
                           let updatedLog = [];
                           if (Array.isArray(log)) {
                               updatedLog = log.map(entry => {
                                   let wNorm = String(personName).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "");
                                   let eNorm = entry.assignee ? String(entry.assignee).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "") : "";

                                   if (entry.status === 'IN_PROGRESS' && (eNorm === wNorm || eNorm.includes(wNorm) || wNorm.includes(eNorm) || eNorm === "" || wNorm === "") && isDone) {
                                       entry.status = 'DONE';
                                       updated = true;
                                   }
                                   return entry;
                               });
                           }

                           if (updated) {
                               const stepsOrder = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                               let oldParts = (targetRow["MAP COT"] || "").split(/\||>|\//).map(p => p.trim());
                               let mapCotParts = stepsOrder.map(step => {
                                   const stepEntry = updatedLog.find(e => e.step === step || e.to === step);
                                   if (stepEntry) {
                                       if (stepEntry.status === 'DONE') return '🟢 ' + step;
                                       if (stepEntry.status === 'IN_PROGRESS') return '🟡 ' + step;
                                       if (stepEntry.status === 'PENDING') return '🔴 ' + step;
                                   }
                                   let oldPart = oldParts.find(p => p.includes(step));
                                   if (oldPart && oldPart.includes('🟢')) return '🟢 ' + step;
                                   if (oldPart && oldPart.includes('🟡')) return '🟡 ' + step;
                                   if (oldPart && oldPart.includes('🔴')) return '🔴 ' + step;
                                   return '⚪ ' + step;
                               });

                               let syncToAntonia = {
                                   'FOLIO': targetRow['FOLIO'] || tFolio,
                                   'PROCESO_LOG': JSON.stringify(updatedLog),
                                   'MAP COT': mapCotParts.join(' | ')
                               };

                               const fileCols = ['ARCHIVO', 'F2', 'LAYOUT', 'COTIZACION', 'EVIDENCIA'];
                               fileCols.forEach(col => {
                                   let wKey = Object.keys(taskData).find(k => k.toUpperCase().trim() === col);
                                   if (wKey && taskData[wKey] && String(taskData[wKey]).trim() !== "") {
                                       syncToAntonia[wKey] = taskData[wKey];
                                   }
                               });

                               syncPayloads.push(syncToAntonia);
                           }
                       }
                   }
               });

               if (syncPayloads.length > 0) {
                   internalBatchUpdateTasks("ANTONIA_VENTAS", syncPayloads, false);
               }

               if (String(personName).toUpperCase().includes("(VENTAS)")) {
                   internalBatchUpdateTasks("ANTONIA_VENTAS", distributionTasks, false);
               }

               // Handle Peer-to-Peer Sync"""

code = re.sub(old_batch_rev, new_batch_rev, code, count=1)

with open("CODIGO.js", "w", encoding="utf-8") as f:
    f.write(code)
