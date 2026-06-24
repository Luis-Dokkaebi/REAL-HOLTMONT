console.log("El problema es que cuando LILIANA guarda TODO, se duplican las tareas, a veces triplican.");
console.log("¿Cuál es el proceso que llama 'saveAllTrackerRows'?");
console.log("saveAllTrackerRows llama a apiSaveTrackerBatch con todos los datos que hay en 'staffTracker.value.data'.");
console.log("¿Y qué hace apiSaveTrackerBatch?");
console.log("Llama a internalBatchUpdateTasks para guardarlas.");
console.log("¿Por qué se duplicarían?");
console.log("1. Si las tareas enviadas a apiSaveTrackerBatch NO TIENEN ID / FOLIO, el servidor asume que son nuevas (si fallan los gatekeepers).");
console.log("2. O, si la respuesta de saveAllTrackerRows NO ACTUALIZA el local, el usuario le vuelve a dar click a Guardar Todo, mandando todo como si fueran nuevas otra vez sin ID.");
