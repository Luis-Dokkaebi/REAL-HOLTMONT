1.  **Define FULL_PROCESS_NAMES in CODIGO.js:** Add the `FULL_PROCESS_NAMES` constant object to `CODIGO.js` (or inline it in the logic) so that the backend has access to the full names of the "Papa Caliente" process steps (e.g., `L` -> `Levantamiento`).
2.  **Modify task distribution in `CODIGO.js` (internalUpdateTask / internalBatchUpdateTasks):**
    *   Find where tasks are distributed to workers (where `taskData._assignToWorker` and `taskData._assignStep` are processed). There are two places where this is done for the Antonia and generic worker logics (e.g., around lines 2778 and 5332 in `CODIGO.js`).
    *   When creating the `assignData` object for the worker, modify the `CONCEPTO` (or `DESCRIPCION`) field to append ` + [Nombre del Proceso]`.
    *   Find the exact original `CONCEPTO` value.
    *   Look up the full process name using `taskData._assignStep` and `FULL_PROCESS_NAMES`.
    *   Update `assignData['CONCEPTO']` (or `DESCRIPCION` depending on which is present in the object) by appending ` [${processName}]` to the original value. We need to be careful to append only once or check if it's already there to avoid duplicates, although during task creation/assignment it usually happens once.
    *   This ensures the worker receives the task with the step explicitly in the title, like "CLIMATIZACION AREA CAFETERIA [Levantamiento]".
3.  **Pre-commit steps:** Follow instructions to ensure testing, verification, review, and reflections are properly executed before submitting.
4.  **Submit changes:** Use the `submit` tool to create a git commit and push changes.
