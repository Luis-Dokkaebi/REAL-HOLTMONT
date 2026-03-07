1. En `CODIGO.js`:
   - En la función `apiFetchStaffTrackerData`, cuando agrega columnas para `ANTONIA_VENTAS`, cambiar `PROCESO` por `MAP COT`. Seguirá agregando `PROCESO_LOG`.
   - Modificar las referencias a `PROCESO` a `MAP COT` en `allowedBase`.
2. En `index.html`:
   - En la tabla de `staffTracker` para `ANTONIA_VENTAS` que no es "Papa Caliente" (la vista general), buscar dónde se dibuja la tabla principal de las tareas y asegurar que si la columna es `MAP COT`, renderice exactamente igual a la vista de "Papa Caliente".
   - Ajustar el CSS/estilo de la columna `MAP COT` para que use el espacio enteramente necesario. (En papa caliente es `width: auto;` y usa el componente visual que muestra círculos).
   - En Papa Caliente también cambiar `PROCESO` por `MAP COT`.
   - Modificar las funciones `getProcessStatus`, `getProcessTimeline`, etc., para que lean `MAP COT` en lugar de `PROCESO`.
   - La sincronización: Cuando una fase pasa de rojo a verde en Papa Caliente / MAP COT en el Excel/Tabla, esto debe marcar la siguiente fase que está en rojo para indicar qué fase de la cotización continúa.
   - Posicionar `MAP COT` entre `ESTATUS` y `AVANCE` cuando se hace el render.
