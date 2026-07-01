// Ah, look at line 5543.
// syncToAntonia does NOT have 'ESTATUS' or 'AVANCE'.
// So at line 5564: internalBatchUpdateTasks("ANTONIA_VENTAS", syncPayloads, false) it just merges PROCESO_LOG and MAP COT and some fields. It does not complete the task.

// Now look at line 5606: internalBatchUpdateTasks("ANTONIA_VENTAS", safeRevTasks, false);
// safeRevTasks is basically distributionTasks with ['ESTATUS', 'STATUS', 'ESTADO', 'AVANCE', 'AVANCE %', '% AVANCE', '%', 'CUMPLIMIENTO'] deleted.
// SO IT SHOULD NOT COMPLETE THE TASK.

// THEN HOW did "paso a tarea realizada"?
// Look at `internalUpdateTask` (the old API)!
// It executes line 2935: internalBatchUpdateTasks("ANTONIA_VENTAS", [syncToAntonia]);
// Then it executes line 2951: internalBatchUpdateTasks("ANTONIA_VENTAS", [safeSyncData]);
// BUT wait... what if the frontend is calling `apiUpdateTask` (which calls `internalUpdateTask`) instead of `apiSaveTrackerBatch`?
