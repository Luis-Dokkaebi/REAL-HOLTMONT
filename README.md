# Holtmont Workspace

Sistema interno de gestión de tareas, PPC (Percent Plan Complete / Last Planner), cotizaciones,
work orders y KPIs para **Holtmont**, construido como una **Web App monolítica sobre Google Apps Script (GAS)**
con frontend **Vue.js sin build step** y **Google Sheets como base de datos**.

> Documentación técnica con enfoque **Specification-Driven Development (SDD)**. El objetivo de esta
> carpeta es que cualquier desarrollador pueda **replicar el sistema exactamente** como está construido.

---

## 📑 Índice de documentación

| Documento | Contenido |
|---|---|
| **README.md** (este archivo) | Mapa del SDLC: requisitos, dependencias, variables de entorno y guía para levantar dev/prod. |
| [`docs/openapi.yaml`](docs/openapi.yaml) | Contrato formal de la API (RPC `google.script.run` modelado como OpenAPI 3.1). |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Especificación narrativa de endpoints, payloads y respuestas por función. |
| [`docs/ARQUITECTURA_Y_BASE_DE_DATOS.md`](docs/ARQUITECTURA_Y_BASE_DE_DATOS.md) | Arquitectura del software, modelo de datos (hojas/tablas, relaciones, tipos) y flujo de datos. |
| [`docs/PIPELINE_Y_DESPLIEGUE.md`](docs/PIPELINE_Y_DESPLIEGUE.md) | QA/pruebas, control de calidad en PRs y flujo de despliegue (`clasp` / editor de GAS). |
| [`AGENTS.md`](AGENTS.md) | Reglas de negocio y "skills" obligatorias para agentes de IA y desarrolladores. |
| [`CREDENCIALES.md`](CREDENCIALES.md) | Matriz de usuarios, roles y departamentos (organigrama oficial). |

---

## 1. Descripción general del sistema

Holtmont Workspace (versión interna **V158 — ScriptMaster Edition**) es un panel único desde el cual:

- El personal registra y da seguimiento a sus **tareas / actividades PPC** en su *Tracker* personal.
- El área de ventas gestiona **cotizaciones** con lógica bidireccional ("Reverse Sync").
- Se generan **Work Orders** con folios automáticos y estructura de proyecto estándar.
- Los administradores consultan **KPIs de productividad y cotizaciones**, con reportes asistidos por
  **Gemini** y notificaciones a **Outlook vía Make.com**.

**No hay servidor propio, ni contenedores, ni base de datos SQL.** Todo corre dentro de la infraestructura
gestionada de Google (Apps Script + Sheets + Drive).

### Stack

| Capa | Tecnología |
|---|---|
| Backend | Google Apps Script (runtime **V8**), archivo único `CODIGO.js` |
| Frontend | **Vue.js 3** vía CDN, monolítico en `index.html` (+ `workorder_form.html`) |
| Puente FE↔BE | `google.script.run` (RPC asíncrono, sin REST) |
| Base de datos | Google Sheets (una hoja por entidad/persona) |
| Almacenamiento de archivos | Google Drive |
| Integraciones | Make.com → Outlook 365 (webhook), Google Gemini API |
| Zona horaria | `America/Mexico_City` |

---

## 2. Requisitos del sistema

### Para operar / desplegar

- Una **cuenta de Google Workspace** con acceso al Spreadsheet contenedor del proyecto Apps Script.
- Permisos para autorizar los **OAuth scopes** declarados en `appsscript.json` (ver §4).
- (Opcional, recomendado) **Node.js ≥ 18** para ejecutar las pruebas locales y **`clasp`** para
  el despliegue por línea de comandos.

### Para desarrollo local (pruebas y verificación de sintaxis)

- **Node.js ≥ 18** y **npm**.
- Dependencias de desarrollo (ver `package.json`):
  - `acorn ^8.16.0` — parser de JS para validar sintaxis del frontend.
  - `jsdom ^29.1.1` — DOM simulado para pruebas del `index.html`.

> El backend **no** usa librerías de Node. Las pruebas locales corren la lógica de `CODIGO.js`
> en un sandbox de Node (`vm`) con *stubs* de los servicios de GAS.

---

## 3. Dependencias exactas

### 3.1 Runtime backend (Google Apps Script)

Declaradas en `appsscript.json`:

```json
{
  "timeZone": "America/Mexico_City",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

No hay dependencias de Apps Script Advanced Services ni librerías externas de GAS. Se usan únicamente
servicios nativos: `SpreadsheetApp`, `DriveApp`, `UrlFetchApp`, `CacheService`, `LockService`,
`PropertiesService`, `HtmlService`, `Session`, `ScriptApp`.

### 3.2 Frontend (CDN, sin build)

Cargadas por `<script>`/`<link>` dentro de `index.html`. No existe `webpack`, `vite` ni paso de
compilación. Las librerías (Vue 3, Font Awesome, etc.) se importan directamente por CDN.

### 3.3 Herramientas de desarrollo (npm)

```json
{
  "dependencies": {
    "acorn": "^8.16.0",
    "jsdom": "^29.1.1"
  }
}
```

Instalación:

```bash
npm install
```

---

## 4. Variables de entorno y configuración

Google Apps Script **no usa un archivo `.env`**. La configuración vive en tres lugares:

### 4.1 Script Properties (secretos en tiempo de ejecución)

Se configuran en **Editor de Apps Script → Configuración del proyecto → Propiedades del script**,
o mediante las funciones API. Son la analogía a variables de entorno:

| Propiedad | Uso | Se establece con |
|---|---|---|
| `GEMINI_API_KEY` | Clave de la API de Google Gemini para resúmenes de KPIs. | `apiSaveGeminiKey(key)` / manual |
| `WORKORDER_SEQ` | Contador incremental de folios de Work Order. | Autogestionado |
| `ANTONIA_SEQ` | Contador de secuencia para folios de ventas de Antonia. | Autogestionado |
| `LAST_AGENT_RUN` | Último reporte del agente de cotizaciones (cache JSON). | Autogestionado |
| `<PREFIJO>_SEQ` | Secuencias numéricas por prefijo de proyecto/cliente. | Autogestionado |

### 4.2 Constantes de configuración (en `CODIGO.js`)

| Constante | Valor por defecto | Descripción |
|---|---|---|
| `WEBHOOK_OUTLOOK_URL` | `https://hook.us2.make.com/…` | Webhook de Make.com para notificaciones a Outlook. **Cambiar por el de tu escenario.** |
| `APP_CONFIG.ppcSheetName` | `PPCV3` | Hoja maestra de captura PPC. |
| `APP_CONFIG.draftSheetName` | `PPC_BORRADOR` | Hoja de borradores. |
| `APP_CONFIG.salesSheetName` | `Datos` | Hoja de datos de ventas. |
| `APP_CONFIG.logSheetName` | `LOG_SISTEMA` | Bitácora de auditoría. |
| `APP_CONFIG.directorySheetName` | `DB_DIRECTORY` | Directorio/organigrama persistido. |
| `APP_CONFIG.woMaterialsSheet` … | `DB_WO_*` | Hojas de detalle de Work Orders. |
| `FOLIO_CONFIG.SHEET_NAME` | `ANTONIA_VENTAS` | Hoja fuente de ventas para folios. |
| `DEMO_MODE` | `false` | Bandera de modo demo. |

### 4.3 OAuth scopes requeridos (`appsscript.json`)

La Web App solicita autorización para:

```
https://www.googleapis.com/auth/spreadsheets             # leer/escribir hojas
https://www.googleapis.com/auth/drive                    # subir/archivar archivos
https://www.googleapis.com/auth/script.external_request  # UrlFetch (Make.com, Gemini)
https://www.googleapis.com/auth/script.scriptapp         # crear triggers
https://www.googleapis.com/auth/userinfo.email           # identidad del usuario
https://www.googleapis.com/auth/script.container.ui      # UI en el contenedor
```

---

## 5. Guía paso a paso: entorno de desarrollo

### Opción A — Desarrollo con `clasp` (recomendada)

```bash
# 1. Clonar el repositorio
git clone <repo-url> && cd REAL-HOLTMONT

# 2. Instalar herramientas de prueba
npm install

# 3. Instalar y autenticar clasp (CLI oficial de Apps Script)
npm install -g @google/clasp
clasp login

# 4. Vincular a un proyecto de Apps Script existente (o crear uno nuevo)
#    Necesitas el Script ID del proyecto contenedor del Spreadsheet.
clasp clone <SCRIPT_ID>        # o: clasp create --type sheets

# 5. Empujar el código local al proyecto de Apps Script
clasp push
```

> **Mapeo de archivos:** en Apps Script, `CODIGO.js` es el archivo de servidor y `index.html` /
> `workorder_form.html` / `verification.html` son archivos HTML. `doGet` sirve la plantilla
> `Index` (`HtmlService.createTemplateFromFile('Index')`), por lo que `index.html` debe llamarse
> **`Index`** dentro del editor de Apps Script.

### Opción B — Desarrollo directo en el editor web

1. Abre el Spreadsheet contenedor → **Extensiones → Apps Script**.
2. Pega/edita `CODIGO.js` y los archivos HTML.
3. Guarda y usa **Ejecutar** sobre las funciones `test_*` para validar lógica.

### Verificación local antes de commitear

```bash
node test_departments.js   # valida organigrama (USER_DB + INITIAL_DIRECTORY)
node check_html2.js        # valida sintaxis del frontend (index.html)
```

Ver [`docs/PIPELINE_Y_DESPLIEGUE.md`](docs/PIPELINE_Y_DESPLIEGUE.md) para el catálogo completo de pruebas.

---

## 6. Guía paso a paso: producción

1. **Configurar secretos:** en el editor de Apps Script, define `GEMINI_API_KEY` en las Propiedades
   del script y actualiza `WEBHOOK_OUTLOOK_URL` con tu escenario real de Make.com.
2. **Autorizar scopes:** ejecuta cualquier función una vez para disparar el consentimiento OAuth.
3. **Desplegar la Web App:**
   - Editor de Apps Script → **Implementar → Nueva implementación → Aplicación web**.
   - *Ejecutar como:* el propietario del Spreadsheet.
   - *Quién tiene acceso:* según política interna (normalmente "Cualquiera dentro de Holtmont").
   - `doGet` sirve la interfaz con `setXFrameOptionsMode(ALLOWALL)` para permitir su embebido.
4. **Instalar triggers programados** (una vez):
   - `setupDailyQuoteMetricsTrigger()` → agente de cotizaciones diario a las **07:00**.
   - `instalarDisparador()` → generación de folios / procesos a la **01:00**.
5. **Inicializar datos maestros:** entra como `ADMIN` y ejecuta **Re-sincronizar Directorio**
   (`apiResyncDirectory`) para (re)crear `DB_DIRECTORY` y las hojas de tracker faltantes.
6. **Menú de hoja:** al abrir el Spreadsheet, `onOpen()` agrega el menú **⚡ HOLTMONT CMD** con
   utilidades de alta, actualización y formato condicional.

### Rollback

Apps Script versiona cada implementación. Para revertir: **Implementar → Administrar implementaciones**
y selecciona una versión anterior. En git, revierte el commit correspondiente y ejecuta `clasp push`.

---

## 7. Estructura del repositorio

```
REAL-HOLTMONT/
├── CODIGO.js                 # Backend GAS (todo el servidor)
├── index.html                # Frontend Vue monolítico (archivo "Index" en GAS)
├── workorder_form.html       # Formulario de Work Order
├── verification.html         # Página de verificación auxiliar
├── appsscript.json           # Manifiesto: scopes, runtime, timezone
├── package.json              # Dependencias de pruebas locales (acorn, jsdom)
├── test_*.js / check_*.js    # Suite de pruebas locales (Node + stubs de GAS)
├── docs/                     # Documentación técnica SDD (este set)
├── AGENTS.md                 # Reglas de negocio / skills para IA y devs
├── CREDENCIALES.md           # Matriz de usuarios y organigrama
└── SDD_*.md / SSD_*.md       # Especificaciones de módulos y clonación
```

> **Nota sobre archivos auxiliares:** varios `.js`, `.patch`, `.txt` y `.bak` en la raíz son
> artefactos de análisis y parches históricos. Los archivos de producción son `CODIGO.js`,
> `index.html`, `workorder_form.html`, `verification.html` y `appsscript.json`.
