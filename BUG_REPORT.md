# Reporte de Bugs de Lógica

A continuación se detallan los bugs lógicos y riesgos de integridad encontrados en el análisis del código (`CODIGO.js` e `index.html`).

## 1. Fragmentación y Desincronización de Datos (Caso: ANTONIA_VENTAS)
**Severidad:** Alta
**Descripción:** Existe una lógica inconsistente en el manejo de datos para el usuario `ANTONIA_VENTAS`, lo que provoca que la información esté fragmentada y desactualizada entre distintas hojas.
*   **Guardado (`apiSavePPCData`):** Al crear una tarea, se guarda en `PPCV3` (Maestra) y se duplica en `PPCV4` (Hoja de Antonia).
*   **Actualización (`apiUpdatePPCV3`):** Si Antonia actualiza una tarea desde el "Weekly Plan", el sistema redirige la escritura **exclusivamente** a `PPCV4`.
*   **Consecuencia:** La hoja maestra `PPCV3` nunca recibe las actualizaciones (avances, comentarios, estatus) de las tareas de Antonia, quedando con datos obsoletos ("Zombie records"). Además, existe una tercera hoja `ANTONIA_VENTAS` (Tracker) que se actualiza por otra vía (`apiUpdateTask`), creando una triple fuente de verdad no sincronizada.

## 2. Orden de Inserción Incorrecto en PPC Maestro
**Severidad:** Media
**Descripción:** La función `internalBatchUpdateTasks` inserta siempre las nuevas filas al principio de la lista de datos (`insertRowsBefore(headerRowIndex + 2)`).
*   **Regla de Negocio:** Según la documentación/memoria, las tareas en `PPCV3` deberían agregarse **al final** de la hoja (append).
*   **Impacto:** El orden cronológico de las tareas se invierte visualmente en la hoja de cálculo, lo que puede afectar la legibilidad y el seguimiento histórico si el usuario espera ver lo más nuevo al final.

## 3. Vulnerabilidad Crítica de Seguridad (Impersonalización)
**Severidad:** Crítica
**Descripción:** Funciones sensibles del backend confían ciegamente en argumentos proporcionados por el cliente (frontend) para determinar permisos, en lugar de verificar la sesión activa.
*   **Ejemplo (`apiFetchTeamKPIData`):** Acepta `username` como argumento. Un usuario malintencionado puede invocar `google.script.run.apiFetchTeamKPIData('LUIS_CARLOS')` desde la consola del navegador y obtener datos confidenciales de administración sin ser administrador.
*   **Ejemplo (`apiSavePPCData`):** Acepta `activeUser` como argumento para decidir si escribe en hojas protegidas (`PPCV4`), permitiendo suplantación de identidad.

## 4. Fragilidad en el Parseo de Fechas (Hardcoded Locale)
**Severidad:** Media
**Descripción:** La lógica de parseo de fechas en el backend asume un formato fijo `DD/MM/YYYY`.
*   **Código:** `new Date(pts[2], pts[1]-1, pts[0])` (donde `pts` es `[d, m, y]`).
*   **Riesgo:** Si la configuración regional de la Hoja de Cálculo (Spreadsheet Settings) cambia a "Estados Unidos" (donde las fechas se formatean como `MM/DD/YYYY`), o si un usuario ingresa fechas manuales en formato ISO, el sistema interpretará los días como meses (ej: 05/12 se lee como 12 de Mayo en vez de 5 de Diciembre), corrompiendo cálculos de KPIs y tiempos de entrega.

## 5. Riesgo de Colisión de IDs
**Severidad:** Baja/Media
**Descripción:** La generación de IDs para tareas generales utiliza `Math.random()`: `"PPC-" + Math.floor(Math.random() * 1000000)`.
*   **Problema:** No se verifica si el ID generado ya existe en la base de datos antes de guardar.
*   **Riesgo:** Aunque la probabilidad es baja, una colisión de ID provocaría que una tarea nueva sobrescriba silenciosamente a una antigua durante un `batchUpdate`, resultando en pérdida de datos.

## 6. Sincronización Inversa Defectuosa
**Severidad:** Baja
**Descripción:** La función `internalUpdateTask` intenta sincronizar cambios de vendedores hacia `ANTONIA_VENTAS`. Sin embargo, esta lógica no se propaga hacia `PPCV3` ni `PPCV4`. Si un vendedor actualiza su avance, Antonia lo ve en su tracker personal, pero el "PPC Maestro" y el "Weekly Plan" (PPCV4) permanecen desactualizados.
