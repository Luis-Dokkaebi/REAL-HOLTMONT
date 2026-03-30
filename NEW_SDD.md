# Spec Driven Development (SDD): Mejoras en Tablas Staff_Tracker

## 1. Visión General del Negocio
El cliente ha solicitado una serie de mejoras en la visualización y funcionalidad de las tablas del `Staff_Tracker` dentro de la plataforma Holtmont Workspace. El objetivo de estos cambios es optimizar el espacio en pantalla, automatizar el registro de tiempos de asignación y facilitar la adjunción de archivos de gran tamaño directamente desde la interfaz.

### 1.1 Objetivo del SDD
Este documento define las especificaciones funcionales y técnicas para implementar la optimización de la columna "ALTA", el registro automático de fecha y hora, el cálculo dinámico de días transcurridos en la columna "RELOJ", y la integración de botones de adjuntos en columnas específicas.

### 1.2 Alcance
**Importante:** Estas modificaciones aplican de manera **exclusiva al módulo PPC Maestro** y a las tablas principales del Tracker (hojas individuales del personal que no son de ventas).
**Quedan explícitamente excluidas:**
1.  **La tabla principal de `ANTONIA_VENTAS`:** Estas funciones no aplican ni tienen relación con la tabla o vistas de este perfil.
2.  **Hojas de Ventas:** Todas las hojas o vistas que contengan el sufijo `(VENTAS)` en su nombre quedan excluidas, ya que a estos perfiles se les asigna la actividad directamente por medio del PPC Maestro y poseen una estructura distinta.
La lógica de frontend y backend deberá evaluar el contexto activo (`currentView === 'PPC_FORM' || 'PPC_DINAMICO'`) o el nombre de la hoja (`staffTracker.name`) para habilitar o deshabilitar estos comportamientos.

## 2. Requerimientos Funcionales y Casos de Uso

### 2.1 Optimización de la Columna "ALTA"
*   **Descripción del Problema:** Actualmente, la columna "ALTA" ocupa un ancho excesivo en la pantalla, considerando que únicamente almacena y muestra un solo carácter (por ejemplo, 'D' para Diseño, 'C' para Construcción). Este espacio muerto reduce la visibilidad de otras columnas más críticas (como el Concepto o los Estatus).
*   **Comportamiento Esperado:**
    *   La columna "ALTA" (y sus alias como 'AREA', 'ESPECIALIDAD', 'DEPTO') debe renderizarse con un ancho mínimo (por ejemplo, `30px` o `40px`).
    *   El texto debe estar centrado para mantener la estética.
    *   El control subyacente (el elemento `<select>` invisible que permite cambiar el valor) debe seguir funcionando correctamente en el área reducida.

### 2.2 Registro Automático de "FECHA" y "HORA" de Asignación
*   **Descripción del Problema:** Al crear una nueva fila (`addNewRow`) o al guardar una asignación de actividad, el sistema no está poblando automáticamente los campos de fecha y hora en los que la acción está ocurriendo (ejemplo: "Hoy 30/03/26"). Esto requiere entrada manual y se presta a omisiones (celdas vacías).
*   **Comportamiento Esperado:**
    *   **Creación de Fila:** Al presionar el botón "Nueva Fila" (`+ Fila`), si las columnas "FECHA" (o alias como 'ALTA', 'FECHA INICIO') y "HORA" existen en la tabla, el sistema debe autocompletarlas con la fecha y hora locales del momento de creación.
    *   **Guardado (Fallback):** Al guardar una fila (`saveRow`), si la celda "FECHA" está vacía, el sistema debe inyectar la fecha actual antes de enviarla al backend (`CODIGO.js`). De igual forma con la celda "HORA".
    *   **Formatos:**
        *   `FECHA`: `DD/MM/YY` (Ej. `30/03/26`).
        *   `HORA`: `HH:MM` (Ej. `14:30` o `02:30 PM`, dependiendo de la convención de la empresa, preferiblemente 24h para consistencia, ej. `14:30`).

### 2.3 Cálculo Dinámico de Días en "RELOJ"
*   **Descripción del Problema:** El cliente necesita visualizar de manera inmediata cuántos días han transcurrido desde que una actividad se dio de alta (Fecha Inicial) hasta el día actual.
*   **Comportamiento Esperado:**
    *   La columna denominada "RELOJ" (o sus equivalentes como "DIAS", "DÍAS FINALIZ. COTIZ") debe mostrar un entero que represente la diferencia en días.
    *   **Fórmula:** `Días = (Fecha Actual) - (Fecha Inicial o Fecha de Alta)`.
    *   **Ejemplo:** Si la Fecha Inicial es `28/03/26` y la Fecha Actual es `30/03/26`, la columna "RELOJ" mostrará `2`.
    *   Este cálculo debe ocurrir dinámicamente en el Frontend (`index.html`) cada vez que se carga la tabla o se modifica la Fecha Inicial, sobrescribiendo cualquier valor estático enviado por el Backend, garantizando así precisión en tiempo real.

### 2.4 Botón de Adjuntos en "Correo" y "Carpeta"
*   **Descripción del Problema:** Las columnas "Correo" y "Carpeta" actúan como repositorios de evidencias, pero carecen de una interfaz intuitiva (como un botón de clip) que indique al usuario que puede adjuntar archivos ahí. Además, se requiere soporte para archivos de hasta 100MB.
*   **Comportamiento Esperado:**
    *   Las columnas "Correo", "Carpeta" (y potencialmente "Fecha respuesta" si se desea) deben renderizarse en el Frontend de manera similar a las columnas "COTIZACION" o "F2", mostrando un botón con un ícono (ej. un clip o una carpeta).
    *   Al hacer clic en este botón, se debe abrir el selector de archivos del sistema operativo.
    *   Al seleccionar un archivo, el sistema subirá el archivo a Google Drive (vía `uploadFileToDrive`).
    *   **Consideración Técnica (100MB):** La función `uploadFileToDrive` nativa en Google Apps Script usando `FileReader` y codificación Base64 en el Frontend (`index.html`) tiene un límite duro estricto de alrededor de **50MB** debido a las cuotas de ejecución de Apps Script (`UrlFetchApp` o manipulación de blobs). Para soportar estrictamente archivos de hasta 100MB sin fallos, el sistema actual requeriría una reingeniería hacia Subidas Resumibles (Resumable Uploads vía Google Drive REST API directa desde el cliente). Sin embargo, para la implementación inmediata, habilitaremos el botón estándar que soporta el límite actual (aprox. 50MB) y advertiremos al usuario de esta restricción técnica de la infraestructura actual, o bien, confiaremos en la cuota si los archivos suelen ser menores.

## 3. Arquitectura de Datos y Cambios Técnicos

### 3.1 Frontend (`index.html`)

1.  **Ajuste de Estilos (Columna ALTA):**
    *   **Archivo:** `index.html` -> `<script>` -> `getColumnStyle(h)`
    *   **Acción:** Localizar la condición `isCol(h, ['ESPECIALIDAD', 'AREA', 'DEPTO'])` y agregar `'ALTA'` al array. Asegurar que `w = '30px'` o `w = '40px'`.

2.  **Generación de Fecha/Hora Automática:**
    *   **Archivo:** `index.html` -> `<script>` -> `addNewRow()`
    *   **Acción:** Al crear el objeto `row`, instanciar `new Date()`. Formatear la fecha a `DD/MM/YY` y la hora a `HH:MM`.
    *   Inyectar estos valores en las celdas cuyos *headers* (alias) coincidan con 'FECHA' y 'HORA'.
    *   **Restricción de Alcance:** Antes de aplicar la lógica, verificar que no sea la hoja de Antonia Ventas (`staffTracker.value.name !== 'ANTONIA_VENTAS'`) y que no sea una hoja de ventas (`!staffTracker.value.name.includes('(VENTAS)')`).
    *   **Código Propuesto:**
        ```javascript
        const sheetName = String(staffTracker.value.name).toUpperCase();
        const isExcludedSheet = sheetName.includes('(VENTAS)') || sheetName === 'ANTONIA_VENTAS';
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = String(now.getFullYear()).slice(-2);
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');

        staffTracker.value.headers.forEach(h => {
            const hUp = String(h).toUpperCase().trim();
            if (isCol(h, ['DIAS','RELOJ','DÍAS FINALIZ. COTIZ'])) {
                row[h] = 0;
            } else if (!isExcludedSheet && (hUp === 'FECHA' || hUp === 'ALTA' || hUp === 'FECHA INICIO')) {
                row[h] = `${d}/${m}/${y}`;
            } else if (!isExcludedSheet && hUp === 'HORA') {
                row[h] = `${hh}:${mm}`;
            } else {
                row[h] = "";
            }
        });
        ```

3.  **Lógica del Contador de Días ("RELOJ"):**
    *   **Archivo:** `index.html` -> `<script>` -> `calculateDiasCounter(row)`
    *   **Acción:** Actualmente, la función busca la columna de días: `const hDias = staffTracker.value.headers.find(h => isCol(h, ['DIAS','RELOJ','DÍAS FINALIZ. COTIZ', ...]))`. Esto ya detecta 'RELOJ'.
    *   La resta de fechas ya está implementada en esta función: `const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));`.
    *   **Validación y Alcance:** Verificar que la función opere correctamente y condicionar su ejecución o el renderizado visual para asegurar que las reglas de exclusión (hojas `(VENTAS)` y tabla de `ANTONIA_VENTAS`) se respeten rigurosamente.

4.  **UI Botones de Archivos ("Correo", "Carpeta"):**
    *   **Archivo:** `index.html` -> `<script>` -> `isMediaColumn(h)`
    *   **Acción:** Agregar `'CORREO'` y `'CARPETA'` al array devuelto por esta función para que el renderizado de la tabla en Vue muestre la lógica de adjuntos.
    *   **Código Actual:**
        ```javascript
        const isMediaColumn = (h) => ['F2','COTIZACION','COT','COTIZACIÓN','TIMEOUT','TIME OUT','LAYOUT','TIMELINE','INFO CLIENTE', 'CORREO', 'CARPETA'].includes(String(h).toUpperCase());
        ```
    *   **Renderizado (HTML):** El Vue template (alrededor de la línea `<div v-else-if="isMediaColumn(h)" ...>`) detectará estas columnas y renderizará automáticamente el botón `<button @click="openCellUpload(row, h)">` y los enlaces a los archivos existentes si los hay.

### 3.2 Backend (`CODIGO.js`) - Validaciones (Opcional)

Si bien la mayoría de los cambios son visuales y de autocompletado en el frontend, el backend debe estar preparado para recibir y persistir las nuevas columnas si es que se agregan por primera vez a hojas existentes.
*   En `internalBatchUpdateTasks`, la lógica actual (`getColIdx`) utiliza mapeos. Si se agrega una columna "HORA", se guardará como cualquier texto plano.
*   En `apiSaveTrackerBatch`, el "Auto-Archiving Trigger" (`processQuoteRow`) no se verá afectado ya que evalúa explícitamente `'COTIZACION'` o `'ARCHIVO'`, por lo que subir a `'CORREO'` o `'CARPETA'` no disparará archivo automático en el Banco de Cotizaciones (a menos que se añadan estos alias, lo cual no fue solicitado).

## 4. Pruebas de Integración y Validaciones

Para garantizar que los cambios cumplen con lo solicitado sin romper funcionalidad existente, se realizarán las siguientes pruebas:

### 4.1 Prueba: Columna "ALTA"
*   **Acción:** Iniciar sesión y navegar al `Staff_Tracker`.
*   **Verificación:** Observar la cabecera "ALTA". Su ancho debe ser considerablemente menor, ocupando solo lo necesario para mostrar "D" o "C". El menú desplegable subyacente debe seguir desplegándose al hacer clic.

### 4.2 Prueba: Fecha y Hora Automáticas
*   **Acción:** En el `Staff_Tracker`, hacer clic en el botón `+ Fila`.
*   **Verificación:** La nueva fila generada debe contener en las columnas "FECHA" y "HORA" (si existen) la fecha y hora exacta del sistema en ese instante.

### 4.3 Prueba: Columna "RELOJ"
*   **Acción:** Crear una fila. Modificar manualmente la "FECHA" a 3 días atrás (ej. si hoy es 30/03/26, establecer 27/03/26).
*   **Verificación:** Observar la columna "RELOJ". Inmediatamente después de salir del campo de fecha, "RELOJ" debe cambiar a `3`.

### 4.4 Prueba: Adjuntos en "Correo" y "Carpeta"
*   **Acción:** Identificar las columnas "Correo" y "Carpeta" en la tabla.
*   **Verificación 1:** Deben renderizarse con el botón de "Clip" o similar, no como una caja de texto simple.
*   **Acción:** Hacer clic en el botón y seleccionar un archivo de prueba.
*   **Verificación 2:** Aparecerá el spinner de "Cargando...". Al finalizar, el texto de la celda se actualizará con la URL del archivo de Google Drive.
*   **Advertencia Técnica:** Probar con un archivo > 50MB resultará en un error del navegador "Payload too large" o error 413, demostrando el límite de Apps Script. Se considerará exitoso el flujo UI para archivos soportados.

## 5. Resumen de Aprobación
Este SDD detalla soluciones pragmáticas y directas a través de modificaciones en `index.html` (principalmente lógica en Vue.js y CSS) para satisfacer los requerimientos del usuario. La arquitectura actual soporta nativamente la extensión propuesta para los adjuntos y el cálculo dinámico de días.