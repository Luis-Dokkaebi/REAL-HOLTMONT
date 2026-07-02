# SSD MAESTRO — Holtmont Workspace
## Documento de Especificación de Sistema para Clonación Total (Software/System Design Document)

> **Versión:** 1.0.0 · **Fecha:** 2026-07-02 · **Alcance:** Este documento es la fuente única capaz de reconstruir el sistema completo — backend, frontend, modelo de datos, reglas de negocio, integraciones y despliegue — sin necesidad de leer el código fuente. Complementa (no reemplaza) a `SDD_HOLTMONT_WORKSPACE.md`, `PAPA_CALIENTE_SDD.md`, `SDD_OUTLOOK_INTEGRATION.md`, `SDD_KPI_ADMIN.md`, `FRONTEND ANTONIA.md` y `AGENTS.md`, cuyo contenido relevante está integrado y referenciado aquí.

---

## 0. Cómo usar este documento

Si tuvieras que reconstruir "Holtmont Workspace" desde una carpeta vacía, este documento describe, en orden:

1. Qué es el sistema y para quién es (§1).
2. Con qué tecnologías exactas está hecho y qué restricciones arquitectónicas son innegociables (§2).
3. Qué archivo hace qué (§3) y cómo se relacionan las 3 capas del sistema (§4).
4. El esquema completo de la base de datos — que en este proyecto **son hojas de Google Sheets**, no SQL — con nombres exactos de hoja y encabezados exactos de columna (§5).
5. El organigrama de la empresa, los roles del sistema y la matriz de permisos por rol (§6).
6. El catálogo completo de las ~140 funciones del backend, agrupadas por responsabilidad (§7).
7. El estado reactivo de Vue y el mapa de vistas del frontend (§8).
8. El sistema de diseño (Design Tokens) que gobierna toda la UI (§9).
9. Las reglas de negocio "no obvias" que si se rompen, rompen producción (§10).
10. Las integraciones externas: Make.com, Outlook/Power Automate, Gemini AI (§11).
11. Triggers y automatizaciones programadas (§12).
12. El estado real de seguridad del sistema, con una advertencia explícita (§13).
13. Cómo correr las pruebas existentes (§14).
14. Una guía paso a paso para desplegar una instancia nueva desde cero (§15).
15. Deuda técnica conocida y archivos que **no** se deben usar como fuente de verdad (§16).
16. El inventario función-por-función completo, con línea exacta en `CODIGO.js` (§17, Anexo).

---

## 1. Resumen Ejecutivo

**Holtmont Workspace** es una plataforma interna tipo ERP/CRM/BPM ligero para **Holtmont** (empresa de construcción/ingeniería), usada por ~40 empleados repartidos en 15+ departamentos (CEO, RH, Finanzas, Compras, Presupuestos, Calidad, Seguridad, Precios Unitarios, Diseño, Ventas, Electromecánica, HVAC, Construcción, Limpieza, Almacén y Maquinaria).

Resuelve tres problemas de negocio:

1. **Seguimiento de tareas por persona ("Trackers")**: cada empleado tiene su propia hoja de cálculo tipo Excel dentro de la app, con columnas de especialidad, concepto, fechas, avance, estatus, comentarios y archivos adjuntos.
2. **Flujo de cotizaciones de Ventas ("Papa Caliente")**: un pipeline Kanban de 7 etapas (`L → CD → EP → CI → EV → CEC → RCC`) que delega automáticamente el trabajo de una cotización entre Ventas, Diseño y Presupuestos, con sincronización bidireccional de vuelta a la hoja maestra.
3. **Órdenes de trabajo de campo ("Work Orders")**: formulario especializado (`workorder_form.html`) para capturar materiales, mano de obra, herramientas, equipo y programa de una obra, con generación automática de folio.

No existe backend propio ni base de datos SQL: **Google Sheets es la base de datos**, **Google Apps Script (GAS) es el backend**, y **Vue 3 vía CDN sin build step es el frontend**, todo dentro de un único proyecto de Google Apps Script desplegado como Web App.

---

## 2. Stack Tecnológico y Restricciones Arquitectónicas No Negociables

| Capa | Tecnología | Notas |
|---|---|---|
| Backend | Google Apps Script (V8 runtime) | Un único archivo `CODIGO.js` (6249 líneas). Sin `npm`, sin Node.js en runtime. |
| Frontend | Vue 3 (Composition API) vía CDN (`unpkg.com/vue@3/dist/vue.global.js`) | Sin build step, sin Webpack/Vite, sin SFC `.vue`. Todo vive inline en `index.html` (10142 líneas). |
| UI/CSS | Bootstrap 5.3.0 (CDN), CSS custom con Design Tokens en `:root`, Animate.css, Anime.js | Ver §9. |
| Modales | SweetAlert2 11 (CDN) | Todos los diálogos de confirmación/asignación. |
| Gráficas | Chart.js (CDN) | Usado en KPI Dashboard. |
| Base de datos | Google Sheets (hoja de cálculo activa, `SpreadsheetApp.getActiveSpreadsheet()`) | Una única Spreadsheet contiene todas las "tablas" como pestañas (`Sheet`). |
| Archivos | Google Drive (vía `DriveApp`/`UrlFetchApp` desde GAS) | Subida en Base64 desde el navegador, decodificado en el backend. |
| Automatización externa | Make.com (webhook) + Power Automate (Microsoft 365) | Ver §11. |
| IA | Google Gemini API (vía `UrlFetchApp` a `callGeminiAPI`) | Usado para resúmenes de productividad y transcripción de audio. |
| Zona horaria | `America/Mexico_City` (`appsscript.json`) | Todo cálculo de fecha asume esta zona salvo el UTC explícito hacia Make.com. |
| Runtime | V8 (`"runtimeVersion": "V8"` en `appsscript.json`) | |

### Restricciones que un clon **debe** respetar (extraídas de `AGENTS.md`)

1. **Todo el backend vive en un solo archivo `CODIGO.js`.** No se permite dividir en módulos importables — GAS no soporta `import`/`require` de módulos propios en este proyecto (no usa `clasp` con múltiples archivos `.gs` separados por convención del equipo; todo backend es un único script).
2. **Toda la UI vive en `index.html` (y `workorder_form.html` para el formulario de campo).** Cualquier librería nueva se agrega por `<script src="...">` CDN en el `<head>`, nunca vía `npm install`.
3. **La comunicación cliente-servidor es exclusivamente `google.script.run`** (RPC asíncrono nativo de GAS), nunca `fetch()` a un endpoint REST propio (salvo las llamadas salientes desde el backend hacia Make.com/Gemini vía `UrlFetchApp`).
4. **No se pueden usar micrófonos/`getUserMedia`** — GAS Web Apps corren en un iframe sandboxed que bloquea el acceso a hardware de audio en la mayoría de contextos; la función `transcribirConGemini` recibe audio ya grabado en Base64, no graba en vivo desde el navegador de forma confiable.

---

## 3. Estructura del Repositorio (archivo por archivo)

```
REAL-HOLTMONT/
├── CODIGO.js                    # Backend GAS completo — ÚNICA fuente de verdad del servidor (6249 líneas)
├── CODIGO.js.bak                # Respaldo manual pre-refactor — NO USAR como referencia (desactualizado)
├── CODIGO.js.orig               # Versión previa a un merge/patch — histórico, NO USAR
├── CODIGO.js.rej                # Fragmento de patch rechazado (`.rej`) — residuo de un merge fallido, IGNORAR
├── index.html                   # Frontend monolítico Vue 3 completo (10142 líneas): HTML+CSS+JS inline
├── workorder_form.html          # Formulario independiente de Work Orders (928 líneas)
├── verification.html            # Página auxiliar de verificación/QA manual
├── appsscript.json              # Manifest de Apps Script: timezone, OAuth scopes, runtime
├── package.json / package-lock.json  # Dependencias SOLO para testing local en Node (acorn, jsdom) — no se despliegan a GAS
├── image.png                    # Referencia visual (mock/diseño)
│
├── AGENTS.md                    # Reglas de negocio críticas + "skills" para agentes de IA que editen este repo
├── CREDENCIALES.md              # Tabla de usuarios/roles/departamentos del organigrama (contiene contraseñas en texto plano — ver §13)
├── README.md                    # Placeholder mínimo
├── SDD_HOLTMONT_WORKSPACE.md    # SDD general de arquitectura, design tokens y catálogo de API (v2.0.0)
├── SDD_KPI_ADMIN.md             # SDD del Dashboard de KPIs para administradores
├── SDD_OUTLOOK_INTEGRATION.md   # SDD de la integración con Outlook/Power Automate
├── PAPA_CALIENTE_SDD.md         # SDD del flujo de cotizaciones "Papa Caliente" (máquina de estados de 7 pasos)
├── FRONTEND ANTONIA.md          # SDD de refactor UI/UX del Data Grid (hitboxes, timeline, accordion)
├── SSD_MAESTRO_CLONACION.md     # ESTE documento
├── plan_productivity.md         # Notas de planeación del módulo de productividad
│
├── tracker_productivity_tool.js / _tool2.js / _tool3.js         # Iteraciones del "agente" de métricas de productividad (histórico de versiones)
├── tracker_productivity_ui_tool.js … _ui_tool7.js               # Iteraciones de la UI del mismo módulo (histórico)
├── tracker_productivity_menu_tool.js                            # Menú asociado al módulo de productividad
│
├── check_html.js / check_html2.js / check_html_fix.js           # Linters/parsers locales de `index.html` (validan sintaxis JS embebida). `check_html2.js` es el respaldo funcional si `check_html.js` falla (AGENTS.md §6).
├── check_duplication.js / deduplicate_script.js / fix_all.js    # Scripts de diagnóstico/reparación de filas duplicadas en Sheets (uso manual, no automatizado)
├── fix_anotnia.js                                                # Fix puntual del caso especial de Antonia (histórico)
├── fix_date_temp_id.patch / fix_date_temp_id_clean.patch / fix_duplication.patch  # Parches aplicados manualmente en su momento — quedaron como registro, no se re-aplican
├── parse_dupes.js / parse_internal.js / parse_issue.js / parse_issue2.js / parse_tempId.js / get_issue_info.js  # Scripts ad-hoc de diagnóstico usados durante debugging de incidentes puntuales
├── syntax_check2.js                                              # Chequeo de sintaxis adicional
│
├── test_bug.js, test_case.js, test_deduplication.js, test_deduplication2.js,
│   test_departments.js, test_distribution.js, test_distribution2.js,
│   test_distribution_subagent.js, test_distribution_subagent2.js,
│   test_duplication_issue.js, test_duplication_issue2.js,
│   test_remove_worker.js, test_script.js, test_subagent.js      # Suite de pruebas locales en Node que mockean `SpreadsheetApp`/`CacheService`/`PropertiesService` para probar lógica extraída de `CODIGO.js` sin desplegar a Google (ver §14)
│
└── .gitignore
```

**Regla de oro para clonar:** la única fuente de verdad ejecutable son `CODIGO.js`, `index.html`, `workorder_form.html` y `appsscript.json`. Todo lo que termina en `.bak`, `.orig`, `.rej`, `.patch`, o los `tracker_productivity_*_tool[2-7].js` / `_ui_tool[2-7].js` son iteraciones históricas o descartadas — **no reflejan el estado actual del sistema** (ver §16).

---

## 4. Arquitectura en Capas

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVEGADOR (Cliente)                                             │
│  index.html  →  Vue 3 (createApp + setup(), Composition API)     │
│  · Login overlay · Sidebar (departamentos) · Data Grid (Excel-like)│
│  · Timeline "Papa Caliente" · Módulo PPC · Banco de Información  │
│  · KPI Dashboard (Chart.js) · Agenda/Calendario                  │
│  workorder_form.html → Formulario independiente (Work Orders)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ google.script.run.<funcion>(args)
                            │ (RPC asíncrono nativo de GAS, JSON serializado)
┌───────────────────────────▼─────────────────────────────────────┐
│  GOOGLE APPS SCRIPT (Backend) — CODIGO.js                         │
│  doGet(e) → sirve index.html vía HtmlService                      │
│  Funciones api*/internal* expuestas globalmente al frontend       │
│  Gatekeeper (CacheService) · LockService (folios/secuencias)      │
│  registrarLog() → auditoría en LOG_SISTEMA                        │
└──────┬───────────────────────────┬────────────────────┬──────────┘
       │                           │                    │
┌──────▼─────────┐       ┌─────────▼─────────┐  ┌───────▼───────────┐
│ Google Sheets   │       │ Google Drive       │  │ APIs externas      │
│ (Base de datos) │       │ (Archivos: fotos,  │  │ · Make.com webhook │
│ Hojas por        │       │  cotizaciones,     │  │  → Power Automate  │
│ persona +        │       │  layouts, evidencia)│  │  → Outlook 365     │
│ ANTONIA_VENTAS + │       │ Estructura:         │  │ · Gemini API       │
│ PPCV3 + DB_WO_*  │       │ [Año]/[Mes]/[Cliente]│ │  (resúmenes/audio) │
│ + DB_DIRECTORY + │       └────────────────────┘  └────────────────────┘
│ LOG_SISTEMA      │
└──────────────────┘
```

---

## 5. Modelo de Datos (Google Sheets)

No hay motor SQL: **cada "tabla" es una pestaña (`Sheet`) dentro de la Spreadsheet activa**, identificada por nombre. El backend busca hojas con `findSheetSmart(name)` (búsqueda tolerante a mayúsculas/espacios) y encabezados con `findHeaderRow(values)` (búsqueda heurística — **no asume que la fila 1 es el encabezado**, porque las hojas de personal suelen tener elementos de UI/branding sobre los datos).

### 5.1 Configuración central (`APP_CONFIG`, `CODIGO.js` líneas 15–28)

```js
const APP_CONFIG = {
  folderIdUploads: "",                 // ID de carpeta raíz de Drive para adjuntos (vacío = usa lógica dinámica)
  ppcSheetName: "PPCV3",               // Hoja maestra del módulo PPC (checklist de sitio, NO confundir con "Papa Caliente")
  draftSheetName: "PPC_BORRADOR",      // Borradores de PPC no enviados aún
  salesSheetName: "Datos",             // (uso interno legado)
  logSheetName: "LOG_SISTEMA",         // Auditoría global (login, cambios, errores)
  directorySheetName: "DB_DIRECTORY",  // Organigrama vivo (fuente de verdad en runtime, sincronizable)
  woMaterialsSheet: "DB_WO_MATERIALES",
  woLaborSheet: "DB_WO_MANO_OBRA",
  woToolsSheet: "DB_WO_HERRAMIENTAS",
  woEquipSheet: "DB_WO_EQUIPOS",
  woProgramSheet: "DB_WO_PROGRAMA"
};

const FOLIO_CONFIG = { SHEET_NAME: 'ANTONIA_VENTAS', COLUMN_NAME: 'Folio' };
```

> **Nota de nomenclatura importante:** el sistema tiene **dos conceptos distintos que ambos se abrevian "PPC"** y suelen confundirse:
> - **Módulo PPC** (`PPCV3`, `PPC_BORRADOR`, roles `PPC_ADMIN`/`WORKORDER_USER`, vistas `PPC_MENU`/`PPC_DINAMICO`/`PPC_FORM`): un checklist operativo por sitio con tres variantes (`PPC INTERNO`, `PPC PREOPERATIVO`, `PPC CLIENTE`), gestionado por Jesús Cantú.
> - **"Papa Caliente"** (columnas `PROCESO_LOG`/`MAP COT` en `ANTONIA_VENTAS`, ver §10.2): el pipeline Kanban de 7 etapas de cotizaciones de Ventas. **No comparten hoja ni lógica**, solo terminología del negocio.

### 5.2 `DB_DIRECTORY` — Organigrama vivo

| Columna | Tipo | Descripción |
|---|---|---|
| `NOMBRE` | texto | Nombre completo en mayúsculas (coincide con el nombre de la hoja Tracker de esa persona) |
| `DEPARTAMENTO` | texto | Uno de los 19 departamentos definidos en `allDepts` (§6) |
| `TIPO_HOJA` | texto | `ESTANDAR` \| `HIBRIDO` (vendedor+tracker) \| `VENTAS` (solo Antonia) |

Se auto-puebla la primera vez desde la constante `INITIAL_DIRECTORY` (`CODIGO.js` líneas 37–93, 36 registros) si la hoja está vacía. `apiResyncDirectory()` (solo rol `ADMIN`) la re-escribe desde código y crea automáticamente cualquier hoja Tracker faltante.

### 5.3 Hojas Tracker individuales (una por empleado, nombre = `NOMBRE` en `DB_DIRECTORY`)

Encabezados por defecto (`DEFAULT_TRACKER_HEADERS`, línea 95), creados automáticamente si la hoja no existe:

```
ID | ESPECIALIDAD | CONCEPTO | FECHA | RELOJ | AVANCE | ESTATUS | COMENTARIOS | ARCHIVO | CLASIFICACION | PRIORIDAD | FECHA_RESPUESTA
```

Columnas adicionales que aparecen dinámicamente según el flujo de negocio (no todas están en el default, pero el motor de escritura las soporta vía búsqueda case-insensitive): `INVOLUCRADOS` (distribución lateral, ver §10.1), `VENDEDOR` (solo asignaciones desde `ANTONIA_VENTAS`), `F2`, `LAYOUT`, `COTIZACION`, `INFO CLIENTE`, `CORREO`, `CARPETA`, `PROCESO_LOG`, `MAP COT` (cuando la hoja recibe pasos delegados de Papa Caliente).

### 5.4 `ANTONIA_VENTAS` — Hoja maestra de Ventas

Encabezados por defecto (`DEFAULT_SALES_HEADERS`, línea 96):

```
FOLIO | CLIENTE | CONCEPTO | VENDEDOR | FECHA | F. ENTREGA | ESTATUS | COMENTARIOS | ARCHIVO | MONTO | F2 | COTIZACION | TIMELINE | LAYOUT | AVANCE
```

Además contiene, en producción, las columnas ocultas de negocio (no visibles como UI simple pero leídas/escritas por el motor):
- **`PROCESO_LOG`**: JSON array — bitácora de la máquina de estados Papa Caliente (ver §10.2, estructura completa en `PAPA_CALIENTE_SDD.md` §4.1).
- **`MAP COT`**: string con emojis separado por `|` — representación visual/legible en la hoja del mismo timeline (ej. `🟢 L | 🔴 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC`).

Folios con formato `AV-XXXX` (prefijo fijo `AV-`, secuencia atómica vía `generateNumericSequence('ANTONIA_VENTAS')` con `LockService`).

### 5.5 Módulo PPC (`PPCV3`, `PPC_BORRADOR`)

Encabezados (`CODIGO.js` líneas 3136 y 3161):

```
ID | ESPECIALIDAD | DESCRIPCION | RESPONSABLE | FECHA | RELOJ | CUMPLIMIENTO | ARCHIVO | COMENTARIOS |
COMENTARIOS PREVIOS | ESTATUS | AVANCE | CLASIFICACION | PRIORIDAD | RIESGOS | FECHA_RESPUESTA | DETALLES_EXTRA
```

`CUMPLIMIENTO` usa fallback estricto `'NO'` si viene vacío (regla de `AGENTS.md` §2).

### 5.6 `LOG_SISTEMA` — Auditoría global

```
FECHA | USUARIO | ACCION | DETALLES
```

Escrita exclusivamente vía `registrarLog(user, action, details)` (línea 298) — **toda función backend relevante debe llamarla** para trazabilidad (login/logout, altas/bajas de empleado, cambios de fecha, distribución de tareas, reverse-sync, errores críticos).

### 5.7 Órdenes de Trabajo (`DB_WO_*`) — 5 hojas relacionales

Todas ligadas por la columna `FOLIO` (formato `SEQClDept DDMMYY`, generado por `generateWorkOrderFolio()`, línea 4101 — ver detalle abajo).

| Hoja (`APP_CONFIG.*`) | Headers |
|---|---|
| `DB_WO_MATERIALES` | `FOLIO, CANTIDAD, UNIDAD, TIPO, DESCRIPCION, COSTO, ESPECIFICACION, TOTAL, RESIDENTE, COMPRAS, CONTROLLER, ORDEN_COMPRA, PAGOS, ALMACEN, LOGISTICA, RESIDENTE_OBRA` |
| `DB_WO_MANO_OBRA` | `FOLIO, CATEGORIA, SALARIO, PERSONAL, SEMANAS, EXTRAS, NOCTURNO, FIN_SEMANA, OTROS, TOTAL` |
| `DB_WO_HERRAMIENTAS` | `FOLIO, CANTIDAD, UNIDAD, DESCRIPCION, COSTO, TOTAL, RESIDENTE, CONTROLLER, ALMACEN, LOGISTICA, RESIDENTE_FIN` |
| `DB_WO_EQUIPOS` | `FOLIO, CANTIDAD, UNIDAD, TIPO, DESCRIPCION, ESPECIFICACION, DIAS, HORAS, COSTO, TOTAL` |
| `DB_WO_PROGRAMA` | `FOLIO, DESCRIPCION, FECHA, DURACION, UNIDAD_DURACION, UNIDAD, CANTIDAD, PRECIO, TOTAL, RESPONSABLE, SECCION, ESTATUS` |

**Algoritmo de folio de Work Order** (`generateWorkOrderFolio(clientName, deptName)`):
`SEQ(4 dígitos, contador en Script Properties "WORKORDER_SEQ") + Iniciales(2 letras del cliente) + " " + Abreviatura de departamento (mapa fijo, ej. "Construccion"→"Const", "Electromecanica"→"Electro") + " " + DDMMYY`.
Ejemplo: `0007HM Const 020726`.

### 5.8 Proyectos/Sitios (Cascada Sitio → Subproyecto → Tarea)

`apiSaveSite`, `apiSaveSubProject`, `apiFetchCascadeTree`, `apiSaveProjectTask`. Al crear un sitio nuevo, `apiCreateStandardStructure(siteId, user)` auto-genera subproyectos hijos siguiendo `STANDARD_PROJECT_STRUCTURE` (línea 102):

```
NAVE, AMPLIACION, PPC INTERNO, PPC PREOPERATIVO, PPC CLIENTE,
DOCUMENTOS, PLANOS Y DISEÑOS, FOTOGRAFIAS, CORRESPONDENCIA, REPORTES
```

Los 3 nodos que contienen `"PPC"` en el nombre se marcan `type: "PPC_MASTER"` para que el frontend los renderice con el motor de checklist en vez del árbol genérico.

### 5.9 Banco de Información / Banco de Cotizaciones (Google Drive)

`processQuoteRow()`, `archiveFile()`, `getBankRootFolder()`, `getOrCreateFolder()`: estructura de carpetas **`[Año] / [Mes] / [Cliente]`** creada dinámicamente. `apiFetchInfoBankCompanies(year, monthName)` y `apiFetchInfoBankData(year, monthName, companyName, folderName)` exponen esta jerarquía al frontend (vista "Banco de Información"). Límite práctico de subida: ~45–50MB por archivo (restricción de Base64 + timeout de GAS).

### 5.10 `KPI_COTIZACIONES`

Hoja de métricas agregadas escrita por `apiWriteQuoteMetricsToSheet()` y refrescada por el trigger diario `autoUpdateQuoteMetrics()`. Consumida por `apiFetchAdminKPIs()` para el Dashboard de KPIs (ver §11 de `SDD_KPI_ADMIN.md`).

---

## 6. Organigrama, Roles y Matriz de Permisos (RBAC)

### 6.1 Departamentos (`allDepts`, `getSystemConfig()`, línea 563)

19 departamentos con `label`, `icon` (FontAwesome) y `color` propios: `CEO, CONSTRUCCION, COMPRAS, PRESUPUESTOS, PRECIOS UNITARIOS, SEGURIDAD (alias EHS), DISEÑO, ELECTROMECANICA, HVAC, LIMPIEZA, ALMACEN Y MAQUINARIA, ADMINISTRACION, VENTAS, MAQUINARIA, FINANZAS, FACTURACION, RH, CALIDAD`.

### 6.2 Roles del sistema

| Rol | Quién | Acceso |
|---|---|---|
| `ADMIN` | `LUIS_CARLOS` (CEO) | Ve todos los departamentos, todo el staff, módulo KPI, monitor de Antonia. Es el rol "por defecto" (`else` final de `getSystemConfig`). |
| `ADMIN_CONTROL` | `JAIME_OLIVO`, `DIMAS_RAMOS` | Igual que ADMIN + módulo "Control" (hoja espejo `ADMINISTRADOR`) + monitor de Toñita, sin KPI. |
| `PPC_ADMIN` | `JESUS_CANTU` | Solo módulos PPC (Maestro + Semanal), `accessProjects: true`, sin departamentos de staff. Su módulo PPC Maestro se relabelea a "INTERDICIPLINARIA". |
| `TONITA` | `ANTONIA_VENTAS` | Solo departamento VENTAS, mira su propio tracker (`ANTONIA PINEDA LOPEZ`) + módulos PPC. `accessProjects: false`. |
| `WORKORDER_USER` | `PREWORK_ORDER` | Solo el módulo "Pre Work Order" (variante relabeleada del módulo PPC maestro). Sin departamentos. |
| `STAFF_USER` | Todo el resto del personal | Ve únicamente "Mi Tabla" (su propio Tracker, `mirror_staff` apuntando a su `staffName`) + "Agregar Actividad" (PPC). Si `seller: true` en `USER_DB`, se añade el módulo "Ventas" apuntando a `<staffName> (VENTAS)`. |

**Caso especial hardcodeado:** `JUANY_RODRIGUEZ` (rol `STAFF_USER`) tiene una rama especial en `getSystemConfig()` que le da acceso ampliado a los departamentos `COMPRAS, FACTURACION, FINANZAS` (no solo su propio tracker) — esta excepción vive en el código, no en `USER_DB`.

### 6.3 Esquema de `USER_DB` (constante en memoria, `CODIGO.js` línea 212)

```js
"USERNAME_KEY": {
  pass: "string en texto plano",        // ⚠️ ver §13 — riesgo de seguridad conocido
  role: "ADMIN|ADMIN_CONTROL|PPC_ADMIN|TONITA|WORKORDER_USER|STAFF_USER",
  label: "Nombre para mostrar en UI",
  email: "correo@holtmont.com (o vacío)",
  staffName: "NOMBRE EXACTO de su hoja Tracker (case-sensitive con DB_DIRECTORY)",
  dept: "Departamento (debe existir en allDepts)",
  seller: true|false                    // true → recibe también módulo "Ventas" con hoja "<staffName> (VENTAS)"
}
```

> Las credenciales reales (usuario/contraseña/rol/departamento) del organigrama vigente están en `CREDENCIALES.md` y replicadas en el objeto `USER_DB` de `CODIGO.js`. **Este documento intencionalmente no las reproduce** — ver la advertencia de seguridad en §13.

---

## 7. Catálogo de Funciones del Backend (`CODIGO.js`)

Agrupado por responsabilidad funcional. El listado línea-por-línea completo está en el Anexo (§17).

### 7.1 Entrada, Auth y Sesión
`doGet(e)` sirve `index.html` vía `HtmlService.createTemplateFromFile` con `XFrameOptionsMode.ALLOWALL`. `apiLogin(username, password)` valida contra `USER_DB`, audita con `registrarLog`. `apiLogout(username)`. `getSystemConfig(role, username)` arma el árbol de navegación por rol (§6.2). `getDirectoryFromDB()` / `apiResyncDirectory()` gestionan el organigrama vivo. `apiAddEmployee(payload)` / `apiDeleteEmployee(name)` CRUD de personal (crea/borra hoja Tracker asociada).

### 7.2 Motor de Trackers y Guardado por Lotes
`internalFetchSheetData(sheetName)` / `apiFetchStaffTrackerData(personName)`: lectura. `apiSaveTrackerBatch(personName, tasks, username)` (línea 5183, ~490 líneas — la función más grande del sistema): guardado masivo, ruteo de "Papa Caliente", auto-sanación de folios `AV-`, reverse-sync. `internalBatchUpdateTasks(sheetName, tasksArray, useOwnLock)` (línea 2156, ~440 líneas): el "Gatekeeper" — usa `CacheService` con `_tempId` como llave de bloqueo anti-duplicación, remueve filtros de la hoja antes de escribir. `internalUpdateTask` / `apiUpdateTask` / `apiUpdatePPCV3`: actualización de una sola fila con sanitización estricta contra lista blanca de columnas.

### 7.3 Papa Caliente / Cotizaciones (ver detalle completo en §10.2 y `PAPA_CALIENTE_SDD.md`)
La lógica de la máquina de estados vive **dentro de** `apiSaveTrackerBatch` e `internalUpdateTask` (no son funciones separadas): detecta transición a `100%`/`1`/`HECHO`/`SI`, localiza la entrada `IN_PROGRESS` correspondiente en `PROCESO_LOG`, la marca `DONE`, regenera `MAP COT`, y copia archivos de vuelta a `ANTONIA_VENTAS`.

### 7.4 Módulo PPC (checklist de sitio — distinto de Papa Caliente)
`apiSavePPCData(payload, activeUser)` (línea 3124, ~310 líneas), `apiFetchPPCData()`, `apiFetchDrafts` / `apiSyncDrafts` / `apiClearDrafts` (borradores), `saveChildData` / `ensureSheetWithHeaders` (helpers genéricos de guardado en sub-hojas).

### 7.5 Work Orders
`apiCreateStandardStructure`, `generateWorkOrderFolio`, `apiGetNextWorkOrderSeq`, y el guardado de las 5 sub-tablas relacionales vía `saveChildData` (§5.6).

### 7.6 Proyectos/Sitios (cascada)
`apiSaveSite`, `apiSaveSubProject`, `apiFetchCascadeTree`, `apiFetchProjectTasks`, `apiSaveProjectTask`.

### 7.7 KPIs y Productividad (agentes con IA)
`apiFetchAdminKPIs` (línea 719, Dashboard de KPIs — ver `SDD_KPI_ADMIN.md`), `apiFetchTrackerProductivityMetrics` / `runTrackerProductivityAgent` / `_sendTrackerProductivityEmail`, `apiFetchTeamKPIData`, `apiFetchQuoteAgentMetrics` / `apiWriteQuoteMetricsToSheet` / `runQuoteMetricsAgent` / `_sendAgentEmail` / `apiGetLastAgentReport`, `autoUpdateQuoteMetrics` (trigger diario), `callGeminiAPI` / `apiSaveGeminiKey` / `apiCheckGeminiKey` (integración Gemini para resúmenes narrativos y transcripción de audio vía `transcribirConGemini`).

### 7.8 Agenda, Calendario y Hábitos personales
`apiFetchCombinedCalendarData`, `apiFetchUnifiedAgenda`, `apiSavePersonalEvent`, `apiSaveHabitLog`.

### 7.9 Banco de Información / Archivos
`apiFetchInfoBankCompanies`, `apiFetchInfoBankData`, `apiFetchDistinctClients`, `uploadFileToDrive`, `getOrCreateFolder`, `getBankRootFolder`, `archiveFile`, `processQuoteRow`, `batchArchiveExistingQuotes`, `runFullArchivingBatch`.

### 7.10 Helpers estructurales
`findSheetSmart(name)` — búsqueda tolerante de hoja. `findHeaderRow(values)` — búsqueda heurística de fila de encabezados. `registrarLog(user, action, details)` — auditoría. `getWeekNumber(d)`, `colIndexToLetter(col)`, `generatePrefix(name)`, `generateNumericSequence(key)` (con `LockService`, fallback a número aleatorio si supera 10,000,000), `generateAppSheetId()` (deprecado), `deduplicateAllSheets()`, `debugSheetHeaders()`.

### 7.11 Formato condicional y semáforos de hoja
`applyTrafficLightToSheet(sheet)`, `setupConditionalFormatting()` — aplican reglas de color nativas de Google Sheets (no solo CSS del frontend) para que las hojas sigan siendo legibles fuera de la app web.

### 7.12 Triggers y menú nativo de Sheets
`onOpen()` — construye el menú custom de la Spreadsheet. `cmdRealizarAlta()`, `cmdActualizar()` — comandos invocados desde ese menú. `instalarDisparador()` — instala el trigger diario `incrementarContadorDias` (1am–2am). `generarFolioAutomatico(e)` — trigger de edición para folios legados numéricos simples (usa `LockService`, distinto del sistema `AV-XXXX`).

### 7.13 Suite de pruebas embebida (funciones `test_*` dentro de `CODIGO.js`)
`test_DataIntegrity`, `test_Generacion_MAP_COT`, `test_Security_Filter_AllowedBase`, `test_Flujo_Completo_Delegacion_y_Sincronizacion`, `test_Cierre_Terminal_RCC`, `test_SavePPCV3_Flow`, `test_WorkOrder_Generation`, `test_Directory_CRUD`, `test_ReverseSync_Flow`, `test_NumericSequence_Generation`, `test_Antonia_Distribution_Manual`, `test_SystemConfig_Label`, `test_avance_100_bug` — diseñadas para ejecutarse manualmente desde el editor de Apps Script (no hay CI que las corra automáticamente).

---

## 8. Frontend (`index.html`) — Estado y Vistas

### 8.1 Bootstrap de la app

```js
const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;
const app = createApp({ setup() { /* ~250 variables reactivas ref()/reactive() */ } });
app.mount('#app');
```

Vue se monta sobre `<div id="app">`. No hay Vue Router — la navegación es manual vía la variable `currentView`.

### 8.2 Variables de estado reactivo más relevantes (no exhaustivo — hay ~250 `ref()`)

| Variable | Propósito |
|---|---|
| `isLoggedIn`, `loginUser`, `loginPass`, `currentUser`, `currentUsername`, `currentRole` | Sesión y auth |
| `currentView`, `currentDept` | Router manual (ver §8.3) |
| `config` | Payload de `getSystemConfig()`: `{ departments, staff, directory, specialModules }` |
| `staffTracker` | `{ name, data, history, headers, isLoading, previousView }` — Tracker actualmente abierto |
| `hotPotatoData` | Estado del timeline Papa Caliente en pantalla |
| `activeTrackerTab`, `trackerSubView` | Sub-pestañas dentro de un Tracker (`OPERATIVO`, `TASKS`, etc.) |
| `weeklyPlanData`, `personalAgenda`, `dashboardCalendar` | Módulos de planeación/calendario |
| `ppcData`, `ppcExistingData`, `dynamicPpc` | Estado del módulo PPC (checklist de sitio) |
| `isSubmitting` | Flag anti-doble-click obligatorio (ver §10.3) — todo botón de guardado debe ligarse a esta bandera |
| `workorderData`, `currentWorkorderId`, `nextSequence` | Estado del formulario de Work Order |
| `vehicleData`, `vehicleControlData`, `vehicleControlData2` | Sub-módulo de control vehicular dentro de Work Order |
| `infoBankState`, `ibCompanies` | Navegación del Banco de Información (Año→Mes→Empresa→Carpeta) |
| `trackerProductivityData`, `isLoadingTrackerProductivity` | Dashboard de productividad con IA |
| `isRecording`, `cellFileInput`, `uploadingCell` | Adjuntos y grabación (transcripción Gemini) |
| `currentTheme`, `isCompact`, `searchQuery` | Preferencias de UI |

### 8.3 Mapa de vistas (`currentView.value = '...'`)

| Valor de `currentView` | Pantalla |
|---|---|
| `DASHBOARD` | Home / selector de departamentos |
| `DEPT` | Listado de personal dentro de un departamento |
| `STAFF_TRACKER` | Data Grid tipo Excel de un Tracker individual (vista principal del sistema) |
| `PPC_MENU` | Menú del módulo PPC (elegir Interno/Preoperativo/Cliente) |
| `PPC_DINAMICO` | Formulario dinámico de captura PPC |
| `PPC_FORM` | Formulario PPC clásico |
| `WEEKLY_PLAN` | Planeación semanal |
| `PROJECT_TASKS_VIEW` | Árbol Sitio→Subproyecto→Tarea |
| `WORKORDER_FORM` | Redirige/embebe `workorder_form.html` |
| `KPI_DASHBOARD` | Dashboard ejecutivo de KPIs (solo `ADMIN`) |
| `ECG_VIEW` | Módulo "Monitor Vivos" (actualmente comentado/deshabilitado en `getSystemConfig`, código presente pero módulo no expuesto) |

### 8.4 Componentes/patrones clave (detalle completo en `FRONTEND ANTONIA.md` y `SDD_HOLTMONT_WORKSPACE.md` §4)

- **Data Grid (`table-excel`)**: hitbox de celda al 100% (evita "clic de francotirador"), edición inline, cabeceras `sticky`, `vertical-align: middle` obligatorio.
- **Timeline Papa Caliente (`.hp-circle`)**: círculos de 32px conectados por línea, colores por estado (gris=pendiente, amarillo=en progreso, verde=completado), patrón Master-Detail (fila expandible) para no saturar verticalmente el grid.
- **Formularios dinámicos**: `<select>`/`<input type="date">` nativos expandidos al 100% de la celda contenedora.
- **Toggle mayúsculas/minúsculas obligatorio**: cabeceras siempre en minúsculas (excepto "Folio"/"ID"), datos siempre en mayúsculas — impuesto vía CSS `text-transform`, no vía JS.

---

## 9. Sistema de Diseño (Design Tokens)

Fuente exhaustiva: `SDD_HOLTMONT_WORKSPACE.md` §3. Resumen operativo (variables CSS en `:root` de `index.html`):

```css
:root {
  /* Color base */
  --color-bg-global: #f4f6f8;
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-header: #e6e6e6;
  --color-gray-border: #b2b2b2;
  --color-gray-text-sec: #637381;

  /* Interacción */
  --color-interactive: #107c41;   /* verde tipo Excel */
  --color-cell-hover: #F9FAFB;
  --color-focus-ring: #3B82F6;

  /* Semáforo */
  --color-danger-bg: #ffcccc;
  --color-warning-bg: #fff4cc;
  --color-success-bg: #ccffcc;

  /* Tipografía */
  --font-family-base: 'Arial', sans-serif;
  --font-size-table: 11px;
  --font-size-form: 13px;
  --text-transform-header: lowercase;   /* excepto "Folio"/"ID" */
  --text-transform-data: uppercase;
  --font-weight-bold: 700;

  /* Layout */
  --sidebar-w: 250px;
  --sidebar-mini: 70px;
  --row-height-base: 30px;
  --col-width-micro: 40px;   /* ALTA, ESPECIALIDAD, AREA, CORREO, CARPETA */
  --col-width-id: 85px;      /* ID, FOLIO */

  /* Transiciones */
  --transition-fast: 150ms ease;
  --transition-structural: 300ms cubic-bezier(0.25, 0.8, 0.25, 1);
}
```

**Regla de oro:** cualquier cambio visual solicitado por el negocio se resuelve modificando estos tokens en `:root`, **nunca** con estilos inline `style="color:red"` en HTML.

---

## 10. Reglas de Negocio Críticas (romperlas = romper producción)

### 10.1 Enrutamiento y el "Caso Antonia"
- Cualquier tarea originada en `ANTONIA_VENTAS` lleva folio con prefijo `AV-` y requiere **Reverse Sync**: cambios hechos por el delegado en su propio Tracker deben reflejarse de vuelta en `ANTONIA_VENTAS`.
- **Prohibido** para cualquier otro usuario enrutar hacia hojas que terminen en `(VENTAS)`. El código elimina ese sufijo globalmente: `targetSheet.replace(/\s*\(VENTAS\)/ig, "").trim()` — presente tanto en `apiSavePPCData` como en `apiSaveTrackerBatch`.
- La distribución lateral entre compañeros de equipo (no origen Ventas) usa la columna `INVOLUCRADOS`; la columna `VENDEDOR` es exclusiva de asignaciones que vienen de `ANTONIA_VENTAS`.

### 10.2 Máquina de estados "Papa Caliente" (detalle en `PAPA_CALIENTE_SDD.md`)

7 etapas secuenciales: `L (Levantamiento) → CD (Cálculo y Diseño) → EP (Elaboración Presupuesto) → CI (Cotización Interna) → EV (Estrategia Ventas) → CEC (Cotización Enviada al Cliente) → RCC (Revisión Cotización Cliente, etapa terminal)`.

- **`PROCESO_LOG`** (JSON): `[{ step, status: "IN_PROGRESS"|"DONE", assignee, timestamp, dateStr }, ...]`.
- **`MAP COT`** (string): `"🟢 L | 🔴 CD | ⚪ EP | ⚪ CI | ⚪ EV | ⚪ CEC | ⚪ RCC"` — espejo legible en la hoja cruda.
- Delegar un paso: Antonia hace clic en el círculo → modal de selección de delegado → se agrega entrada `IN_PROGRESS` a `PROCESO_LOG` → se copia la fila al Tracker del delegado con `ESTATUS="PENDIENTE"`, `AVANCE="0%"`.
- Completar: el delegado marca `AVANCE=100%` (o `1`, `1.0`, `HECHO`, `SI`, `DONE` — **todas** las variantes deben aceptarse) → el backend detecta la transición en `apiSaveTrackerBatch`, localiza la entrada `IN_PROGRESS` con `assignee` coincidente (tolerante a espacios y al sufijo `(VENTAS)`), la pasa a `DONE`, regenera `MAP COT`, copia archivos adjuntos de vuelta.
- Cierre terminal en `RCC`: modal con 3 desenlaces — `GANADA` (verde), `PERDIDA X PRECIO` (rojo), `DESCUENTO` (azul) — escribe en `ESTATUS` y bloquea la fila.
- **Lista blanca de seguridad:** solo columnas en `allowedBase` (backend) / `allowed` (frontend) se sobrescriben en cada guardado — `PROCESO_LOG` y `PROCESO` **deben** estar siempre en esa lista o la delegación se rompe silenciosamente.

### 10.3 Anti-duplicación y condiciones de carrera
- **Frontend:** cada fila nueva genera un `_tempId` único antes de enviarse; todo botón de guardado se liga a `isSubmitting` para bloquear doble-click.
- **Backend Gatekeeper:** `internalBatchUpdateTasks` usa `CacheService.getScriptCache()` con el `_tempId` + nombre de hoja como llave de candado, bloqueando ejecuciones paralelas sobre la misma fila.
- **Resolución de conflictos:** si un `FOLIO` no se encuentra al actualizar, el sistema intenta emparejar por la combinación exacta `CONCEPTO` + `FECHA` **antes** de generar un folio nuevo (último recurso).
- Toda función de guardado (`apiSaveTrackerBatch`, `apiSavePPCData`) debe devolver el objeto completo actualizado en `res.data` para que el frontend pueda fusionarlo y marcar `_isNew = false`.

### 10.4 Parseo defensivo de datos de hoja
- **Encabezados no están garantizados en la fila 1** — usar siempre `findHeaderRow()`.
- **Comparación insensible a mayúsculas**: todo acceso a claves de objeto que vienen del frontend (pueden llegar en minúsculas, ej. `folio`) debe normalizarse con `.toUpperCase().trim()`.
- **Interpretación de `AVANCE`**: `100`, `'100'`, `'100%'` y el valor numérico crudo `1` (formato porcentaje nativo de Sheets) son todos "100%". **Nunca** interpretar el string `'1'` o `'1.0'` de esta forma si viene de otra columna — el bug histórico `test_avance_100_bug` documenta este caso exacto.
- **Fechas**: tolerancia dual — ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`) y formato legado `DD/MM/YY`. Los webhooks salientes a Make.com **siempre** usan `.toISOString()` completo (con milisegundos y `Z`) — nunca mutar ese string.

---

## 11. Integraciones Externas

### 11.1 Make.com → Notificaciones
`WEBHOOK_OUTLOOK_URL` (línea 13) apunta a un escenario de Make.com (`https://hook.us2.make.com/...`). El backend hace `POST` con `UrlFetchApp` incluyendo indicador de si la tarea viene de `ANTONIA_VENTAS` (tabla de ventas) o del Tracker general, para que Make formatee el mensaje correctamente.

### 11.2 Outlook 365 / Power Automate (`SDD_OUTLOOK_INTEGRATION.md`)
Arquitectura *push* vía webhook (GAS no maneja bien OAuth2 multiusuario contra Microsoft Graph directamente):

```
CODIGO.js (UrlFetchApp) → Power Automate ("When an HTTP request is received")
                        → Office 365 Outlook: Create event (V4) → Calendario del delegado
```

Payload estándar:
```json
{
  "folio": "AV-1050",
  "titulo": "Asignación Tarea: CD - Cálculo y Diseño",
  "descripcion": "Se te ha asignado la etapa CD para el cliente EMPRESA X...",
  "fechaInicio": "2025-05-01T09:00:00.000Z",
  "fechaFin": "2025-05-01T10:00:00.000Z",
  "correoDestino": "sebastian.padilla@holtmont.com",
  "asignadoPor": "ANTONIA_VENTAS"
}
```
Se dispara desde `apiSaveTrackerBatch` en dos escenarios: delegación de un paso de Papa Caliente (`_assignToWorker`/`_assignStep`), y asignación general vía columna `VENDEDOR`/`RESPONSABLE`. Requiere que cada usuario en `USER_DB` tenga `email` corporativo real (`@holtmont.com`) — helper `findUserEmailByLabel(friendlyName)` resuelve nombre visible → email.

### 11.3 Gemini AI
`callGeminiAPI(prompt)` (con `apiSaveGeminiKey`/`apiCheckGeminiKey` para gestionar la API key en `PropertiesService`) se usa para: (a) generar resúmenes narrativos en los reportes automáticos de productividad y de cotizaciones (`_sendTrackerProductivityEmail`, `_sendAgentEmail`), y (b) transcripción de audio (`transcribirConGemini(base64Audio, mimeType)`).

---

## 12. Triggers y Automatizaciones Programadas

| Trigger | Función | Frecuencia | Instalación |
|---|---|---|---|
| Time-driven | `incrementarContadorDias` | Diario, 1am–2am | `instalarDisparador()` (idempotente — verifica si ya existe antes de crear) |
| Time-driven | `autoUpdateQuoteMetrics` | Diario | `setupDailyQuoteMetricsTrigger()` |
| `onEdit` (implícito vía trigger instalable) | `generarFolioAutomatico(e)` | Al editar `ANTONIA_VENTAS` | Genera folio numérico simple si la última fila no lo tiene, usando `LockService` (30s de espera) |
| `onOpen` (simple trigger nativo) | `onOpen()` | Al abrir la Spreadsheet en Sheets UI | Construye menú custom con `cmdRealizarAlta`/`cmdActualizar` |

---

## 13. Seguridad — Estado Actual y Advertencia

> ⚠️ **Advertencia explícita, no exagerada:** este sistema almacena las contraseñas de **~40 empleados reales**, en **texto plano**, en dos lugares dentro del repositorio versionado en git:
> 1. La constante `USER_DB` dentro de `CODIGO.js` (backend, línea 212).
> 2. El archivo `CREDENCIALES.md` (documentación).
>
> Cualquiera con acceso de lectura a este repositorio (incluyendo el historial de git) puede leer usuario y contraseña de cada empleado. `SDD_HOLTMONT_WORKSPACE.md` §2.2 ya documenta esto como una limitación conocida ("aceptable en un ecosistema privado" según esa nota), pero para un clon nuevo — sobre todo si el repositorio deja de ser estrictamente privado, o si se sube a un proveedor de terceros — esto es una vulnerabilidad real de exposición de credenciales.
>
> **Recomendación si se clona este sistema:** antes de desplegar, migrar `USER_DB` a `PropertiesService`/`PropertiesService.getScriptProperties()` o a hash+salt, y **rotar todas las contraseñas actuales**, ya que quedaron expuestas en el historial de este repositorio. Esto no fue solicitado en esta tarea y por lo tanto no se ha modificado — se documenta aquí para que quien clone el proyecto lo decida conscientemente.

Aparte de esto:
- No hay tokens de sesión persistentes verificados en cada request — la sesión vive en memoria del cliente (`ref()` de Vue) mientras la pestaña esté abierta.
- Autorización de escritura por columna se hace vía listas blancas (`allowedBase`/`allowed`) revisadas en cada guardado — correctamente implementado, pero depende de mantenerse sincronizadas entre frontend y backend cada vez que se agrega una columna nueva.
- `doGet` usa `XFrameOptionsMode.ALLOWALL`, lo que permite embeber la app en iframes de cualquier origen — necesario para el uso previsto (embebido en Sheets/Sites), pero amplía la superficie de clickjacking si la URL se filtra.

---

## 14. Testing y Verificación

No existe entorno Apps Script local real; las pruebas se hacen extrayendo lógica a Node y mockeando servicios de GAS.

```bash
npm install                    # instala acorn + jsdom (únicas dependencias, package.json)
node test_departments.js       # valida organigrama/departamentos tras tocar USER_DB o INITIAL_DIRECTORY
node check_html2.js            # valida sintaxis JS embebida en index.html (respaldo si check_html.js falla)
node test_deduplication.js     # valida lógica anti-duplicación
node test_distribution.js      # valida enrutamiento/distribución de tareas
# … y el resto de los ~15 test_*.js listados en §3, cada uno cubre un caso puntual histórico
```

Además, dentro de `CODIGO.js` hay funciones `test_*` (§7.13) pensadas para ejecutarse manualmente desde el editor de Apps Script contra la Spreadsheet real (no mockeada) — usar con cuidado en producción.

---

## 15. Guía Paso a Paso: Clonar el Proyecto Desde Cero

1. **Crear la Spreadsheet base.** Nueva Google Sheet vacía — será la base de datos. Desde `Extensiones → Apps Script`, se abre el proyecto de Apps Script vinculado (bound script).
2. **Copiar el manifest.** Pegar el contenido de `appsscript.json` (timezone `America/Mexico_City`, `runtimeVersion: V8`, y los 6 OAuth scopes: `spreadsheets`, `drive`, `script.external_request`, `script.scriptapp`, `userinfo.email`, `script.container.ui`).
3. **Copiar el backend.** Crear un archivo de script `CODIGO.gs` (o el nombre que use el proyecto) y pegar el contenido íntegro de `CODIGO.js`. **Antes de desplegar**, reemplazar/rotar todas las contraseñas de `USER_DB` (ver §13) y actualizar `WEBHOOK_OUTLOOK_URL` con un webhook propio de Make.com.
4. **Copiar el frontend.** Crear un archivo HTML llamado `Index.html` (el nombre debe coincidir con `HtmlService.createTemplateFromFile('Index')` en `doGet`) y pegar el contenido de `index.html`. Crear también un archivo HTML para `workorder_form.html` si se usa el módulo de Work Orders standalone.
5. **Verificar dependencias CDN.** Confirmar que el proyecto tiene salida a internet para cargar Vue 3, Bootstrap 5.3.0, SweetAlert2, Chart.js, Anime.js y Animate.css (todas vía CDN, sin instalación).
6. **Poblar hojas base.** Al primer `doGet`/login, `getDirectoryFromDB()` auto-crea `DB_DIRECTORY` desde `INITIAL_DIRECTORY`; ajustar esa constante al organigrama real antes del primer despliegue si es una empresa distinta. Las hojas Tracker individuales, `ANTONIA_VENTAS`, `PPCV3`, `PPC_BORRADOR`, `LOG_SISTEMA` y las 5 `DB_WO_*` se auto-crean con sus headers por defecto la primera vez que se escriben (ver §5).
7. **Configurar Script Properties.** `PropertiesService.getScriptProperties()` debe tener (se crean solas en el primer uso, pero conviene setearlas explícitamente): `WORKORDER_SEQ` (contador de folios de Work Order), `SEQ_ANTONIA_VENTAS` (contador de folios de Ventas), y la API key de Gemini si se usa `callGeminiAPI` (vía `apiSaveGeminiKey`).
8. **Instalar triggers.** Ejecutar manualmente una vez desde el editor: `instalarDisparador()` (contador de días diario) y `setupDailyQuoteMetricsTrigger()` (métricas de KPI diarias). El `onOpen()` simple trigger se activa solo.
9. **Configurar integraciones externas** (opcionales pero recomendadas para paridad funcional):
   - Crear un escenario en Make.com, apuntar `WEBHOOK_OUTLOOK_URL` a él.
   - Crear el flujo de Power Automate descrito en §11.2 (trigger HTTP → Office 365 Outlook Create Event V4), mapeando los campos del payload de §11.2.
10. **Desplegar como Web App.** `Implementar → Nueva implementación → Aplicación web`. Ejecutar como el propietario del script, acceso según la política de la organización (para uso interno, "Cualquier usuario dentro de [organización]").
11. **Primer login.** Usar cualquier credencial de `USER_DB` (tras rotarlas en el paso 3) para verificar `apiLogin` y que `getSystemConfig` arma el menú esperado según el rol.
12. **Correr la suite de pruebas local** (§14) antes de dar por buena la clonación, especialmente `test_departments.js` y `check_html2.js`.

---

## 16. Deuda Técnica y Archivos que NO son Fuente de Verdad

| Archivo(s) | Por qué existen | Por qué ignorarlos al clonar |
|---|---|---|
| `CODIGO.js.bak`, `CODIGO.js.orig`, `CODIGO.js.rej` | Respaldo manual / residuo de un merge con patch rechazado | Contenido desactualizado respecto a `CODIGO.js`; el `.rej` ni siquiera es JS válido completo (es un fragmento de diff) |
| `*.patch` (`fix_date_temp_id*.patch`, `fix_duplication.patch`) | Registro histórico de parches ya aplicados | Ya están incorporados en `CODIGO.js`; re-aplicarlos duplicaría cambios |
| `tracker_productivity_tool.js` … `_tool3.js`, `tracker_productivity_ui_tool.js` … `_ui_tool7.js` | Iteraciones sucesivas del mismo módulo de productividad durante desarrollo | Solo la lógica ya integrada en `CODIGO.js` (`apiFetchTrackerProductivityMetrics`, `runTrackerProductivityAgent`, etc.) es la vigente |
| `parse_*.js`, `get_issue_info.js`, `fix_anotnia.js`, `check_duplication.js`, `deduplicate_script.js`, `fix_all.js` | Scripts de diagnóstico ad-hoc usados durante incidentes puntuales de producción | Herramientas de un solo uso, no forman parte del flujo normal de la app |
| `SDD_HOLTMONT_WORKSPACE.md` (líneas ~348 en adelante) | El archivo contiene ~700 líneas de comentarios HTML vacíos (`<!-- Reserved expansion line N ... -->`) tras la Sección 9 | Es relleno sin contenido técnico; el contenido real de ese documento termina en la Sección 9 ("Conclusión de Arquitectura") |
| `image.png` | Mock/referencia visual de diseño | No es parte del código ejecutable |
| `plan_productivity.md` | Notas de planeación previas a la implementación | Superado por el código ya integrado |

**Regla práctica:** si dos archivos parecen describir lo mismo, **`CODIGO.js` e `index.html` (sin sufijo) siempre ganan** sobre cualquier variante numerada o con extensión `.bak/.orig/.rej`.

---

## 17. Anexo — Inventario Completo de Funciones (`CODIGO.js`, línea exacta)

```
115  formatDateForOutlook            2624  internalUpdateTask
172  findUserEmailByLabel            3005  apiUpdateTask
189  testIntegracionOutlook          3009  apiLogDateChange
257  doGet                           3025  apiFetchDrafts
266  findSheetSmart                  3057  apiSyncDrafts
277  findHeaderRow                   3090  apiClearDrafts
298  registrarLog                    3098  ensureSheetWithHeaders
310  apiLogin                        3109  saveChildData
322  apiLogout                       3124  apiSavePPCData
327  getDirectoryFromDB              3437  uploadFileToDrive
388  apiResyncDirectory              3455  apiFetchPPCData
467  apiAddEmployee                  3494  apiFetchWeeklyPlanData
529  apiDeleteEmployee               3623  getWeekNumber
560  getSystemConfig                 3632  apiSaveSite
706  generarDashboard                3679  apiSaveSubProject
719  apiFetchAdminKPIs               3732  apiFetchCascadeTree
909  apiFetchTrackerProductivityMetrics   3814  apiFetchProjectTasks
1113 runTrackerProductivityAgent     3880  apiSaveProjectTask
1176 _sendTrackerProductivityEmail   3909  onOpen
1243 apiFetchTeamKPIData             3924  cmdRealizarAlta
1371 apiFetchQuoteAgentMetrics       3979  cmdActualizar
1571 apiWriteQuoteMetricsToSheet     4023  apiCreateStandardStructure
1657 setupDailyQuoteMetricsTrigger   4041  generatePrefix
1669 autoUpdateQuoteMetrics          4067  generateNumericSequence
1683 callGeminiAPI                   4092  generateAppSheetId
1714 apiSaveGeminiKey                4101  generateWorkOrderFolio
1724 apiCheckGeminiKey               4176  apiGetNextWorkOrderSeq
1730 runQuoteMetricsAgent            4191  incrementarContadorDias
1856 apiGetLastAgentReport           4306  instalarDisparador
1867 _sendAgentEmail                 4329  generarFolioAutomatico
1949 test_DataIntegrity              4390  test_Generacion_MAP_COT
1988 internalFetchSheetData          4449  test_Security_Filter_AllowedBase
2070 apiFetchStaffTrackerData        4488  test_Flujo_Completo_Delegacion_y_Sincronizacion
2109 apiFetchSalesHistory            4581  test_Cierre_Terminal_RCC
2156 internalBatchUpdateTasks        4626  test_SavePPCV3_Flow
2600 apiUpdatePPCV3                  4685  test_WorkOrder_Generation
                                     4714  test_Directory_CRUD
4762  test_ReverseSync_Flow          5722  apiFetchUnifiedAgenda
4799  applyTrafficLightToSheet       5782  apiSavePersonalEvent
4905  setupConditionalFormatting     5792  apiSaveHabitLog
4937  colIndexToLetter               5807  transcribirConGemini
4947  test_NumericSequence_Generation 5852 forzarPermisos
4982  test_Antonia_Distribution_Manual 5864 test_SystemConfig_Label
4995  apiFetchInfoBankCompanies      5894  getOrCreateFolder
5059  apiFetchInfoBankData           5903  getBankRootFolder
5154  apiFetchDistinctClients        5922  archiveFile
5183  apiSaveTrackerBatch            5960  processQuoteRow
5670  apiFetchCombinedCalendarData   6023  batchArchiveExistingQuotes
                                     6047  runFullArchivingBatch
                                     6056  deduplicateAllSheets
                                     6167  debugSheetHeaders
                                     6193  test_avance_100_bug
```

---

## 18. Índice de Documentos Relacionados en este Repositorio

| Documento | Enfoque |
|---|---|
| `AGENTS.md` | Reglas de negocio operativas + "skills" para agentes de IA que editen el código |
| `SDD_HOLTMONT_WORKSPACE.md` | Arquitectura general, Design Tokens, catálogo de API (v2.0.0) — nota: contenido real termina en su Sección 9, el resto es relleno (ver §16) |
| `PAPA_CALIENTE_SDD.md` | Especificación completa de la máquina de estados de cotizaciones (7 etapas) |
| `SDD_OUTLOOK_INTEGRATION.md` | Integración con Outlook/Power Automate, incluye código de referencia completo |
| `SDD_KPI_ADMIN.md` | Dashboard de KPIs para administradores: fórmulas de negocio exactas (% cierre, win rate, semaforización) |
| `FRONTEND ANTONIA.md` | Especificación de refactor UI/UX del Data Grid (hitboxes, timeline, accordion, A11y) |
| `CREDENCIALES.md` | Organigrama y credenciales vigentes (⚠️ texto plano, ver §13) |

---

*Fin del documento. Este SSD se generó por inspección directa del código fuente (`CODIGO.js`, `index.html`, `appsscript.json`) y de todos los SDD existentes en el repositorio a la fecha indicada. Si el código cambia, este documento debe re-derivarse — no es una fuente independiente del código, es su mapa.*
