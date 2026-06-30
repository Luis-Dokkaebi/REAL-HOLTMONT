/*
 El usuario quiere mover la linea de tiempo interactiva (bolitas / semaforo de papa caliente) de la columna "MAP COT" hacia la columna "ESTATUS".
 Queremos mantener el icono de la flama en la columna "ESTATUS".
 Ademas, ya no necesitariamos la columna "MAP COT" o podriamos ocultarla en el UI (pero mantenerla en DB) o bien, eliminar la inyeccion de MAP COT del UI.

 Para esto:
 1. En `index.html` buscaremos donde se renderiza `ESTATUS`.
 2. Insertaremos la linea de tiempo interactiva de `MAP COT` en `ESTATUS`.
 3. Mantendremos el botón de flama.
 4. Ocultaremos la columna `MAP COT` en el `visibleTrackerHeaders` o evitaremos renderizarla en el layout (haciendo que retorne false si es MAP COT).
*/
