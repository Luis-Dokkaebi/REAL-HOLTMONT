1. Modify `index.html` `getColumnStyle(h)`:
   - Include 'ALTA' in the array for `isCol(h, ['ESPECIALIDAD', 'AREA', 'DEPTO'])`. Check that `w` is updated to `'30px'` or `'40px'`.

2. Modify `index.html` `addNewRow()`:
   - When creating a new `row`, add auto-generated current date (DD/MM/YY) and time (HH:MM).
   - Inject these into fields that alias 'FECHA' and 'HORA'.

3. Modify `index.html` `saveRow(row, event)` (Fallback for missing dates):
   - Check if `FECHA` or `HORA` aliases exist and are empty; if so, populate them before saving.

4. Modify `index.html` `isMediaColumn(h)`:
   - Add `'CORREO'` and `'CARPETA'` to the array to render the attachment UI.

5. Pre-commit step
