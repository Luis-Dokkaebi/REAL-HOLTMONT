1. **Script de Limpieza (Deduplicación):**
   - Crear una función `deduplicateAllSheets` en `CODIGO.js`.
   - Iterar por todas las hojas del documento.
   - Leer los datos de cada hoja.
   - Encontrar índices de columnas clave (`FOLIO`, `ID`, `CONCEPTO`, `DESCRIPCION`, `FECHA`, `F. INICIO`).
   - Identificar duplicados:
     - Si hay Folio/ID, mantener un registro de los folios vistos. Si se repite, marcar la fila para eliminación.
     - Si NO hay Folio/ID, concatenar Descripción/Concepto + Fecha y usarlo como llave. Si se repite, marcar la fila para eliminación.
   - Borrar las filas marcadas de abajo hacia arriba para no afectar los índices.

2. **Arreglar la Generación de Folios Secuenciales:**
   - Modificar la función `generateNumericSequence(key)` para que tome una llave (ej. el prefijo 'RR-') y mantenga una secuencia independiente para cada prefijo en las propiedades del script.
   - Buscar todos los lugares donde se usa `Math.random()` para crear folios. Específicamente en:
     - `apiSavePPCData` (línea ~2631): Cambiar `prefix + Math.floor(Math.random() * 1000000)` por `prefix + String(generateNumericSequence(prefix)).padStart(4, '0')`.
     - `internalUpdateTask` (línea ~3393): Cambiar `prefix + Math.floor(Math.random() * 100000)` por la nueva lógica de secuencia usando `activeUser` u origen apropiado (en lugar de `currentSheetName` si queremos que sea quien asigna). Pero nota: el issue menciona que "si RAMIRO RODRIGUEZ le asigna una tarea a SEBASTIAN PADILLA le saldria en folio algo como RR-0001", entonces necesitamos asegurarnos de que la función que genera el folio reciba el usuario que está asignando.
   - Asegurarnos de que el `activeUser` (quien asigna) se pase correctamente para generar el prefijo en todos los puntos de entrada, especialmente en los formularios de la UI.

3. **Pre Commit Steps:**
   - Run the pre commit instructions step to ensure tests, verification and reflection is done.

4. **Submit:**
   - Create a commit to save the changes.
