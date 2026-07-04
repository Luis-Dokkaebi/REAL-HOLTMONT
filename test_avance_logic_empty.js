let valEstatus = "";
let doneStatuses = ['HECHO', 'TERMINADO', 'FINALIZADO', 'REALIZADO', 'COMPLETADO', 'DONE'];
let isComplete = false;
if (doneStatuses.includes(valEstatus)) {
    isComplete = true;
}
console.log("Empty estatus complete?", isComplete);
