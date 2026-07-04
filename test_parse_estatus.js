function testStatus() {
    const valEstatus = String("  Asignado ").toUpperCase().trim();
    const doneStatuses = ['HECHO', 'TERMINADO', 'FINALIZADO', 'REALIZADO', 'COMPLETADO', 'DONE'];
    if (doneStatuses.includes(valEstatus)) {
        return true;
    }
    return false;
}
console.log(testStatus());
