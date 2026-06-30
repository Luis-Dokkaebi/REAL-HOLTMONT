const fs = require('fs');

let codigoJS = fs.readFileSync('CODIGO.js', 'utf8');

// A very lightweight mock to test the exact logic block from CODIGO.js lines ~5456 to 5556

function testReverseSync() {
    let taskData = { 'FOLIO': 'AV-0001', 'ESTATUS': 'HECHO', 'AVANCE': '100%' };
    let distributionTasks = [taskData];
    let isAntonia = false;
    let personName = "ANGEL SALINAS";

    let dbAntonia = [
        { 'FOLIO': 'AV-0001', 'MAP COT': '⚪ L | 🟡 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC', 'PROCESO_LOG': JSON.stringify([
            { step: 'CD', status: 'IN_PROGRESS', assignee: 'ANGEL SALINAS' },
            { step: 'CD', status: 'IN_PROGRESS', assignee: 'OTRO TRABAJADOR' }
        ]) }
    ];

    function internalFetchSheetData(sheet) { return {success: true, data: dbAntonia}; }
    function internalBatchUpdateTasks(sheet, payload) { dbAntonia[0] = Object.assign(dbAntonia[0], payload[0]); }
    function registrarLog() {}

    // ---- EXTRACTED LOGIC FROM apiSaveTrackerBatch ----
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
            const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'])).replace(/%/g, '').trim();
            const avanceNum = parseFloat(avanceRaw);
            const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || estatus === 'REALIZADO' || estatus === 'COMPLETADO' || estatus === 'DONE' || avanceRaw === '100' || avanceNum === 100 || avanceRaw.toUpperCase() === 'SI';
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
                            let wNorm = String(personName).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ");
                            let eNorm = entry.assignee ? String(entry.assignee).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ") : "";

                            if (entry.status === 'IN_PROGRESS' && (eNorm === wNorm || eNorm.includes(wNorm) || wNorm.includes(eNorm) || eNorm === "" || wNorm === "") && isDone) {
                                entry.status = 'DONE';
                                entry.endTimestamp = new Date().getTime();
                                entry.endDateStr = new Date().toLocaleString();
                                updated = true;
                            }
                            return entry;
                        });
                    }

                    if (updated) {
                        const stepsOrder = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                        let oldParts = (targetRow["MAP COT"] || "").split(/\||>|\//).map(p => p.trim());
                        let mapCotParts = stepsOrder.map(step => {
                            const stepEntries = updatedLog.filter(e => e.step === step || e.to === step);
                            if (stepEntries.length > 0) {
                                const allDone = stepEntries.every(e => e.status === 'DONE');
                                if (allDone) return '🟢 ' + step;
                                const anyInProgress = stepEntries.some(e => e.status === 'IN_PROGRESS');
                                if (anyInProgress) return '🟡 ' + step;
                                return '🔴 ' + step;
                            }
                            // Garbage handling simplified out for this test...
                            let oldPart = oldParts.find(p => p === '🟢 ' + step || p === '🟡 ' + step || p === '🔴 ' + step || p === '⚪ ' + step || p.includes(' ' + step));
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

                        syncPayloads.push(syncToAntonia);
                    }
                }
            }
        });

        if (syncPayloads.length > 0) {
            internalBatchUpdateTasks("ANTONIA_VENTAS", syncPayloads, false);
        }
    }
    // ---- END EXTRACTED LOGIC ----

    console.log("After Reverse Sync 1 (Angel finishes):");
    console.log(dbAntonia[0]['MAP COT']);

    // Now OTRO TRABAJADOR finishes
    personName = "OTRO TRABAJADOR";
    syncPayloads = []; // Reset context
    // Rerun the logic inside the block above via function
    runReverseSyncLogicForWorker(personName);

    console.log("After Reverse Sync 2 (Otro finishes):");
    console.log(dbAntonia[0]['MAP COT']);

    function runReverseSyncLogicForWorker(workerName) {
        personName = workerName;
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
            const avanceRaw = String(getTVal(['AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'])).replace(/%/g, '').trim();
            const avanceNum = parseFloat(avanceRaw);
            const isDone = estatus === 'HECHO' || estatus === 'TERMINADO' || estatus === 'FINALIZADO' || estatus === 'REALIZADO' || estatus === 'COMPLETADO' || estatus === 'DONE' || avanceRaw === '100' || avanceNum === 100 || avanceRaw.toUpperCase() === 'SI';
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
                            let wNorm = String(personName).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ");
                            let eNorm = entry.assignee ? String(entry.assignee).toUpperCase().trim().replace(/\s*\(VENTAS\)/g, "").replace(/_/g, " ") : "";

                            if (entry.status === 'IN_PROGRESS' && (eNorm === wNorm || eNorm.includes(wNorm) || wNorm.includes(eNorm) || eNorm === "" || wNorm === "") && isDone) {
                                entry.status = 'DONE';
                                entry.endTimestamp = new Date().getTime();
                                entry.endDateStr = new Date().toLocaleString();
                                updated = true;
                            }
                            return entry;
                        });
                    }

                    if (updated) {
                        const stepsOrder = ["L", "CD", "EP", "CI", "EV", "CEC", "RCC"];
                        let oldParts = (targetRow["MAP COT"] || "").split(/\||>|\//).map(p => p.trim());
                        let mapCotParts = stepsOrder.map(step => {
                            const stepEntries = updatedLog.filter(e => e.step === step || e.to === step);
                            if (stepEntries.length > 0) {
                                const allDone = stepEntries.every(e => e.status === 'DONE');
                                if (allDone) return '🟢 ' + step;
                                const anyInProgress = stepEntries.some(e => e.status === 'IN_PROGRESS');
                                if (anyInProgress) return '🟡 ' + step;
                                return '🔴 ' + step;
                            }
                            let oldPart = oldParts.find(p => p === '🟢 ' + step || p === '🟡 ' + step || p === '🔴 ' + step || p === '⚪ ' + step || p.includes(' ' + step));
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

                        syncPayloads.push(syncToAntonia);
                    }
                }
            }
        });

        if (syncPayloads.length > 0) {
            internalBatchUpdateTasks("ANTONIA_VENTAS", syncPayloads, false);
        }
    }

}

testReverseSync();
