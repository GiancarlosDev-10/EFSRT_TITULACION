-- Módulo auth: carrera de cada Coordinación y funciones para identificar al
-- personal de la petición (D49, D50).
--
-- - Coordinación de Carrera ve solo los expedientes de su carrera: su fila de
--   `personal` lleva la carrera (mismo identificador que `estudiantes.carrera`).
-- - El Docente Supervisor asignado se guarda como fila de `personal` (no como
--   cuenta): así Coordinación puede asignar a un docente que aún no ingresó.

alter table public.personal
  add column carrera text check (carrera ~ '^[a-z0-9-]{1,60}$');

-- Hoy solo existe Desarrollo de Sistemas de Información.
update public.personal set carrera = 'desarrollo-sistemas' where rol = 'coordinacion';

alter table public.personal
  add constraint personal_coordinacion_con_carrera check (rol <> 'coordinacion' or carrera is not null);

-- Fila de `personal` (activa) de quien llama; `null` si no es personal.
create function privado.mi_personal_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.personal where usuario_id = auth.uid() and activo
$$;

-- Carrera de quien llama si es de Coordinación (activa); `null` en otro caso.
create function privado.mi_carrera()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select carrera from public.personal where usuario_id = auth.uid() and activo and rol = 'coordinacion'
$$;

revoke all on function privado.mi_personal_id() from public;
grant execute on function privado.mi_personal_id() to authenticated, service_role;
revoke all on function privado.mi_carrera() from public;
grant execute on function privado.mi_carrera() to authenticated, service_role;
