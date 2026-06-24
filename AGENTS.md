# Guía de Agentes y Skills para el Proyecto Holtmont (AGENTS.md)

Este documento define el contexto técnico, las reglas de negocio y las "skills" que los agentes de IA (y desarrolladores) deben utilizar al interactuar con el código base del sistema Holtmont. Al trabajar en este repositorio, debes adherirte estrictamente a estas pautas para evitar romper funcionalidades críticas.

## 1. Dominio del Stack Tecnológico (GAS + Vue.js Monolítico)

- **Backend (Google Apps Script - GAS):**
  - Todo el código backend reside en `CODIGO.js`.
  - El frontend se comunica con el backend exclusivamente mediante `google.script.run`.
  - No intentes usar librerías de Node.js en el backend, el entorno de ejecución es Google Apps Script.
- **Frontend Monolítico:**
  - Toda la interfaz de usuario reside en un único archivo `index.html`.
  - El proyecto utiliza **Vue.js** importado mediante CDN (sin build step / no Node.js).
  - No introduzcas herramientas de compilación como Webpack o Vite. Todo el código CSS, HTML y JS del frontend debe estar inyectado o definido en línea dentro del propio `index.html`.

## 2. Prevención de Condiciones de Carrera y Duplicación

- **Frontend `_tempId`:**
  - Al crear una nueva fila, el frontend genera un `_tempId` y envía la solicitud asíncrona.
  - El frontend bloquea envíos duplicados con una bandera reactiva `isSubmitting`.
- **Backend Gatekeeper:**
  - La función `internalBatchUpdateTasks` actúa como protector (Gatekeeper). Utiliza `CacheService` usando el `_tempId` para bloquear ejecuciones concurrentes en la misma fila.
- **Resolución de Conflictos:**
  - Si un `FOLIO` no se encuentra, el sistema **siempre** debe intentar hacer coincidir las filas por la combinación de `CONCEPTO` y `FECHA`. Generar un nuevo `FOLIO` es el último recurso.
- **Respuesta Esperada:**
  - Las funciones backend como `apiSaveTrackerBatch` o `apiSavePPCData` deben retornar el objeto actualizado completo mediante `res.data` para que el frontend pueda fusionarlo y setear `_isNew = false`.

## 3. Reglas de Negocio Únicas (Routing y Sincronización)

- **El Caso Especial de Antonia (Ventas):**
  - Cualquier tarea originada desde `ANTONIA_VENTAS` (prefijo de folio "AV-") requiere "Reverse Sync" (sincronización bidireccional). Las actualizaciones hechas por otros miembros del equipo a esas tareas deben sincronizarse de vuelta a la hoja `ANTONIA_VENTAS`.
  - **Restricción de Enrutamiento Global:** Para cualquier otro usuario, está estrictamente prohibido enviar tareas a hojas que terminen en `(VENTAS)`. El código debe eliminar globalmente este sufijo usando `.replace(/\s*\(VENTAS\)/ig, "").trim()` (ver `apiSavePPCData` y `apiSaveTrackerBatch`).
- **Distribución Lateral ("Papa Caliente"):**
  - La delegación lateral y el seguimiento del equipo utilizan la columna `INVOLUCRADOS`. Modificar la lógica aquí debe hacerse con cuidado y respetando el "timeline" (`ESTATUS`). La columna `VENDEDOR` es exclusiva para asignaciones desde `ANTONIA_VENTAS`.

## 4. Manejo Avanzado de Google Sheets y Procesamiento de Datos

- **Búsqueda Dinámica de Encabezados:**
  - Las hojas de cálculo del personal tienen elementos de UI sobre los datos. No asumas que la fila 1 contiene los encabezados. Busca de forma dinámica el array de celdas que coincida estrictamente con elementos como `"ID"`.
- **Comparación Insensible (Case-Insensitive):**
  - Los datos que vienen del frontend pueden tener claves en minúscula (ej., `folio`). Todas las iteraciones y validaciones críticas (como buscar `FOLIO` o `ID`) deben usar `.toUpperCase().trim()`.
- **Evaluación de Progreso (AVANCE):**
  - 100% debe evaluarse como `'100'`, `'100%'` o, muy importante, el valor numérico `1` que retorna GAS para celdas con formato de porcentaje. Nunca evalúes el string `'1'` o `'1.0'` como 100%.

## 5. Integraciones: Make.com y Outlook

- **Manejo de Fechas:**
  - Los webhooks enviados a Make.com **deben** mantener el formato ISO 8601 (`.toISOString()`), incluyendo milisegundos y la "Z" UTC. No los elimines.
- **Payloads de Notificación:**
  - El sistema de notificación (Make.com -> Outlook) depende de conocer el origen de la tarea. Asegúrate de incluir indicadores de si la tarea proviene de `ANTONIA_VENTAS` (tabla de ventas) o del Tracker general.
- **Emails Reales:**
  - Los usuarios en `USER_DB` están mapeados a sus correos corporativos reales (`@holtmont.com`). Verifica esto antes de probar integraciones.

## 6. Testing Local y Verificaciones

- **Mocking Local:**
  - Las funciones en `CODIGO.js` deben probarse creando stubs para los servicios de GAS (ej. `SpreadsheetApp`, `CacheService`, `PropertiesService`).
- **Scripts de Verificación:**
  - Siempre debes ejecutar las pruebas pertinentes tras modificaciones:
    - Directorio y Departamentos: `node test_departments.js`
    - Sintaxis y Lógica de Frontend: `node check_html2.js` (si `check_html.js` falla por errores de parseo o compatibilidad, utiliza `check_html2.js` como respaldo funcional).

## 7. Homogeneidad de UI / CSS Estricto

- **Reglas Tipográficas:**
  - Aplica de forma unificada en tablas (`.table-excel`, `.mini-table`, `.exec-table`, `.table`):
    - Tamaño y fuente: `font-size: 11px !important; font-family: 'Arial', sans-serif !important;`
  - **Encabezados:** Todos en minúsculas (`text-transform: lowercase !important;`), a excepción explícita del encabezado 'Folio' o 'ID'.
  - **Celdas y Formularios:** Todos los datos (textos, inputs, selects) en mayúsculas (`text-transform: uppercase !important;`).
- **Restricciones Funcionales UI:**
  - No implementes funciones con micrófonos, dado que GAS bloquea su uso.
  - Algunos elementos visuales (ej., ciertos botones o columnas en `PPC_FORM`) son meramente "mocks" estéticos y no deben acoplarse con persistencia de base de datos a menos que se solicite explícitamente.
