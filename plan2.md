1. **Verificar dependencias de `MAP COT` en `index.html`**
   - El código en `index.html` ya usa `MAP COT` en las vistas y lo renderiza de manera idéntica a "Papa Caliente".
   - El ancho de `MAP COT` es `auto`.

2. **Posición de `MAP COT` entre `ESTATUS` y `AVANCE`**
   - El orden de las columnas de `ANTONIA_VENTAS` está definido en el servidor.
   - Voy a revisar `DEFAULT_SALES_HEADERS` y otros lugares en `CODIGO.js` donde se devuelven los headers para `ANTONIA_VENTAS` y asegurarme de que `MAP COT` esté entre `ESTATUS` y `AVANCE`.
   - Modificaré el orden en `CODIGO.js`.

3. **Ejecutar pruebas en Playwright**
   - Ejecutar pruebas en el frontend para verificar que se muestra la tabla correctamente.

4. **Sincronización `MAP COT` en el servidor**
   - Validar que al avanzar en "Papa Caliente" se envía la petición correcta al servidor y se guarda `MAP COT`.
