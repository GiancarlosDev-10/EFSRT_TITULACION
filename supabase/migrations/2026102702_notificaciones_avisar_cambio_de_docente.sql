-- Módulo notificaciones: correo al estudiante cuando cambia su Docente
-- Supervisor (D58) y nombre del docente en el correo del 06.
--
-- 1. La bandeja de salida (D55) acepta un segundo origen: un cambio de docente.
--    Cada aviso viene de un cambio de estado O de un cambio de docente.
-- 2. El aviso copia el nombre del docente asignado (06) o el del nuevo y el del
--    anterior (cambio), como el resto de los datos del momento.
-- 3. Como en D55, solo las peticiones de usuarios crean avisos.

alter table public.notificaciones
  alter column historial_id drop not null,
  add column cambio_docente_id bigint unique references public.cambios_docente (id) on delete restrict,
  add column docente_nombre text,
  add column docente_anterior_nombre text,
  add constraint notificaciones_un_origen check (num_nonnulls(historial_id, cambio_docente_id) = 1);

-- Reemplaza la versión de 2026102501: copia también el docente asignado (06).
create or replace function privado.crear_notificacion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  peticion_de_usuario boolean := coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role';
  dato record;
  validos text[];
begin
  if not peticion_de_usuario then
    return null;
  end if;

  select e.modulo, s.id as estudiante_id, s.nombres, s.carrera, s.correo_institucional, s.correo_personal
    into dato
    from public.expedientes e
    join public.estudiantes s on s.id = e.estudiante_id
    where e.id = new.expediente_id;

  validos := array(
    select c from unnest(array[dato.correo_institucional, dato.correo_personal]) as c
    where c is not null and not privado.es_correo_de_prueba(c)
  );

  insert into public.notificaciones (
    historial_id, estudiante_id, destinatarios, nombres, carrera, modulo,
    estado_codigo, apertura, motivo, docente_nombre, fecha, envio
  ) values (
    new.id, dato.estudiante_id, validos, dato.nombres, dato.carrera, dato.modulo,
    new.estado_nuevo, new.estado_anterior is null, new.motivo, new.docente_nombre, new.fecha,
    case when cardinality(validos) = 0 then 'omitido' else 'pendiente' end
  );
  return null;
end
$$;

-- Cambio de docente: el estado no cambia; el motivo es interno de Coordinación
-- y no va en el correo.
create function privado.crear_notificacion_de_cambio_docente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  peticion_de_usuario boolean := coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role';
  dato record;
  validos text[];
begin
  if not peticion_de_usuario then
    return null;
  end if;

  select e.modulo, e.estado, s.id as estudiante_id, s.nombres, s.carrera, s.correo_institucional, s.correo_personal
    into dato
    from public.expedientes e
    join public.estudiantes s on s.id = e.estudiante_id
    where e.id = new.expediente_id;

  validos := array(
    select c from unnest(array[dato.correo_institucional, dato.correo_personal]) as c
    where c is not null and not privado.es_correo_de_prueba(c)
  );

  insert into public.notificaciones (
    cambio_docente_id, estudiante_id, destinatarios, nombres, carrera, modulo,
    estado_codigo, apertura, docente_nombre, docente_anterior_nombre, fecha, envio
  ) values (
    new.id, dato.estudiante_id, validos, dato.nombres, dato.carrera, dato.modulo,
    dato.estado, false, new.docente_nuevo_nombre, new.docente_anterior_nombre, new.fecha,
    case when cardinality(validos) = 0 then 'omitido' else 'pendiente' end
  );
  return null;
end
$$;

create trigger cambios_docente_crear_notificacion
  after insert on public.cambios_docente
  for each row execute function privado.crear_notificacion_de_cambio_docente();

revoke all on function privado.crear_notificacion_de_cambio_docente() from public;
