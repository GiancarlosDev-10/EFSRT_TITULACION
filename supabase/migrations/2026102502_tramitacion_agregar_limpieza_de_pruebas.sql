-- Limpieza de los datos que crean las pruebas automáticas (D57). SOLO PARA EL
-- PROYECTO DE DESARROLLO: si el sistema se implanta, una migración la quita.
--
-- Cada `test:db` registra estudiantes "Prueba Automática…" con sus
-- expedientes; se acumulaban en las bandejas de Mesa de Partes y Bienestar.
-- El historial y los cambios de docente siguen siendo de solo añadidura (D11):
-- la única excepción es esta función, que solo ejecuta el servidor con la
-- clave secreta y solo borra estudiantes que cumplen las tres condiciones de
-- `es_estudiante_de_prueba`. Los datos sembrados (con cuenta) no se tocan.

-- Estudiante creado por una prueba automática: carrera ficticia de pruebas,
-- sin cuenta y con apellido "Automática …".
create function privado.es_estudiante_de_prueba(p_estudiante_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.estudiantes
    where id = p_estudiante_id
      and carrera = 'pruebas-automaticas'
      and usuario_id is null
      and apellidos like 'Automática %'
  )
$$;

create function privado.es_expediente_de_prueba(p_expediente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.expedientes
    where id = p_expediente_id and privado.es_estudiante_de_prueba(estudiante_id)
  )
$$;

revoke all on function privado.es_estudiante_de_prueba(uuid) from public;
revoke all on function privado.es_expediente_de_prueba(uuid) from public;

-- Reemplaza la versión de 2026101102 (D11): sigue rechazando toda edición y
-- todo borrado, salvo el borrado que hace la limpieza sobre filas de prueba.
create or replace function privado.historial_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and current_setting('efsrt.limpiando_pruebas', true) = 'si' then
    if privado.es_expediente_de_prueba(old.expediente_id) then
      return old;
    end if;
  end if;
  raise exception 'HISTORIAL_INMUTABLE' using errcode = '42501';
end
$$;

-- Borra los estudiantes de prueba y todo lo suyo; devuelve cuántos estudiantes borró.
create function public.limpiar_datos_de_prueba()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  ids_estudiantes uuid[] := array(
    select id from public.estudiantes where privado.es_estudiante_de_prueba(id)
  );
  ids_expedientes uuid[] := array(
    select id from public.expedientes where estudiante_id = any(ids_estudiantes)
  );
begin
  -- Solo durante esta transacción: el trigger de solo añadidura deja pasar estos borrados.
  perform set_config('efsrt.limpiando_pruebas', 'si', true);

  delete from public.notificaciones where estudiante_id = any(ids_estudiantes);
  delete from public.cambios_docente where expediente_id = any(ids_expedientes);
  delete from public.historial where expediente_id = any(ids_expedientes);
  delete from public.expedientes where id = any(ids_expedientes);
  delete from public.estudiantes where id = any(ids_estudiantes);

  perform set_config('efsrt.limpiando_pruebas', '', true);
  return cardinality(ids_estudiantes);
end
$$;

revoke all on function public.limpiar_datos_de_prueba() from public, anon, authenticated;
grant execute on function public.limpiar_datos_de_prueba() to service_role;
