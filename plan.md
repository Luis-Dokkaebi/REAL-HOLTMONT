1. **Crear nuevas hojas en Google Sheets (Backend)**: Modificar `CODIGO.js` para usar diferentes hojas de Google Sheets según la división seleccionada, garantizando así la permanencia y separación de los datos. En lugar de guardar en un único `PPC_BORRADOR`, guardar en `PPC_PROYECTO`, `PPC_INTERNA`, `PPC_CLIENTE`, `PPC_GENERAL`, `PPC_POR_PROYECTO`.
2. **Actualizar Backend (`CODIGO.js`)**: Modificar `apiFetchDrafts`, `apiSyncDrafts` y `apiClearDrafts` para aceptar un parámetro opcional con la división y operar sobre la hoja correspondiente.
3. **Modificar Frontend (`index.html`)**:
    - Actualizar llamadas a backend (`apiFetchDrafts`, `apiSyncDrafts`, `apiClearDrafts`) para que pasen el nombre de la división actual como parámetro (`ppcMenuTipo.value`).
    - Recargar o borrar `activityQueue` adecuadamente al cambiar de división.
    - Asegurarse de que `PPC_FORM` recargue los borradores guardados para la división seleccionada cuando se abre la división.
4. **Modificar el Botón Atrás (`index.html`)**: Añadir un botón "Atrás" en la vista `PPC_FORM` si la navegación fue iniciada desde el Menú (`PPC_MENU`). De hecho, hay un botón de "Menú" que vuelve a `PPC_MENU`, voy a revisar si esto cumple la solicitud o si hay que crear otro. El usuario dijo: "agrega uno nuevo que diga Atrás". Así que voy a agregar un botón secundario adicional "Atrás".
5. **Ejecutar pasos pre-commit**: Asegurarme de verificar la sintaxis, probar la interfaz usando los scripts correspondientes y completar la revisión de los cambios.
6. **Enviar**: Hacer un commit con los cambios propuestos y un mensaje descriptivo.
