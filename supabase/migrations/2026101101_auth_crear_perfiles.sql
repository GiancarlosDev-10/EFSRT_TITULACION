-- Módulo auth: perfil y rol de cada usuario.
--
-- El rol se guarda en esta tabla y NO en `user_metadata` del token: el propio
-- usuario puede modificar su `user_metadata`, pero no esta tabla (D39).
-- Los perfiles los crea el servidor (clave secreta); el cliente solo lee el suyo.

-- Esquema no expuesto por la API: aquí van las funciones auxiliares de las
-- políticas RLS (las SECURITY DEFINER no deben poder llamarse como RPC).
create schema if not exists privado;
revoke all on schema privado from public;
grant usage on schema privado to authenticated, service_role;

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  -- Mismos valores que `Rol` en src/modules/auth/sesion.ts. Salvo "estudiante",
  -- cada rol es el código de una dependencia del catálogo.
  rol text not null check (rol in ('estudiante', 'mesa-partes', 'coordinacion', 'docente', 'bienestar')),
  creado_en timestamptz not null default now()
);

alter table public.perfiles enable row level security;

revoke all on table public.perfiles from anon, authenticated;
grant select on table public.perfiles to authenticated;
grant all on table public.perfiles to service_role;

create policy perfiles_leer_el_propio on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Rol del usuario de la petición; `null` sin sesión o sin perfil.
-- SECURITY DEFINER: lee `perfiles` sin pasar por su RLS (evita recursión en las políticas).
create function privado.mi_rol()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

revoke all on function privado.mi_rol() from public;
grant execute on function privado.mi_rol() to authenticated, service_role;
