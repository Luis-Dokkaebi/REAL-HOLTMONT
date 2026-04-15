# Documento de Especificación de Diseño (SDD) - Holtmont Workspace V158

## 1. Visión General del Sistema
**Holtmont Workspace V158 (ScriptMaster Edition)** es una plataforma de gestión integral (ERP/CRM/BPM ligero) construida sobre el ecosistema de **Google Workspace (Google Apps Script + Google Sheets + Google Drive)**. El sistema coordina las operaciones entre los departamentos de Ventas, Construcción, HVAC, Electromecánica, Compras, Diseño y Administración mediante un flujo guiado por especificaciones (Spec-Driven Development). Su enfoque principal es eliminar cuellos de botella en la delegación de cotizaciones (Workflow "Papa Caliente"), la gestión de Proyectos (Sitios y Subproyectos), la generación de Pre Work Orders (PWO), y el seguimiento del rendimiento personal y de equipo (KPIs y Agenda).

## 2. Arquitectura del Sistema
La arquitectura es de tipo **Cliente-Servidor (Serverless)**, usando el ecosistema de Google como infraestructura:

*   **Frontend (Cliente):** Aplicación de Página Única (SPA) alojada vía `HtmlService` en `index.html` y `workorder_form.html`. Desarrollada con **Vue.js 3** (Global Build), **Bootstrap 5**, **SweetAlert2** para modales, **Chart.js** para analíticas (Dashboard y Monitor Vivos), y **Anime.js** para transiciones fluidas de interfaz. Incorpora características PWA implícitas al funcionar dentro de un WebView o navegador móvil/de escritorio.
*   **Backend (Servidor):** Lógica centralizada en **Google Apps Script (GAS)** (`CODIGO.js`), que expone endpoints tipo API (e.g., `apiUpdateTask`, `apiSavePPCData`, `apiFetchStaffTrackerData`) accesibles asíncronamente por el frontend vía `google.script.run`.
*   **Base de Datos:** **Google Sheets** actúa como motor relacional/NoSQL mediante múltiples hojas tabulares vinculadas por columnas clave (`FOLIO`, `ID`). Emplea un sistema de validación inteligente de cabeceras (`findHeaderRow`) para tolerancia a fallos frente a reordenamientos o manipulaciones manuales por parte de los usuarios.
*   **Almacenamiento de Archivos:** **Google Drive**, orquestado mediante el script para cargar cotizaciones, evidencias fotográficas, diseños y planos directamente desde la UI (`uploadFileToDrive`) y organizarlos automáticamente (`processQuoteRow`).

### 2.1. Modelos y Almacenamiento de Datos (Estructura de Google Sheets)
El sistema depende de una taxonomía estricta de hojas de cálculo definidas en `APP_CONFIG` y `INITIAL_DIRECTORY`:
*   **Hojas Maestras:**
    *   `PPCV3` / `PPCV4`: Control central de planeación semanal e interdisciplinaria.
    *   `Datos`: Historial general de ventas.
    *   `LOG_SISTEMA`: Bitácora inmutable de auditoría (acciones de usuarios, errores, sincronizaciones).
    *   `DB_DIRECTORY`: Catálogo dinámico de empleados, roles y departamentos (`apiAddEmployee`, `apiDeleteEmployee`).
*   **Trackers por Usuario:** Hojas individuales generadas dinámicamente con el nombre del usuario y opcionalmente el sufijo `(VENTAS)` (Ej: `ANGEL SALINAS`, `TERESA GARZA (VENTAS)`). Actúan como las "bandejas de entrada" de cada trabajador.
*   **Hojas Work Order (PWO):** Hojas relacionales vinculadas por la foreign key `FOLIO`:
    *   `DB_WO_MATERIALES`
    *   `DB_WO_MANO_OBRA`
    *   `DB_WO_HERRAMIENTAS`
    *   `DB_WO_EQUIPOS`
    *   `DB_WO_PROGRAMA`
*   **Gestión de Proyectos:** `DB_SITIOS` (Padres), `DB_PROYECTOS` (Hijos). Manejo en cascada de estructuras de obras.
*   **Personal / Bienestar:** `AGENDA_PERSONAL` (Eventos personales y comidas), `HABITOS_LOG` (Registro de cumplimiento de hábitos con estructura JSON en celda).

## 3. Relaciones y Flujos de Módulos

El sistema está fuertemente acoplado en torno a la entidad "Tarea/Cotización", que fluye a través de los módulos:

1.  **Módulo de Autenticación y RBAC (Control de Accesos):**
    *   El frontend presenta un login (`doLogin`). Las credenciales se validan contra el diccionario estático `USER_DB` en `CODIGO.js`.
    *   Roles (`role` en `USER_DB`): `ADMIN`, `PPC_ADMIN`, `TONITA` (Gestor de Ventas), `ADMIN_CONTROL`, `WORKORDER_USER`, y usuarios departamentales estándar/híbridos (ej. `ANGEL_USER`).
    *   El rol determina la función `getSystemConfig()`, que devuelve qué menús (`specialModules`), departamentos y accesos tiene el usuario en la barra lateral del frontend.
2.  **Módulo "Papa Caliente" (Flujo Principal de Cotizaciones):**
    *   Gestionado principalmente por la hoja maestra `ANTONIA_VENTAS` y su vista específica en el frontend (`trackerSubView === 'HOT_POTATO'`).
    *   Implementa una **Máquina de Estados Finita (Workflow State Machine)** de 7 etapas seriales: `L` (Levantamiento), `CD` (Cálculo y Diseño), `EP` (Elaboración Presupuesto), `CI` (Cotización Interna), `EV` (Estrategia Ventas), `CEC` (Cotización Enviada al Cliente), `RCC` (Revisión Cotización Cliente).
    *   **Distribución (Delegación):** A través del modal SweetAlert en `advanceProcess()`, Antonia asigna una etapa (ej. `CD` a `ANGEL SALINAS`). El frontend envía una bandera `_assignToWorker`. El backend (`internalUpdateTask`) detecta esto, marca la etapa actual como `IN_PROGRESS` en la bitácora JSON oculta (`PROCESO_LOG`), y clona la fila a la hoja del delegado (`ANGEL SALINAS`) estableciendo `ESTATUS = "PENDIENTE"` y `AVANCE = "0%"`.
    *   **Sincronización Inversa (Reverse Sync):** El delegado completa su trabajo (cambia `AVANCE` a `100%`, o Estatus equivalente como `DONE`, o `HECHO`) y guarda. El backend (`apiSaveTrackerBatch` / `internalUpdateTask`), al detectar el 100%, busca el `FOLIO` en `ANTONIA_VENTAS`, marca la etapa activa en `PROCESO_LOG` como `DONE` con timestamp, regenera el semáforo visual en `MAP COT` a verde (🟢), y empuja los archivos adjuntados (`ARCHIVO`, `F2`, `LAYOUT`, `COTIZACION`) de regreso a la hoja maestra.
3.  **Módulo "Pre Work Order (PWO)":**
    *   Interfaz compleja inyectada desde `workorder_form.html`.
    *   Permite cotizar proyectos detallados ingresando listas de Mano de Obra (con factores para nocturno/fines de semana), Herramientas, Equipos Especiales y Materiales.
    *   Genera folios semánticos automatizados (`generateWorkOrderFolio`): `Secuencia(4) + InicialesCliente(2) + AbreviaturaDepto + Fecha(6)` (Ej. `0002ME Const 150424`).
    *   Soporta captura de voz a texto mediante `SpeechRecognition` nativo del navegador y opcionalmente integración con IA generativa (Gemini Flash) para transcripción de audios (`transcribirConGemini`).
4.  **Módulo de Dashboard y Analíticas (KPIs):**
    *   `generarDashboard()` y `apiFetchTeamKPIData()` consolidan información transversal. Calcula métricas de volumen y eficiencia (días de respuesta) iterando sobre las hojas de los trabajadores.
    *   **Módulo "Monitor Vivos" (ECG):** Representa gráficamente (estilo electrocardiograma) el estado vital de las cotizaciones (Ganadas = pico alto, Perdidas = caída), parseando el historial de `Datos` (`apiFetchSalesHistory`).
    *   Incluye gráficos de Pastel, Barras, Radar y Líneas para Puntualidad, Tiempo de Visitas, Integración PWO, y Ventas.
5.  **Smart Archiver y Banco de Información:**
    *   **Auto-Archivado:** Cuando la hoja maestra (Antonia) detecta nuevos archivos (URLs de Drive) o al ejecutarse `runFullArchivingBatch`, la función `processQuoteRow` toma el archivo, lee la fecha y el cliente, y lo mueve físicamente en Google Drive a una estructura de carpetas: `Banco de Cotizaciones > [Año] > [Mes] > [Nombre del Cliente]`.
    *   **Frontend del Banco:** Vistas interactivas (Años > Meses > Empresas > Carpetas > Archivos) que consultan el historial consolidado (`apiFetchInfoBankCompanies`, `apiFetchInfoBankData`).

## 4. Requisitos Funcionales

1.  **Tableros Interactivos (Data Grid):**
    *   Renderizado de tablas "estilo Excel" (`.table-excel`) dinámicas basadas en los encabezados devueltos por el backend (`visibleTrackerHeaders`).
    *   Soporte para edición en línea fluida (`excel-input`, `excel-textarea`), selectores desplegables dinámicos (para `AREA`, `VENDEDOR`) en las cabeceras.
    *   Mecanismo de guardado por fila individual (`saveRow`) o guardado masivo de toda la tabla (`saveAllTrackerRows` -> `apiSaveTrackerBatch`).
2.  **Generación de IDs / Folios:**
    *   Auto-asignación de folios robusta con bloqueo atómico (`LockService` en `generateNumericSequence`) manejando el prefijo `AV-` y la secuencia persistente (`ANTONIA_SEQ_V2`) en las propiedades del script.
    *   Capacidad de "Auto-Healing": Si los IDs locales en el frontend detectan desajustes, deben sincronizar la secuencia más alta.
3.  **Automatización de Contadores (SLAs):**
    *   Columnas como `DIAS`, `RELOJ`, o `DÍAS FINALIZ. COTIZ` deben calcularse en **tiempo real** en el frontend (`calculateDiasCounter`) mostrando la diferencia entre `F. INICIO` (u alias) y la fecha local (`TODAY`).
    *   Un trigger programado nocturno (`incrementarContadorDias`) en GAS actualizará estos valores persistentes en todas las hojas relevantes de la base de datos a las 1:00 AM para procesos en background.
4.  **Codificación Visual (Tráfico / Semáforos):**
    *   La columna de días debe cambiar de color (Verde, Amarillo, Rojo) evaluando contra la columna `CLASIFICACION` (A=3 días, AA=15 días, AAA=30 días) y un `buffer` preventivo, usando formato condicional del frontend (`getTrafficStyle`).
    *   También se inyectan reglas de formato condicional directamente en la hoja de Google (`applyTrafficLightToSheet`) de forma concurrente para mantener las celdas coloreadas en el entorno nativo.
5.  **Archivos Multimedia Adjuntos:**
    *   Celdas designadas como "Media" (Ej. `COTIZACION`, `LAYOUT`, `FOTOS`) deben abrir un diálogo de carga.
    *   El archivo se codifica en Base64 (`FileReader`) y se envía vía HTTP POST a GAS, el cual lo guarda en Drive y devuelve una URL, anexándola (multilínea si hay previos) en la celda.
6.  **Gestión de Agendas y Hábitos (Vista Personal):**
    *   Interfaz de agenda diaria y semanal combinando tareas laborales con compromisos personales (`apiFetchUnifiedAgenda`).
    *   Trackers de hábitos diarios con casillas de verificación e historial almacenado en JSON persistente.
    *   Registro de ingesta de alimentos (Desayuno, Comida, Cena).

## 5. Requisitos No Funcionales

1.  **Rendimiento y Tolerancia a Fallos (Concurrencia):**
    *   Las escrituras por lotes (`internalBatchUpdateTasks`) están envueltas en `LockService.getScriptLock().tryLock(10000)` para prevenir corrupción de datos ("Race conditions") cuando múltiples vendedores o administradores guardan cambios a la vez.
    *   Técnicas de optimización V8 en el backend: Uso extensivo de arreglos bi-dimensionales (`getValues()`, `setValues()`) en vez de llamadas celda por celda.
2.  **Seguridad y Restricciones de Entidad (Whitelist Mutability):**
    *   **Inmutabilidad de Vendedores:** Cuando un delegado (Ej. "Ramiro") guarda una fila de la hoja de "Papa Caliente" a través del frontend, la función `internalUpdateTask` filtra el payload. Usuarios restringidos solo pueden modificar columnas operativas listadas en `allowed` (`AVANCE`, `COMENTARIOS`, anexos). Modificaciones en `ESTATUS`, `FECHA`, o descripciones no se persisten de vuelta a la hoja maestra.
    *   **Inmutabilidad de Antonia:** Para filas existentes, incluso la gerente Antonia está restringida por la lista `allowedBase` para prevenir rupturas estructurales en el motor JSON oculto (`PROCESO_LOG`).
3.  **Resiliencia Estructural (Parsers Elásticos):**
    *   El método `getColIdx(key)` en `CODIGO.js` emplea diccionarios de **alias** robustos. Si un usuario renombra la columna "ESTATUS" a "STATUS" o "CUMPLIMIENTO" a "CUMP", el backend mapeará y no se romperá el sistema de escritura/lectura.
    *   Las cabeceras se normalizan implacablemente (`String(h).toUpperCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()`) ya que los usuarios a menudo agregan retornos de carro en Google Sheets.
4.  **UI/UX y Accesibilidad:**
    *   Implementación del patrón **A11y (Accesibilidad)**: Hitboxes (áreas de clic) expandidas al 100% de las celdas (positioning absolute overlay), previniendo "clics de francotirador" ("Sniper Clicks").
    *   Patrón Master-Detail / Accordion y modales informativos (Tooltips/SweetAlert) para la línea temporal de "Papa Caliente", condensando 8 columnas de progreso en un Badge o línea horizontal para minimizar la sobrecarga vertical de la tabla ("Timeline Component").
    *   Tipografía unificada y estilos condicionales (`text-transform: uppercase`, `font-family: Arial`) en tablas dinámicas.
5.  **Restricciones de Cuota de Carga Útil:**
    *   El sistema de carga de archivos de GAS / HtmlService colapsa con la restricción "Payload too large" (HTTP 413) alrededor de los **50MB**. El flujo de trabajo asume cargas por debajo de este límite.

## 6. Pruebas y Calidad (Unit Testing End-to-End)
El código de GAS incorpora un marco rudimentario de pruebas funcionales en bloque al final del script para depuración:
*   `test_Generacion_MAP_COT()`: Simula la actualización inversa (Reverse Sync) con un `PROCESO_LOG` mockeado y valida que el parser devuelva el string exacto de emojis `🟢 L | 🔴 CD ...`.
*   `test_Security_Filter_AllowedBase()`: Simula la inyección de columnas prohibidas o campos maliciosos (`FORMULA_SECRETA`) en el payload de update, afirmando que el filtrado de seguridad los trunca antes de persistir.
*   `test_Flujo_Completo_Delegacion_y_Sincronizacion()`: Flujo E2E que imita a `ANTONIA_VENTAS` asignando a un trabajador, confirmando la escritura del paso inicial, simulando luego al trabajador cambiando a `100% DONE` con URL, y confirmando la recepción y cierre (verde) de la fila principal.
*   `test_Cierre_Terminal_RCC()`: Valida la persistencia del estado terminal ("Perdida X Precio") en la hoja maestra delegando la última decisión a la Interfaz de UI.
