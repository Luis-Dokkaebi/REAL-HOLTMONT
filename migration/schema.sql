-- ============================================================================
-- Holtmont Workspace — esquema Supabase/Postgres
-- Migración desde Google Sheets (Apps Script) a base de datos relacional.
--
-- Fuente: TrackerVersion4_7.xlsx (104 hojas). Ver migration/README.md para el
-- mapeo hoja -> tabla y las decisiones de normalización.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Directorio / personas
-- ----------------------------------------------------------------------------
create table people (
    id              uuid primary key default gen_random_uuid(),
    nombre          text not null unique,          -- clave lógica original (DB_DIRECTORY.NOMBRE)
    departamento    text,
    tipo_hoja       text check (tipo_hoja in ('ESTANDAR', 'HIBRIDO', 'VENTAS')),
    created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. Sitios y proyectos
-- ----------------------------------------------------------------------------
create table sites (
    id_sitio        text primary key,               -- 'SITE-<timestamp>' original
    nombre          text not null,
    cliente         text,
    tipo            text,
    estatus         text,
    fecha_creacion  timestamptz,
    creado_por      text,
    created_at      timestamptz not null default now()
);

create table projects (
    id_proyecto         text primary key,
    id_sitio            text references sites(id_sitio) on delete cascade,
    nombre_subproyecto  text not null,
    tipo                text,
    estatus             text,
    fecha_creacion      timestamptz,
    creado_por          text,
    created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. Tareas (unifica: trackers personales por hoja + PPCV4 maestro)
-- ----------------------------------------------------------------------------
create table tasks (
    id                      uuid primary key default gen_random_uuid(),
    folio                   text not null,                 -- Folio/ID original, tal cual (PPC-, AV-, TG-, numérico legacy, o vacío)
    dedupe_key              text not null unique,           -- folio si es global (PPC-/AV-/TG-/timestamp) o "<hoja>::<folio>" si es legacy ambiguo
    folio_sintetico         boolean not null default false, -- true si el folio se generó porque faltaba
    assignee_id             uuid references people(id),
    assignee_raw            text,                          -- nombre tal cual venía en la hoja (fallback si no matchea a people)
    departamento            text,                          -- columna "ALTA" / "Especialidad"
    fecha_alta              date,
    hora_alta               time,
    clasificacion           text,                          -- A / AA / AAA / ...
    concepto                text not null,
    avance                  numeric(5,2) not null default 0, -- 0-100
    fecha_estimada_fin      date,
    hora_estimada_fin       time,
    reloj                   text,                          -- texto libre en origen (a veces horas, a veces fecha basura)
    restricciones           text,
    prioridad               text,
    riesgos                 text,
    fecha_respuesta         date,
    correo                  text,
    carpeta                 text,                          -- URL de Drive
    cumplimiento            text,                          -- SI/NO (PPCV4)
    comentarios             text,                          -- COMENTARIOS (header simple DEFAULT_TRACKER_HEADERS)
    comentarios_semana      text,
    comentarios_semana_previa text,
    status                  text not null default 'PENDIENTE',
    source_sheet            text not null,                 -- hoja de origen, trazabilidad de la migración
    created_at              timestamptz not null default now()
);

create index idx_tasks_folio on tasks(folio);
create index idx_tasks_assignee on tasks(assignee_id);
create index idx_tasks_fecha_alta on tasks(fecha_alta);
create index idx_tasks_status on tasks(status);

-- Involucrados: relación N:M entre tareas y personas (celda original traía varios nombres separados por coma)
create table task_involucrados (
    task_id     uuid not null references tasks(id) on delete cascade,
    person_id   uuid references people(id),
    raw_name    text not null,                              -- nombre tal cual venía, por si no matcheó a people
    primary key (task_id, raw_name)
);

-- ----------------------------------------------------------------------------
-- 4. Borradores PPC (PPC_BORRADOR — antes de asignarse a un tracker)
-- ----------------------------------------------------------------------------
create table ppc_borradores (
    id                  uuid primary key default gen_random_uuid(),
    especialidad        text,
    concepto            text not null,
    responsable_raw     text,
    responsable_id       uuid references people(id),
    horas               numeric,
    cumplimiento        text,
    archivo             text,
    comentarios         text,
    previos             text,
    prioridad           text,
    riesgos             text,
    restricciones       text,
    fecha_respuesta     date,
    clasificacion       text,
    fecha_alta          date,
    ruta_critica        text,
    zona                text,
    contratista         text,
    cuant_requerida     numeric,
    cuant_real          numeric,
    dias_json           jsonb,
    created_at          timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 5. Cotizaciones / ventas (unifica ANTONIA_VENTAS + hojas por vendedor)
-- ----------------------------------------------------------------------------
create table quotes (
    folio           text primary key,
    area            text,
    cliente         text,
    concepto        text,
    clasificacion   text,
    vendedor_id     uuid references people(id),
    vendedor_raw    text,
    f_visita        date,
    f_inicio        date,
    f_entrega       date,
    dias            integer,
    avance          numeric(5,2) default 0,
    estatus         text,
    comentarios     text,
    requisitor      text,
    prioridad_cot   text,
    info_cliente    text,
    f2              text,
    cotizacion      text,
    timeline        text,
    layout          text,
    proceso         text,
    proceso_log     text,
    map_cot         text,
    monto           numeric(14,2),
    source_sheet    text not null,   -- hoja de origen (maestra o específica de vendedor)
    extra           jsonb,           -- columnas que solo existían en alguna hoja de vendedor (ESTATUS 2, COMENTARIO, etc.)
    created_at      timestamptz not null default now()
);

create index idx_quotes_vendedor on quotes(vendedor_id);
create index idx_quotes_estatus on quotes(estatus);

create table banco_datos (
    folio           text primary key,
    cliente         text,
    fecha_inicio    date,
    area            text,
    concepto        text,
    vendedor        text,
    estatus         text,
    cotizacion      text,
    last_update     timestamptz
);

-- ----------------------------------------------------------------------------
-- 6. Work orders (detalle; folio es la referencia natural usada en CODIGO.js)
-- ----------------------------------------------------------------------------
create table work_orders (
    folio       text primary key,
    created_at  timestamptz not null default now()
);

create table wo_materiales (
    id              uuid primary key default gen_random_uuid(),
    folio           text not null references work_orders(folio) on delete cascade,
    cantidad        numeric,
    unidad          text,
    tipo            text,
    descripcion     text,
    costo           numeric(14,2),
    especificacion  text,
    total           numeric(14,2),
    residente       text,
    compras         text,
    controller      text,
    orden_compra    text,
    pagos           text,
    almacen         text,
    logistica       text,
    residente_obra  text
);

create table wo_mano_obra (
    id          uuid primary key default gen_random_uuid(),
    folio       text not null references work_orders(folio) on delete cascade,
    categoria   text,
    salario     numeric(14,2),
    personal    numeric,
    semanas     numeric,
    extras      numeric(14,2),
    nocturno    numeric(14,2),
    fin_semana  numeric(14,2),
    otros       numeric(14,2),
    total       numeric(14,2)
);

create table wo_herramientas (
    id              uuid primary key default gen_random_uuid(),
    folio           text not null references work_orders(folio) on delete cascade,
    cantidad        numeric,
    unidad          text,
    descripcion     text,
    costo           numeric(14,2),
    total           numeric(14,2),
    residente       text,
    controller      text,
    almacen         text,
    logistica       text,
    residente_fin   text
);

create table wo_equipos (
    id              uuid primary key default gen_random_uuid(),
    folio           text not null references work_orders(folio) on delete cascade,
    cantidad        numeric,
    unidad          text,
    tipo            text,
    descripcion     text,
    especificacion  text,
    dias            numeric,
    horas           numeric,
    costo           numeric(14,2),
    total           numeric(14,2)
);

create table wo_programa (
    id                  uuid primary key default gen_random_uuid(),
    folio               text not null references work_orders(folio) on delete cascade,
    descripcion         text,
    fecha               date,
    duracion            numeric,
    unidad_duracion     text,
    unidad              text,
    cantidad            numeric,
    precio              numeric(14,2),
    total               numeric(14,2),
    responsable         text,
    seccion             text,
    estatus             text
);

-- ----------------------------------------------------------------------------
-- 7. Agenda personal y hábitos
-- ----------------------------------------------------------------------------
create table personal_agenda (
    id              text primary key,
    usuario_id      uuid references people(id),
    usuario_raw     text,
    fecha           date,
    tipo            text,
    hora_inicio     time,
    hora_fin        time,
    titulo          text,
    estatus         text,
    detalles        text
);

create table habits_log (
    id                      uuid primary key default gen_random_uuid(),
    usuario_id              uuid references people(id),
    usuario_raw             text,
    habito                  text,
    meta                    text,
    log_json                jsonb,
    fecha_actualizacion     date
);

-- ----------------------------------------------------------------------------
-- 8. KPIs de cotizaciones (snapshot calculado por el agente)
-- ----------------------------------------------------------------------------
create table kpi_cotizaciones (
    id          uuid primary key default gen_random_uuid(),
    departamento text,
    total        integer,
    ganadas      integer,
    perdidas     integer,
    snapshot_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 9. Bitácora de auditoría
-- ----------------------------------------------------------------------------
create table system_log (
    id          bigserial primary key,
    fecha_hora  timestamptz,
    usuario     text,
    accion      text,
    detalles    text
);

create index idx_system_log_fecha on system_log(fecha_hora);
create index idx_system_log_usuario on system_log(usuario);
