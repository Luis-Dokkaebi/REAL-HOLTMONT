# Directorio de Skills y Reglas para Agentes (Holtmont Project)

Este archivo `AGENTS.md` define los "Skills" o habilidades específicas que los agentes de IA (como Claude Code, Cursor, o Jules) deben asumir al operar sobre este repositorio. Estas habilidades encapsulan la arquitectura profunda, las convenciones de estado y las reglas de negocio estrictas de la plataforma Holtmont.

---

## 🛠️ Skill: Monolithic Frontend Mastery
**Descripción:** Capacidad para operar dentro de una arquitectura sin empaquetadores (buildless).
**Cuándo usarlo:** Cada vez que leas, modifiques o crees UI en `index.html`.
**Reglas a seguir:**
- **Inyección Directa:** Todo Vue.js, HTML, y CSS vive en `index.html` (o `workorder_form.html`). No uses Node.js, Webpack, Vite, ni crees archivos `.vue`.
- **CDN Only:** Si necesitas una librería, inclúyela vía CDN en el `<head>`.
- **Sintaxis de Vue 3 (Composition API preferido):** Mantén la lógica reactiva dentro del bloque `<script type="module">` usando `ref()`, `reactive()`, y exponiéndolas globalmente a `window` si interactúan con llamadas de GAS (`google.script.run`).
- **Mocks vs. Datos Reales:** Si creas UI en la vista `PPC_FORM` (ej. botones 'Clasificación', 'Prioridad'), trátalos como **mocks estéticos** a menos que se indique programar su persistencia backend.

---

## 🛡️ Skill: GAS Backend Guardian
**Descripción:** Capacidad para escribir y mantener código backend seguro y funcional en Google Apps Script (GAS).
**Cuándo usarlo:** Cada vez que modifiques `CODIGO.js`.
**Reglas a seguir:**
- **Prohibición de Node en Backend:** El backend es GAS. Ignora paquetes de npm; no sirven en `CODIGO.js`.
- **Puente Frontend-Backend:** El frontend se comunica **exclusivamente** mediante `google.script.run`. Toda función que el frontend llame debe estar definida en el scope global de `CODIGO.js`.
- **Pase de Contexto de Usuario:** Siempre pasa `currentUsername.value` desde Vue.js hacia el backend para registrar auditorías usando la función `registrarLog(user, action_type, description)`.
- **Data Validation Fallbacks:** Al guardar en celdas con listas desplegables (Data Validation), implementa fallbacks estrictos. Ej: Si `ESTATUS` viene vacío o inválido, fuerza `'PENDIENTE'`. Si `CUMPLIMIENTO` viene vacío, fuerza `'NO'`.

---

## 🧬 Skill: Anti-Duplication & Race Condition Resolver
**Descripción:** Prevención absoluta de duplicidad de tareas o filas debido a asincronía y múltiples clicks de usuario.
**Cuándo usarlo:** Al modificar cualquier flujo que cree, actualice o asigne tareas (ej. `apiSaveTrackerBatch`, `internalBatchUpdateTasks`, `apiSavePPCData`).
**Reglas a seguir:**
- **Bloqueo Frontend (`isSubmitting`):** Todo botón de guardado en `index.html` debe ligarse a un estado reactivo `isSubmitting` que prevenga múltiples llamadas simultáneas a GAS.
- **Identidad Temporal (`_tempId`):** Las filas nuevas generan un `_tempId` único en el frontend antes de enviarse.
- **Gatekeeper con CacheService:** En el backend, usa `CacheService.getScriptCache()` usando el `_tempId` y el nombre de la hoja como "Lock" (candado) para bloquear inserciones paralelas del mismo evento.
- **Resolución Histórica (Fallback):** Si estás actualizando y la búsqueda de `FOLIO` o `ID` falla (ej. error de escritura), haz un fallback buscando la combinación exacta de `CONCEPTO` y `FECHA`.
- **Unificación de Estado (Frontend Merge):** El backend **siempre** debe retornar el objeto completo de la tarea modificada (vía `res.data`), incluyendo el `_tempId` original. El frontend usa esto para fusionar datos usando `Object.assign()` y cambiar la bandera local `_isNew` a `false`.

---

## 🧭 Skill: Complex Routing & Reverse Sync
**Descripción:** Capacidad para manejar las reglas idiosincráticas de asignación de tareas en la empresa.
**Cuándo usarlo:** Al tocar lógica de distribución de filas a hojas de personal.
**Reglas a seguir:**
- **La Ley de Antonia (Ventas):** Las asignaciones y el Tracker general *no deben* mezclarse con la tabla core de ventas (`ANTONIA_VENTAS`). Todo enrutamiento general debe enviar las tareas a su Tracker personal ('ANTONIA PINEDA LOPEZ'). Su rol en `USER_DB` tiene `seller: false`.
- **Filtro de Sufijo de Ventas:** Para cualquier usuario que **no** sea Antonia, debes remover silenciosamente el sufijo `(VENTAS)` de la hoja destino globalmente (`targetSheet.replace(/\s*\(VENTAS\)/ig, "").trim()`).
- **Reverse Sync (Prefijo AV-):** Si una tarea tiene el prefijo `AV-` (vino de `ANTONIA_VENTAS`), cualquier actualización lateral en hojas de otros trabajadores debe reflejarse de forma bidireccional enviando los cambios de vuelta a la hoja maestra de Antonia.
- **Distribución Lateral (INVOLUCRADOS):** La sincronización *peer-to-peer* ("Papa Caliente") depende estrictamente de la columna `INVOLUCRADOS`. La columna `VENDEDOR` es restringida y de uso exclusivo de Antonia.

---

## 🕵️ Skill: Dynamic Sheet Parsing & Case-Insensitivity
**Descripción:** Capacidad para leer datos resilientes frente a inconsistencias humanas en Google Sheets.
**Cuándo usarlo:** Al leer o escribir matrices bidimensionales obtenidas con `.getValues()`.
**Reglas a seguir:**
- **No asumas la Fila 1:** Las hojas de personal tienen elementos de UI dibujados arriba de la tabla. Debes buscar dinámicamente la fila de encabezados evaluando si el array contiene columnas clave (ej. `cells.includes("ID")` o `cells.includes("FOLIO")`).
- **Insensibilidad Extrema:** Los payloads del frontend pueden enviar propiedades como `folio`, mientras el backend espera `FOLIO`. Siempre itera sobre las claves de los objetos y compáralas usando `.toUpperCase().trim()`.
- **Interpretación del 100%:** Para la columna `AVANCE`, 100% se puede recibir como string `'100'`, `'100%'`, o como el número entero `1` (el valor crudo de GAS para celdas de porcentaje). Jamás evalúes el string `'1'` o `'1.0'` como cien por ciento, eso es 1%.

---

## 🎨 Skill: Strict Typographical Homogeneity
**Descripción:** Mantener la estética estricta e inmutable de la UI.
**Cuándo usarlo:** Al escribir CSS o HTML en tablas, listas y modales de `index.html`.
**Reglas a seguir:**
- **Regla de Tamaño de Fuente:** Usa `font-size: 11px !important;` y `font-family: 'Arial', sans-serif !important;` en TODAS las tablas (`.table-excel`, `.mini-table`, `.exec-table`, etc.).
- **Regla de Minúsculas en Encabezados:** Los `<th>` de las tablas deben ser minúsculas: `text-transform: lowercase !important;`.
  - *Excepción absoluta:* El encabezado de columna que dice "Folio" o "ID" DEBE ir con mayúscula inicial.
- **Regla de Mayúsculas en Datos:** El contenido (celdas `<td>`, inputs, selectores) debe ser siempre mayúsculas: `text-transform: uppercase !important;`.

---

## 🔌 Skill: Bulletproof External Integrations
**Descripción:** Interacción segura con plataformas de terceros como Make.com y Outlook 365.
**Cuándo usarlo:** Al enviar webhooks o notificaciones calendarizadas.
**Reglas a seguir:**
- **Integridad de Fechas:** Nunca mutar una fecha al enviarla por webhook. Usa exactamente el string estándar `fecha.toISOString()`. Asegúrate de que retenga los milisegundos y la letra "Z" al final para que Make.com parsee correctamente el UTC.
- **Contexto de Origen de Tarea:** Los payloads de webhook (`NotifierService.sendToOutlook`) deben especificar si el registro viene de una "tabla de ventas" o del "tracker general" para que Make formatee correctamente el correo.
- **Sin Micrófono:** No intentes programar APIs de reconocimiento de voz o micrófono (`getUserMedia()`). Google Apps Script bloquea permanentemente estos permisos.

---

## 🧪 Skill: Local Test Runner
**Descripción:** Capacidad para verificar que tus modificaciones no destruyen el entorno de producción.
**Cuándo usarlo:** Inmediatamente después de aplicar cambios y antes de solicitar code review o commit.
**Reglas a seguir:**
- **Verificación de Organigrama:** Ejecuta `node test_departments.js` si tocas `USER_DB` o `INITIAL_DIRECTORY`. Los mapeos de departamentos y bajas (archivos hardcodeados en `CODIGO.js` y `test_departments.js`) deben coincidir perfectamente.
- **Syntax Check Frontend:** Ejecuta `node check_html2.js` para asegurar que las modificaciones en `index.html` (particularmente en los strings multilínea masivos o scripts de Vue incrustados) no contengan errores de sintaxis catastróficos que impidan que el navegador renderice la aplicación.
