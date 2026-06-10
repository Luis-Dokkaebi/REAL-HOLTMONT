1. **Crear una función `generatePrefix(name)` en `CODIGO.js`**
   - Esta función tomará el nombre del usuario (o `currentSheetName`).
   - Mantendrá los prefijos hardcodeados actuales por compatibilidad:
     - `JESUS_CANTU` -> `JC-`
     - `LUIS_CARLOS` o `ADMINISTRADOR` -> `LC-`
     - `JAIME_OLIVO` -> `JO-`
     - `ANTONIA_VENTAS` -> `AV-`
   - Si no coincide con los hardcodeados, tomará el nombre, lo limpiará (quitará espacios extra o guiones bajos), y tomará las primeras letras de las primeras dos palabras para generar el prefijo.
   - Si solo tiene una palabra, tomará las primeras 2 letras de esa palabra.
   - Siempre se añadirá `-` al final.

2. **Actualizar la generación de prefijos en `CODIGO.js`**
   - Remplazar la lógica inline en `cmdRealizarAlta` (alrededor de la línea 3367) por una llamada a `generatePrefix`.
   - Modificar cualquier otro lugar en `CODIGO.js` donde se asigne el folio `PPC-` por defecto en base al usuario que crea la tarea o proyecto.
     - Específicamente, en `apiSavePPCData` (línea 2617), donde dice `id = "PPC-" + ...` cuando se recibe de Maestro. Actualizarlo para usar el prefijo del usuario de sesión (`username`).
     - Al parecer la línea 2617 se llama en `apiSavePPCData`.

3. **Verificación y Pruebas**
   - Realizar `node syntax_check.js`.
   - Confirmar que los test de integración pasen o al menos que el sintaxis sea válido.

4. **Pre-commit checks**
   - Ejecutar `pre_commit_instructions` tool.
   - Realizar los pasos descritos para asegurar testing, verificación y reflexión.
