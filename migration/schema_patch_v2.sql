-- ============================================================================
-- Parche v2 — columnas y tablas que faltaban en la primera migración
--
-- Correr en el SQL Editor de Supabase DESPUÉS de schema.sql.
-- Es idempotente (usa IF NOT EXISTS), se puede correr más de una vez sin daño.
--
-- Qué corrige:
--   1. `quotes` perdía columnas reales de DEFAULT_SALES_HEADERS (ARCHIVO, FECHA,
--      MONTO) y varias columnas propias de hojas de vendedor/departamento, que
--      terminaban enterradas en el jsonb `extra` en vez de ser consultables.
--   2. PPCV3 ("Plan de Trabajo Semanal") se descartó por completo: son 62
--      renglones con ruta crítica, zona, cuantificación, contratista, días de
--      la semana, cumplimiento y nota/CNC que no existían en ninguna tabla.
--   3. La hoja `Datos` (catálogos de listas desplegables: AREA, CLIENTE,
--      VENDEDOR, CLASIFICACION, ESTATUS, ESTATUS COT) no se migró.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Columnas faltantes en `quotes`
-- ----------------------------------------------------------------------------
alter table quotes add column if not exists archivo          text;      -- DEFAULT_SALES_HEADERS
alter table quotes add column if not exists fecha            date;      -- DEFAULT_SALES_HEADERS
alter table quotes add column if not exists comentario       text;      -- hojas de vendedor (singular, distinto de COMENTARIOS)
alter table quotes add column if not exists estatus_2        text;      -- Alfonso Correa / Edgar Lopez
alter table quotes add column if not exists fecha_envio      date;      -- hojas por departamento
alter table quotes add column if not exists dias_2           integer;   -- hojas por departamento
alter table quotes add column if not exists llamada_cliente  text;      -- hojas por departamento
alter table quotes add column if not exists reloj            text;      -- hojas por departamento
alter table quotes add column if not exists completada       boolean;   -- hojas por departamento

-- ----------------------------------------------------------------------------
-- 2. Plan de Trabajo Semanal (hoja PPCV3)
-- ----------------------------------------------------------------------------
create table if not exists plan_semanal (
    id                  uuid primary key default gen_random_uuid(),
    id_origen           text,                       -- ID original (numérico legacy o PPC-xxxx)
    task_folio          text,                       -- si el ID es un folio PPC-, referencia lógica a tasks.folio
    ruta_critica        text,                       -- 'Si' / null
    zona                text,
    especialidad        text,
    descripcion         text,
    cuantificacion_req  text,                       -- viene mezclado: '20 ML', 1.0, 0.9 -> se guarda tal cual
    cuantificacion_real numeric,
    responsable_id      uuid references people(id),
    responsable_raw     text,
    contratista         text,
    dias                jsonb,                      -- días marcados de la semana, ej. ["L","M","X","J","V","S"]
    cumplimiento        text,                       -- 'si' / 'no'
    nota_cnc            text,                       -- Causa de No Cumplimiento
    source_sheet        text not null,
    created_at          timestamptz not null default now()
);

create index if not exists idx_plan_semanal_responsable on plan_semanal(responsable_id);
create index if not exists idx_plan_semanal_folio on plan_semanal(task_folio);

-- ----------------------------------------------------------------------------
-- 3. Catálogos de listas desplegables (hoja Datos)
-- ----------------------------------------------------------------------------
create table if not exists catalogos (
    id      uuid primary key default gen_random_uuid(),
    tipo    text not null,      -- AREA | CLIENTE | VENDEDOR | CLASIFICACION | ESTATUS | ESTATUS_COT
    valor   text not null,
    unique (tipo, valor)
);

create index if not exists idx_catalogos_tipo on catalogos(tipo);
