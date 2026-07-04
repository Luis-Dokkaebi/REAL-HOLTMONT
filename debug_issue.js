// 1. In index.html, when Antonia adds a worker, advanceProcess() sets:
// row._assignToWorker = selectedWorkers
// row._assignStep = currentStatus
// row.PROCESO_LOG = JSON.stringify(log)
// It then calls apiUpdateTask("ANTONIA_VENTAS", row).
//
// 2. CODIGO.js apiUpdateTask handles it:
// `isAntonia` is true.
// The `distData` contains the original data except `PROCESO_LOG` and `PROCESO` are removed.
// We loop through workers.
// We set assignData['ESTATUS'] = 'PENDIENTE';
// We set assignData['AVANCE'] = '0%';
// We call internalBatchUpdateTasks(cleanWorker, [assignData]).
// THIS worker will have ESTATUS 'PENDIENTE' and AVANCE '0%', so NOT complete in their sheet.
//
// 3. For Antonia's sheet, `processedTasks` is passed to:
// internalBatchUpdateTasks(personName, processedTasks, false);
// personName is "ANTONIA_VENTAS".
// The tasks inside `processedTasks` have the SAME 'ESTATUS' and 'AVANCE' as sent from frontend!
// Wait! If the task sent from the frontend to `apiUpdateTask` had "ESTATUS: PENDIENTE",
// why would it be considered Complete for Antonia's sheet?
// Let's check what `isComplete` thinks of it.
// If Antonia's sheet has `ESTATUSIdx` or `avanceIdx`.
