# Prompt: construir el backend Python que reemplaza CODIGO.js

> Copiar todo lo que sigue (a partir de la línea divisoria) y pegarlo como
> primer mensaje en la sesión que va a construir el backend.

---

## Contexto del proyecto

Trabajo en **Holtmont Workspace**, un sistema interno de gestión de obra y
cotizaciones para una constructora. Hoy es una Web App monolítica sobre Google:

- **Frontend**: `index.html` — SPA en Vue 3 servida por CDN, sin build. ~673 KB,
  todo el HTML/CSS/JS en un solo archivo. Se comunica con el backend por
  `google.script.run.<funcion>(args)`.
- **Backend**: `CODIGO.js` — Google Apps Script (V8), ~6,600 líneas, sin
  dependencias npm.
- **Base de datos actual**: las pestañas de un Google Spreadsheet (una hoja por
  persona, más hojas maestras).

**Ya migré los datos a Supabase (Postgres).** Esa parte está terminada y
verificada. Lo que falta —y es lo que quiero que construyas— es el **backend en
Python que reemplace `CODIGO.js`**, para que Supabase deje de ser una copia
estática y pase a ser la base de datos real de la aplicación.

## Estado actual: qué ya está hecho

En la carpeta `migration/` del repo hay un pipeline de migración completo y
funcionando:

| Archivo | Qué hace |
|---|---|
| `schema.sql` | DDL base: 18 tablas |
| `schema_patch_v2.sql` | Parche: columnas faltantes en `quotes` + tablas `plan_semanal` y `catalogos` |
| `schema_auth.sql` | Tabla `profiles` ligada a `auth.users` (login real) — **creada pero aún no poblada** |
| `lib.py` | Parsing/extracción del `.xlsx`, sin tocar la BD |
| `migrate.py` | Extrae, deduplica y carga por conexión Postgres directa |
| `migrate_rest.py` | Igual, pero por API REST (para entornos sin TCP al 5432) |
| `migrate_auth.py` | Migra los 41 usuarios de `USER_DB` a Supabase Auth — **listo, sin ejecutar** |

Datos ya cargados y verificados contra el Excel original (coincidencia exacta):

| Tabla | Filas | Columnas |
|---|---|---|
| `people` | 54 | `id`, `nombre`, `departamento`, `tipo_hoja`, `created_at` |
| `sites` | 1 | `id_sitio`, `nombre`, `cliente`, `tipo`, `estatus`, `fecha_creacion`, `creado_por`, `created_at` |
| `projects` | 4 | `id_proyecto`, `id_sitio`, `nombre_subproyecto`, `tipo`, `estatus`, `fecha_creacion`, `creado_por`, `created_at` |
| `tasks` | 4,626 | `id`, `folio`, `dedupe_key`, `folio_sintetico`, `assignee_id`, `assignee_raw`, `departamento`, `fecha_alta`, `hora_alta`, `clasificacion`, `concepto`, `avance`, `fecha_estimada_fin`, `hora_estimada_fin`, `reloj`, `restricciones`, `prioridad`, `riesgos`, `fecha_respuesta`, `correo`, `carpeta`, `cumplimiento`, `comentarios`, `comentarios_semana`, `comentarios_semana_previa`, `status`, `source_sheet`, `created_at` |
| `task_involucrados` | 7,246 | `task_id`, `person_id`, `raw_name` |
| `ppc_borradores` | 11 | `id`, `especialidad`, `concepto`, `responsable_raw`, `responsable_id`, `horas`, `cumplimiento`, `archivo`, `comentarios`, `previos`, `prioridad`, `riesgos`, `restricciones`, `fecha_respuesta`, `clasificacion`, `fecha_alta`, `ruta_critica`, `zona`, `contratista`, `cuant_requerida`, `cuant_real`, `dias_json`, `created_at` |
| `quotes` | 661 | `folio`, `area`, `cliente`, `concepto`, `clasificacion`, `vendedor_id`, `vendedor_raw`, `f_visita`, `f_inicio`, `f_entrega`, `dias`, `avance`, `estatus`, `comentarios`, `requisitor`, `prioridad_cot`, `info_cliente`, `f2`, `cotizacion`, `timeline`, `layout`, `proceso`, `proceso_log`, `map_cot`, `monto`, `source_sheet`, `extra`, `created_at`, `archivo`, `fecha`, `comentario`, `estatus_2`, `fecha_envio`, `dias_2`, `llamada_cliente`, `reloj`, `completada` |
| `banco_datos` | 3 | `folio`, `cliente`, `fecha_inicio`, `area`, `concepto`, `vendedor`, `estatus`, `cotizacion`, `last_update` |
| `work_orders` | 1 | `folio`, `created_at` |
| `wo_materiales` | 1 | `id`, `folio`, `cantidad`, `unidad`, `tipo`, `descripcion`, `costo`, `especificacion`, `total`, `residente`, `compras`, `controller`, `orden_compra`, `pagos`, `almacen`, `logistica`, `residente_obra` |
| `wo_mano_obra` | 1 | `id`, `folio`, `categoria`, `salario`, `personal`, `semanas`, `extras`, `nocturno`, `fin_semana`, `otros`, `total` |
| `wo_herramientas` | 1 | `id`, `folio`, `cantidad`, `unidad`, `descripcion`, `costo`, `total`, `residente`, `controller`, `almacen`, `logistica`, `residente_fin` |
| `wo_equipos` | 1 | `id`, `folio`, `cantidad`, `unidad`, `tipo`, `descripcion`, `especificacion`, `dias`, `horas`, `costo`, `total` |
| `wo_programa` | 1 | `id`, `folio`, `descripcion`, `fecha`, `duracion`, `unidad_duracion`, `unidad`, `cantidad`, `precio`, `total`, `responsable`, `seccion`, `estatus` |
| `personal_agenda` | 27 | `id`, `usuario_id`, `usuario_raw`, `fecha`, `tipo`, `hora_inicio`, `hora_fin`, `titulo`, `estatus`, `detalles` |
| `habits_log` | 1 | `id`, `usuario_id`, `usuario_raw`, `habito`, `meta`, `log_json`, `fecha_actualizacion` |
| `kpi_cotizaciones` | 24 | `id`, `departamento`, `total`, `ganadas`, `perdidas`, `snapshot_at` |
| `plan_semanal` | 1,180 | `id`, `id_origen`, `task_folio`, `ruta_critica`, `zona`, `especialidad`, `descripcion`, `cuantificacion_req`, `cuantificacion_real`, `responsable_id`, `responsable_raw`, `contratista`, `dias`, `cumplimiento`, `nota_cnc`, `source_sheet`, `created_at` |
| `catalogos` | 75 | `id`, `tipo`, `valor` |
| `system_log` | 16,196 | `id`, `fecha_hora`, `usuario`, `accion`, `detalles` |

Además, `CODIGO.js` ya tiene un módulo `SupabaseSync` que replica en Supabase
cada escritura que la app hace en Sheets (escritura doble). Sirve como puente
mientras existe el backend nuevo: **Sheets sigue siendo la fuente de verdad
hasta que tú termines**.

## El contrato de API que debes respetar

Esto es lo más importante. El frontend (`index.html`) llama **34 funciones**
por `google.script.run`. Son la superficie que el backend nuevo tiene que
reproducir. Firmas exactas tomadas de `CODIGO.js`:

```
apiLogin(username, password)
apiLogout(username)
apiResyncDirectory()
apiAddEmployee(payload)
apiDeleteEmployee(name)

apiFetchStaffTrackerData(personName)
apiSaveTrackerBatch(personName, tasks, username)
apiUpdateTask(personName, taskData, username)
apiLogDateChange(payload, username)

apiFetchPPCData()
apiSavePPCData(payload, activeUser)
apiUpdatePPCV3(taskData, username)
apiFetchWeeklyPlanData(username)

apiFetchDrafts()
apiSyncDrafts(drafts)
apiClearDrafts()

apiFetchSalesHistory()
apiFetchQuoteAgentMetrics(params)
apiWriteQuoteMetricsToSheet(params)

apiFetchCascadeTree()
apiFetchProjectTasks(projectName)
apiSaveProjectTask(taskData, projectName, username)
apiSaveSite(siteData)
apiSaveSubProject(subProjectData)

apiGetNextWorkOrderSeq()

apiFetchCombinedCalendarData(sheetName)
apiFetchUnifiedAgenda(username)
apiSavePersonalEvent(eventData)
apiSaveHabitLog(habitData)

apiFetchInfoBankCompanies(year, monthName)
apiFetchInfoBankData(year, monthName, companyName, folderName)

apiSaveGeminiKey(key)
apiCheckGeminiKey()
apiGetLastAgentReport()
```

Todas devuelven una envoltura `{ success: boolean, ... }`. Si `success` es
`false`, suele venir `message` con el error.

## Reglas de negocio que NO puedes romper

Estas son trampas reales que ya me costaron trabajo descubrir. Respétalas:

1. **`AVANCE` tiene tres representaciones mezcladas.** La hoja guarda `"0%"`
   (texto), `100` (ya en porcentaje) y `1` (que significa 100%, por formato de
   celda porcentual). Regla de normalización: si el valor está entre 0 y 1, se
   multiplica por 100; si es mayor a 1, se deja igual. En Supabase `avance`
   siempre está en escala **0–100**.

2. **Identidad de fila / `dedupe_key`.** Los folios con prefijo de secuencia
   global (`PPC-`, `AV-`, `TG-`, `WO-`, `SITE-`, `PROJ-`) o numéricos tipo
   timestamp (10+ dígitos) son únicos globalmente. Los folios numéricos cortos
   son IDs legacy que **solo son únicos dentro de su hoja**, por eso su
   `dedupe_key` es `"<hoja>::<folio>"`. No cambies esta lógica sin migrar los
   datos existentes.

3. **Un mismo folio puede estar en varias filas legítimamente.** Ej. `JO-0009`
   aparece en 10 trackers distintos: es una tarea difundida a varias personas
   ("Papa Caliente", delegación lateral). No las colapses en una sola.

4. **`INVOLUCRADOS` es N:M.** En la hoja venía como texto con varios nombres
   separados por coma o salto de línea. En Supabase es la tabla
   `task_involucrados`. Nunca guardes un string compuesto como si fuera una
   persona (ya hubo un bug así: ensuciaba `people` con filas tipo
   `"RAMIRO RODRIGUEZ, ALFONSO CORREA, TERESA GARZA"`).

5. **Auto-archivado a "TAREAS REALIZADAS".** Cuando una tarea llega a 100%
   (o su ESTATUS está en `HECHO/TERMINADO/FINALIZADO/REALIZADO/COMPLETADO/DONE`,
   o `CUMPLIMIENTO = SI`), pasa a la sección de realizadas. En el modelo nuevo
   esto debe ser un cambio de estado, no mover filas.

6. **Generación de folios.** Ventas usa prefijo `AV-` con secuencia
   `ANTONIA_SEQ_V2`; work orders usan `WORKORDER_SEQ` con formato
   `<INI-CLIENTE>-<Abrev-Depto>-####` (padStart 4). Hoy los contadores viven en
   `PropertiesService`; en Postgres deben ser secuencias o una tabla de
   contadores **con bloqueo**, para no repetir folios con usuarios concurrentes.

7. **Anti-duplicación (Gatekeeper).** El frontend manda un `_tempId` por fila
   nueva y el backend actual usa `CacheService` para bloquear envíos duplicados
   del mismo evento (doble clic, reintento de red). Hay que conservar una
   protección equivalente: idempotencia por `_tempId`.

8. **"Ley de Antonia".** Hay reglas de enrutamiento por usuario cableadas: las
   actividades de `ANTONIA_VENTAS` no se mezclan con las de `ANTONIA PINEDA
   LOPEZ` aunque sean la misma persona física, y el sufijo `(VENTAS)` se filtra
   según quién sea el usuario activo. Revisa `apiSavePPCData` antes de tocar
   enrutamiento.

9. **Encabezados tolerantes.** El código actual compara encabezados sin
   distinguir mayúsculas/acentos porque las hojas tienen inconsistencias
   humanas. Ejemplos reales: `TIMEOUT` es una errata de `TIMELINE`;
   `Cotización` vs `COTIZACION`; `F. VISITA` vs `FECHA VISITA`.

## Autenticación

Hoy el login es **inseguro por diseño conocido**: hay un objeto `USER_DB`
hardcodeado en `CODIGO.js` (línea ~223) con 41 usuarios y **contraseñas en
texto plano**. Roles existentes: `ADMIN`, `ADMIN_CONTROL`, `PPC_ADMIN`,
`STAFF_USER`, `TONITA`, `WORKORDER_USER`.

Ya dejé preparado —pero **sin ejecutar**— el camino correcto:
- `migration/schema_auth.sql`: tabla `profiles` (`id` → `auth.users.id`,
  `username`, `role`, `label`, `dept`, `seller`, `person_id` → `people.id`,
  `email`).
- `migration/migrate_auth.py`: crea las 41 cuentas en Supabase Auth
  conservando la misma contraseña que ya usa cada persona, pero hasheada por
  Supabase. A quien no tiene correo real le asigna uno sintético
  `<usuario>@holtmont.internal` (solo identificador interno, no se envía nada).

El backend nuevo debe usar Supabase Auth con JWT, y `getSystemConfig(role,
username)` (RBAC actual, `CODIGO.js` línea ~571) es la referencia de qué ve
cada rol.

## Lo que quiero que construyas

Una **API en Python con FastAPI** que reemplace `CODIGO.js`:

1. **Estructura del proyecto**: paquete `backend/` con separación clara
   (routers, servicios, modelos/esquemas Pydantic, acceso a datos). No un solo
   archivo gigante — precisamente estamos huyendo de eso.
2. **Acceso a datos**: SQLAlchemy o el cliente de Supabase, con pool de
   conexiones. Transacciones reales en las operaciones de escritura por lotes
   (hoy no hay transacciones y la consistencia es "eventual y por convención").
3. **Endpoints**: cubrir las 34 funciones de arriba. Puedes exponerlas como
   REST idiomático (`GET /tasks/{persona}`, `POST /tasks/batch`, …) siempre y
   cuando quede documentado el mapeo función-vieja → endpoint-nuevo, porque
   habrá que adaptar el frontend.
4. **Auth**: login contra Supabase Auth, JWT, dependencia de FastAPI que
   resuelva usuario+rol, y autorización por rol equivalente al RBAC actual.
5. **Concurrencia**: reemplazar `LockService`/`CacheService` por bloqueo a nivel
   de base de datos (advisory locks o `SELECT ... FOR UPDATE`) e idempotencia
   por `_tempId`.
6. **Auditoría**: toda mutación relevante escribe en `system_log` (equivalente
   a `registrarLog()`).
7. **Pruebas**: tests de las reglas de negocio de la sección anterior,
   especialmente normalización de `AVANCE`, cálculo de `dedupe_key`,
   auto-archivado e idempotencia. Que corran sin necesidad de una base real
   (fixtures o base de prueba efímera).
8. **Configuración**: todo por variables de entorno (`.env`, ya está en
   `.gitignore`; hay un `.env.example` en la raíz). **Nunca** credenciales
   hardcodeadas — ni siquiera como valor por defecto de `os.environ.get(...)`.

## Restricciones y advertencias

- **No rompas la operación.** El sistema está en uso diario. Sheets y la app
  actual deben seguir funcionando durante toda la transición; el corte se hace
  al final y de forma deliberada.
- **No toques `index.html` todavía** salvo que te lo pida explícitamente. La
  migración del frontend es una fase aparte.
- **Integraciones externas que hay que preservar**: webhook a Make.com que crea
  eventos en Outlook 365 al asignar tarea (`NotifierService.sendToOutlook`), y
  la API de Google Gemini para los reportes de KPI (`callGeminiAPI`,
  `autoUpdateQuoteMetrics`, trigger diario 07:00).
- **Google Drive**: los archivos (cotizaciones, layouts, timelines, F2) viven en
  Drive y en la base solo hay URLs. Define cómo se van a manejar las subidas en
  el backend nuevo — es una decisión pendiente, no la asumas resuelta.
- Hay **RLS sin configurar** en las tablas. Hay que definir políticas antes de
  exponer la key `anon` a cualquier frontend.

## Documentación de apoyo en el repo

- `docs/ARQUITECTURA_Y_BASE_DE_DATOS.md` — modelo de datos y flujos actuales
- `docs/API_CONTRACT.md` y `docs/openapi.yaml`
- `docs/PIPELINE_Y_DESPLIEGUE.md` — cómo se despliega hoy (manual, `clasp` o
  copiar/pegar en el editor de Apps Script)
- `AGENTS.md` — convenciones del repo
- `migration/README.md` — mapeo hoja→tabla y decisiones de normalización

## Cómo quiero que arranques

**No escribas código todavía.** Primero:

1. Lee `CODIGO.js`, `docs/ARQUITECTURA_Y_BASE_DE_DATOS.md` y
   `migration/README.md` para entender el sistema real, no el idealizado.
2. Preséntame un **plan de implementación por fases**, donde cada fase deje el
   sistema funcionando (nada de un "big bang" que rompa la operación).
3. Señálame las **decisiones que requieren mi input** (manejo de archivos de
   Drive, si migramos el frontend a REST o mantenemos una capa de
   compatibilidad, estrategia de corte final, etc.).
4. Dime explícitamente qué encontraste que **contradice** lo que te describí
   arriba — este resumen lo escribí yo y puedo haberme equivocado.

Después de que acordemos el plan, empezamos a construir.
