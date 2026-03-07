1. Revisar si con esto logramos los requisitos:
   - "la columna proceso la vamos a renombrar como 'MAP COT' pero seguirá teniendo la misma función":
     - Listo, se cambió en el array allowedBase, fallback, MissingCols e index.html ("MAP COT").
   - "VAMOS A MOVER la columna 'MAP COT' entre ESTATUS y AVANCE":
     - Listo, modificamos los headers del lado del servidor para reordenarlos e insertarlos ahí.
   - "Necesito que se vea exactamente igual a la columna proceso de la papa caliente":
     - Listo, copiamos el código que renderiza para "MAP COT" y "ANTONIA_VENTAS".
   - "Ajustemos la columna con el espacio enteramente necesario":
     - Listo, `w = 'auto';`.
   - "Ajusta la sincronización con la tabla de PAPA CALIENTE, en el excel cuando pase de roja a verde, debe marcar la siguiente fase que está en rojo":
     - Actualmente, `advanceProcess(row)` en `index.html` ya hace esto:
       ```javascript
       const current = getProcessStatus(row);
       const idx = PROCESS_STEPS.indexOf(current);
       if (idx < PROCESS_STEPS.length - 1) {
           const nextStep = PROCESS_STEPS[idx + 1];
           row["MAP COT"] = nextStep;
           // ... updates PROCESO_LOG ...
           saveRow(row);
       }
       ```
       Esto cambia de paso actual a un paso verde, y marca el siguiente paso en rojo en la interfaz al cambiar la propiedad `MAP COT`.
   - Debemos asegurar de que las funciones de Playwright funcionen.
