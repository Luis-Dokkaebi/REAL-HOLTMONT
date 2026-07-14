# Prompt para Generar Script de Importación (Google Apps Script)

**Contexto:**
Necesitamos una función en Google Apps Script (`CODIGO.js`) para importar datos desde una hoja de cálculo externa hacia nuestra plataforma (`PPCV3`). La hoja de origen tiene un formato "apilado" por semanas, no una tabla plana simple.

**Instrucciones para la IA / Desarrollador:**

"Actúa como un experto en Google Apps Script y genera una función llamada `importarPPCExterno` para el archivo `CODIGO.js`.

**1. Fuente de Datos:**
- **ID de la Hoja:** `1HBE_uaSMvc_eEN4MyMP9idsGR-WBqxNf`
- **Estructura:** Los datos están agrupados por bloques semanales.
  - Cada bloque inicia con un encabezado que contiene el texto "PLAN DE TRABAJO SEMANAL" y la fecha (ej. "DEL 3 AL 9 DE MARZO").
  - Debajo de este encabezado están las filas de tareas.

**2. Lógica de Extracción:**
- Abre la hoja externa usando `SpreadsheetApp.openById()`.
- Itera sobre las filas de la hoja activa (o busca la hoja "PPC" si existe).
- Detecta cuando una fila contiene "PLAN DE TRABAJO SEMANAL" para establecer la **Fecha de Inicio de la Semana** (lunes) para las tareas subsiguientes.
- Para cada fila de tarea dentro de un bloque semanal, extrae los siguientes datos:
  - **CONCEPTO:** Columna 'DEFINIDA', 'ATERRIZADA' o 'ACTIVIDAD'.
  - **ZONA:** Columna 'UBICACION' o 'AREA'.
  - **ESPECIALIDAD:** Columna 'DISCIPLINA'.
  - **RESPONSABLE:** Columna 'RESPONSABLE'.
  - **RUTA_CRITICA:** Columna 'RUTA CRITICA'.
  - **CONTRATISTA:** Columna 'CONTRATISTA' o 'PROVEEDOR'.
  - **CUANTIFICACION:** Columnas 'REQUERIDO' y 'REAL' (si existen).
  - **DÍAS:** Verifica las columnas L, M, X, J, V, S, D. Si tienen una 'x' o valor, marca `DIAS_L`, `DIAS_M`, etc. como `true` o "x".

**3. Lógica de Guardado (Destino):**
- Por cada tarea extraída, crea un objeto `payload`.
- **IMPORTANTE:** Usa la función existente `apiSavePPCData(payload, 'JESUS_CANTU')`.
  - Debes pasar el segundo argumento `'JESUS_CANTU'` obligatoriamente. Esto asegura que el sistema guarde las columnas personalizadas (Ruta Crítica, Zona, Contratista) que son específicas para este flujo.
- Asigna la `FECHA` del payload al Lunes de la semana detectada.

**4. Validaciones:**
- Evita duplicados: Antes de guardar, podrías generar un ID único (hash de Concepto + Fecha) o verificar si ya existe en `PPCV3`.
- Maneja errores: Si la hoja no tiene el formato esperado, registra un log pero no detengas todo el proceso."
