# Migración a Supabase

Migra el Spreadsheet de Holtmont Workspace (`TrackerVersion4_7.xlsx`, exportado
completo de Google Sheets con `Archivo → Descargar → Microsoft Excel .xlsx`)
a una base de datos relacional en Supabase/Postgres.

## Archivos

- `schema.sql` — DDL completo (tablas, FKs, índices) para Postgres/Supabase.
- `lib.py` — parsing y extracción, puro (no toca la base de datos). Probado
  contra el archivo real antes de escribir el loader.
- `migrate.py` — CLI: extrae, deduplica/normaliza en memoria, y carga.
- `requirements.txt` — `openpyxl` (lectura del xlsx) y `psycopg2-binary` (carga).

## Pasos

```bash
pip install -r requirements.txt

# 1. Sanity check: extrae y muestra conteos por tabla, sin tocar la DB.
python3 migrate.py --xlsx /ruta/TrackerVersion4_7.xlsx --dry-run

# 2. Crear el esquema en Supabase (Project Settings -> Database -> Connection string -> URI)
psql "$DATABASE_URL" -f schema.sql

# 3. Cargar los datos.
python3 migrate.py --xlsx /ruta/TrackerVersion4_7.xlsx --database-url "$DATABASE_URL"
```

`DATABASE_URL` también se puede dejar en la variable de entorno en vez de pasarla
por flag. La carga corre dentro de una sola transacción: si algo falla se hace
rollback completo, no queda a medias.

## Mapeo hoja -> tabla

| Hojas de origen | Tabla destino | Notas |
|---|---|---|
| `DB_DIRECTORY` | `people` | + toda persona que aparezca como asignado/vendedor/involucrado aunque no esté en el directorio (se auto-registra). |
| `DB_SITIOS` | `sites` | |
| `DB_PROYECTOS` | `projects` | FK a `sites`. |
| Un tracker por persona (~50 hojas) + `PPCV4` | `tasks` + `task_involucrados` | Ver "Deduplicación" abajo. |
| `PPC_BORRADOR` | `ppc_borradores` | Tabla separada: son borradores previos a la asignación, esquema distinto (`RUTA_CRITICA`, `ZONA`, `CONTRATISTA`, etc.). |
| `ANTONIA_VENTAS` + hojas `<VENDEDOR> (VENTAS)` | `quotes` | `ANTONIA_VENTAS` es la autoridad; las hojas de vendedor solo aportan folios/columnas que la maestra no tenía. |
| `DB_BANCO_DATOS` | `banco_datos` | |
| `DB_WO_MATERIALES/MANO_OBRA/HERRAMIENTAS/EQUIPOS/PROGRAMA` | `wo_materiales`, `wo_mano_obra`, `wo_herramientas`, `wo_equipos`, `wo_programa` | FK a `work_orders.folio` (tabla generada a partir de los folios distintos encontrados). |
| ` AGENDA_PERSONAL` | `personal_agenda` | |
| `HABITOS_LOG` | `habits_log` | |
| `KPI_COTIZACIONES` | `kpi_cotizaciones` | Snapshot; es una métrica calculada, no una fuente primaria. |
| `LOG_SISTEMA` | `system_log` | 14,185 filas, carga en bloques de 1000. |

### Hojas descartadas (sin datos reales o duplicadas)

`PPCV3` (versión vieja/vacía de `PPCV4`), `Copia de Personal`, `Copia de hojaformato 3`,
`Copia de hojaformato2`, `Holtmont`, `DASHBOARD RAMIRO RODRIGUEZ` (tabla pivote
calculada), `Construcción`/`Coordinador HVAC`/`Electromecanica`/`Limpieza`
(hojas de ventas por departamento, legacy, 0-1 filas). Ninguna de estas tiene
registros reales — se verificó con `lib.py` antes de excluirlas, no es una
suposición.

Las ~16 hojas de tracker "plantilla" (`ALEXIS TORRES`, `RUBEN PESQUEDA`, etc.)
sí se procesan: la mayoría no tiene tareas reales, pero algunas (`DIMAS RAMOS`,
`ROCIO CASTRO`) sí tienen registros mezclados con la plantilla vacía, así que
se dejan en el flujo normal en vez de excluirlas a mano.

## Deduplicación de `tasks`

Google Sheets usa el mismo folio (`PPC-xxxxxxxx`) tanto en `PPCV4` (maestro)
como en la hoja personal del responsable (`RESPONSABLE.RESPONSABLE ──enruta──▶
Hoja "<RESPONSABLE>"`, ver `docs/ARQUITECTURA_Y_BASE_DE_DATOS.md`). Para no
duplicar la misma tarea dos veces:

- Si el folio empieza con un prefijo de secuencia global (`PPC-`, `AV-`, `TG-`,
  `WO-`, `SITE-`, `PROJ-`) o es un número tipo timestamp (`Date.now()`, 10+
  dígitos), se usa el folio tal cual como llave de dedupe — es global por diseño.
- Si el folio es un número corto legacy (ej. `"9"`, `"43"`) — **no** se asume
  que sea único entre hojas distintas, porque históricamente cada hoja tenía su
  propio contador. La llave de dedupe pasa a ser `"<hoja>::<folio>"`, así nunca
  se fusionan por accidente dos tareas distintas que comparten un número viejo.
- Si no había folio en absoluto (filas antiguas sin ID), se genera uno
  sintético y se marca `folio_sintetico = true`.

Cuando dos filas comparten la llave de dedupe (tracker + PPCV4), se hace un
merge por `coalesce`: la primera fuente que trae un valor no vacío gana; no se
pisan datos entre sí.

## Columnas que no encajaban en el esquema común (`quotes.extra`)

Algunas hojas de vendedor traían columnas propias que la maestra `ANTONIA_VENTAS`
no tiene (`COMENTARIO`, `ESTATUS 2`, `LLAMADA AL CLIENTE`, `MONTO`, `RELOJ`,
`Completada`...). En vez de perderlas, se guardan en la columna `quotes.extra`
(`jsonb`), llave = nombre de columna normalizado.

## Limpieza de datos aplicada

- **Fechas basura de Sheets**: cualquier fecha que caiga en 1899/1900 (el
  "cero" típico de una celda con formato fecha pero vacía, ej. `30/12/1899`)
  se convierte a `NULL`.
- **`AVANCE`**: normalizado a escala 0–100. El origen mezcla `"0%"` (texto),
  `100` (ya en porcentaje) y `1` (=100%, fracción). Regla: si el valor está
  entre 0 y 1 se multiplica por 100; si ya es mayor a 1 se deja igual.
- **`DIAS`** (en `quotes`): la celda venía con formato de "duración", que
  Excel/Sheets serializa como una fecha desde el epoch `1899-12-31`. Se
  reconvierte al número de días real.
- **Filas basura de listas de validación**: varias hojas de tracker sin usar
  tenían restos de una lista desplegable (`"Concepto"`, `"Restricciones"`,
  `"Prioridades"`) pegados literalmente en la columna Concepto. Se descartan
  por contenido, no por nombre de hoja, para no perder las hojas que sí tienen
  datos reales mezclados con esa basura (ver `DIMAS RAMOS`, `ROCIO CASTRO`).
- **`INVOLUCRADOS`**: la celda traía varios nombres separados por coma; se
  parte en `task_involucrados` (N:M), no se guarda como texto plano.

## Validado contra el archivo real

`lib.py` se corrió con `--dry-run` contra `TrackerVersion4_7.xlsx` (104 hojas)
antes de escribir `migrate.py`. Resultado de esa corrida: 97 personas, 4,098
tareas, 6,375 relaciones de involucrados, 646 cotizaciones, 14,185 líneas de
bitácora. Corre limpio de punta a punta; falta probar la carga real a Postgres
porque este entorno no tiene credenciales de Supabase.
