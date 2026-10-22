-- Módulo auth: lista del personal habilitado de las oficinas (D45).
--
-- Cada fila habilita un correo (institucional o personal) para un rol de
-- oficina. La cuenta se enlaza (`usuario_id`) cuando la persona ingresa por
-- primera vez. Desactivar a alguien (`activo = false`) le quita el rol al
-- instante: `privado.mi_rol()` deja de devolverlo y el RLS lo trata como a
-- un usuario sin permisos.
-- Solo el servidor (clave secreta) escribe aquí; nadie la lee por la API.

create table public.personal (
  id uuid primary key default gen_random_uuid(),
  correo text not null unique check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and correo = lower(btrim(correo))),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  -- Roles de oficina: el estudiante se habilita por la tabla `estudiantes`.
  rol text not null check (rol in ('mesa-partes', 'coordinacion', 'docente', 'bienestar')),
  activo boolean not null default true,
  usuario_id uuid unique references auth.users (id) on delete set null,
  creado_en timestamptz not null default now()
);

alter table public.personal enable row level security;

revoke all on table public.personal from anon, authenticated;
grant all on table public.personal to service_role;

-- Rol del usuario de la petición: el de su perfil, salvo que sea personal
-- desactivado. Reemplaza la versión de 2026101101 (mismas políticas la usan).
create or replace function privado.mi_rol()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.rol
  from public.perfiles p
  where p.id = auth.uid()
    and (
      p.rol = 'estudiante'
      or exists (select 1 from public.personal x where x.usuario_id = p.id and x.activo)
    )
$$;

-- Perfil vigente de quien llama (capa 2: la aplicación lo consulta en cada
-- petición). Sin filas si no tiene perfil o está desactivado.
create function public.mi_perfil()
returns table (nombre text, rol text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.nombre, p.rol
  from public.perfiles p
  where p.id = auth.uid() and p.rol = (select privado.mi_rol())
$$;

revoke all on function public.mi_perfil() from public, anon;
grant execute on function public.mi_perfil() to authenticated, service_role;
