-- ============================================================================
-- Holtmont Workspace — login real vía Supabase Auth
--
-- Reemplaza el USER_DB hardcodeado en texto plano (CODIGO.js) por cuentas
-- reales en auth.users (contraseñas hasheadas por Supabase) + una tabla
-- `profiles` con los metadatos de rol/depto que ya usaba el sistema viejo.
--
-- Correr esto UNA VEZ en el SQL Editor de Supabase, después de schema.sql.
-- ============================================================================

create table profiles (
    id          uuid primary key references auth.users(id) on delete cascade,
    username    text not null unique,        -- login original, ej. 'JAIME_OLIVO'
    role        text not null,                -- STAFF_USER / ADMIN / ADMIN_CONTROL / PPC_ADMIN / WORKORDER_USER / TONITA
    label       text not null,                -- nombre para mostrar
    dept        text,
    seller      boolean not null default false,
    person_id   uuid references people(id),   -- liga al directorio migrado (por staffName)
    email       text,                          -- correo real si existía en USER_DB (puede ser null)
    created_at  timestamptz not null default now()
);

create index idx_profiles_person on profiles(person_id);

alter table profiles enable row level security;

-- Cada quien puede leer su propio perfil; ajusta/agrega políticas de escritura
-- según el rol cuando conectes el backend real.
create policy "profiles: leer el propio" on profiles
    for select using (auth.uid() = id);
