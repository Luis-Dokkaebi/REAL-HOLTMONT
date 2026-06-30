1. **Ocultar "MAP COT" de la UI**
   - En `index.html`, buscaremos la propiedad computada `visibleTrackerHeaders`.
   - Agregaremos `&& up !== 'MAP COT'` para que la columna original ya no se renderice.
   - En la función `getColumnStyle`, modificaremos el ancho (`w`) para `isCol(h, ['ESTATUS','STATUS'])` a un tamaño mayor (ej. `320px`) cuando el usuario sea `ANTONIA_VENTAS`, para que quepa la línea de tiempo.

2. **Inyectar la Línea de Tiempo en "ESTATUS"**
   - En la plantilla HTML (`index.html`, línea ~2607), buscaremos el bloque `<div v-else-if="isCol(h, ['ESTATUS','STATUS'])" ...>`.
   - Modificaremos su interior (especialmente el caso de `ANTONIA_VENTAS`) para que, además de mostrar el estado textual y el ícono de la flama (botón modal), también renderice la línea de tiempo (bolitas del semáforo) que actualmente está en el bloque de `MAP COT`.
   - Remodelaremos ligeramente el estilo en el `ESTATUS` para que se vea armonioso (por ejemplo, el estatus textual arriba a la izquierda, la flama arriba a la derecha, y la línea de tiempo en la parte inferior de la celda).

3. **Pruebas y Verificación**
   - Ejecutaremos pruebas visuales y los comandos de chequeo del UI.
   - Se validará que no se rompa ninguna lógica de base de datos ni scripts backend (no tocaremos `CODIGO.js`, solo el Frontend para la vista).

4. **Pre-commit Steps**
   - Se ejecutarán las instrucciones de pre-commit para asegurar testing, verificación y reflexión.
