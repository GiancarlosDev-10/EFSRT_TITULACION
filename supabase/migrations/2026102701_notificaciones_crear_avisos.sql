-- Módulo notificaciones: avisos de la campana (D58). Es la bandeja de ENTRADA
-- de cada perfil; la de SALIDA (correo, D55) sigue en `notificaciones`.
--
-- 1. Quién recibe qué (D58):
--    - El estudiante: cada cambio de estado y cada cambio de docente.
--    - La oficina a la que "pasa" el expediente (D56): Coordinación de la
--      carrera del estudiante con el 03, Bienestar con el 09. Se lee como
--      oficina: una fila por oficina, leída por quien la abra primero.
--    - El Docente Supervisor: al asignarlo (06) o al reasignarle un expediente.
--      Se lee como persona. Al docente anterior no se le avisa.
--    Mesa de Partes nunca recibe: ninguna oficina le deriva nada.
-- 2. Los crean triggers en la misma operación que el cambio y copian los datos
--    del momento, como el correo. Solo las peticiones de usuarios crean avisos
--    (la siembra con la clave secreta, no).
-- 3. Cada uno lee solo los suyos; nadie los crea, edita ni borra por la API.
--    Marcar como leído es una función que solo llena `leido_en`.

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

create table public.avisos (
  id bigint generated always as identity primary key,
  expediente_id uuid not null references public.expedientes (id) on delete restrict,
  -- Qué lo generó: un cambio de estado o un cambio de docente.
  historial_id bigint references public.historial (id) on delete restrict,
  cambio_docente_id bigint references public.cambios_docente (id) on delete restrict,
  -- Para quién: un estudiante, una oficina (Coordinación con su carrera) o un docente.
  estudiante_id uuid references public.estudiantes (id) on delete restrict,
  oficina text references public.dependencias (codigo),
  carrera text,
  docente_id uuid references public.personal (id),
  -- Copia de los datos al momento del cambio.
  estudiante_nombre text not null,
  modulo text not null,
  estado_codigo text not null references public.estados (codigo),
  motivo text,
  docente_nombre text,
  docente_anterior_nombre text,
  fecha timestamptz not null,
  leido_en timestamptz,
  constraint avisos_un_origen check (num_nonnulls(historial_id, cambio_docente_id) = 1),
  constraint avisos_un_destinatario check (num_nonnulls(estudiante_id, oficina, docente_id) = 1),
  -- Coordinación lee por carrera (D50); las demás oficinas, todas las carreras.
  constraint avisos_carrera_de_coordinacion check (
    (oficina = 'coordinacion' and carrera is not null) or (oficina is distinct from 'coordinacion' and carrera is null)
  )
);

create index avisos_por_estudiante on public.avisos (estudiante_id, id) where estudiante_id is not null;
create index avisos_por_oficina on public.avisos (oficina, carrera, id) where oficina is not null;
create index avisos_por_docente on public.avisos (docente_id, id) where docente_id is not null;
create index avisos_por_expediente on public.avisos (expediente_id);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------------------

-- Mismo criterio que pasaA() en domain/reglas.ts (D56): si todas las salidas
-- del estado las registra una misma oficina distinta de la suya, esa oficina;
-- si no, `null`. Se calcula del catálogo, que se genera desde catalogo.ts (D41).
create function privado.pasa_a(p_estado text)
returns text
language sql
stable
set search_path = ''
as $$
  select min(d.dependencia)
    from public.transiciones t
    join public.estados d on d.codigo = t.hacia
   where t.desde = p_estado
  having count(distinct d.dependencia) = 1
     and min(d.dependencia) <> (select dependencia from public.estados where codigo = p_estado)
$$;

-- ¿El aviso es para quien llama? Lo usan la política de lectura y la función
-- que marca como leído, para que ambas digan lo mismo.
create function privado.es_aviso_mio(p_estudiante_id uuid, p_oficina text, p_carrera text, p_docente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_estudiante_id = privado.mi_estudiante_id()
    or p_docente_id = privado.mi_personal_id()
    or (p_oficina = privado.mi_rol() and (p_oficina <> 'coordinacion' or p_carrera = privado.mi_carrera())),
    false
  )
$$;

revoke all on function privado.pasa_a(text) from public;
revoke all on function privado.es_aviso_mio(uuid, text, text, uuid) from public;
grant execute on function privado.es_aviso_mio(uuid, text, text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Creación de los avisos
-- ---------------------------------------------------------------------------

-- Cambio de estado: al estudiante; a la oficina a la que pasa; al docente asignado.
create function privado.crear_avisos_de_historial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  peticion_de_usuario boolean := coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role';
  dato record;
  destino text := privado.pasa_a(new.estado_nuevo);
begin
  if not peticion_de_usuario then
    return null;
  end if;

  select e.modulo, s.id as estudiante_id, s.nombres || ' ' || s.apellidos as nombre, s.carrera
    into dato
    from public.expedientes e
    join public.estudiantes s on s.id = e.estudiante_id
   where e.id = new.expediente_id;

  insert into public.avisos (expediente_id, historial_id, estudiante_id, estudiante_nombre, modulo, estado_codigo, motivo, docente_nombre, fecha)
  values (new.expediente_id, new.id, dato.estudiante_id, dato.nombre, dato.modulo, new.estado_nuevo, new.motivo, new.docente_nombre, new.fecha);

  -- Al docente se le avisa en persona (abajo), no como oficina.
  if destino is not null and destino <> 'docente' then
    insert into public.avisos (expediente_id, historial_id, oficina, carrera, estudiante_nombre, modulo, estado_codigo, fecha)
    values (
      new.expediente_id, new.id, destino, case when destino = 'coordinacion' then dato.carrera end,
      dato.nombre, dato.modulo, new.estado_nuevo, new.fecha
    );
  end if;

  if new.docente_id is not null then
    insert into public.avisos (expediente_id, historial_id, docente_id, estudiante_nombre, modulo, estado_codigo, docente_nombre, fecha)
    values (new.expediente_id, new.id, new.docente_id, dato.nombre, dato.modulo, new.estado_nuevo, new.docente_nombre, new.fecha);
  end if;

  return null;
end
$$;

-- Cambio de docente: al estudiante y al docente nuevo.
create function privado.crear_avisos_de_cambio_docente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  peticion_de_usuario boolean := coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role';
  dato record;
begin
  if not peticion_de_usuario then
    return null;
  end if;

  select e.modulo, e.estado, s.id as estudiante_id, s.nombres || ' ' || s.apellidos as nombre
    into dato
    from public.expedientes e
    join public.estudiantes s on s.id = e.estudiante_id
   where e.id = new.expediente_id;

  insert into public.avisos (
    expediente_id, cambio_docente_id, estudiante_id, estudiante_nombre, modulo, estado_codigo,
    docente_nombre, docente_anterior_nombre, fecha
  ) values (
    new.expediente_id, new.id, dato.estudiante_id, dato.nombre, dato.modulo, dato.estado,
    new.docente_nuevo_nombre, new.docente_anterior_nombre, new.fecha
  );

  insert into public.avisos (
    expediente_id, cambio_docente_id, docente_id, estudiante_nombre, modulo, estado_codigo,
    docente_nombre, docente_anterior_nombre, fecha
  ) values (
    new.expediente_id, new.id, new.docente_nuevo_id, dato.nombre, dato.modulo, dato.estado,
    new.docente_nuevo_nombre, new.docente_anterior_nombre, new.fecha
  );

  return null;
end
$$;

-- AFTER: la fila ya pasó todas las validaciones de su trigger.
create trigger historial_crear_avisos
  after insert on public.historial
  for each row execute function privado.crear_avisos_de_historial();

create trigger cambios_docente_crear_avisos
  after insert on public.cambios_docente
  for each row execute function privado.crear_avisos_de_cambio_docente();

revoke all on function privado.crear_avisos_de_historial() from public;
revoke all on function privado.crear_avisos_de_cambio_docente() from public;

-- ---------------------------------------------------------------------------
-- Marcar como leído (al abrir la campana)
-- ---------------------------------------------------------------------------

-- Marca los avisos de quien llama hasta `p_hasta_id` (el más reciente que vio
-- en pantalla): uno que llegue mientras tanto sigue sin leer. Solo toca
-- `leido_en`. Devuelve cuántos marcó.
create function public.marcar_avisos_leidos(p_hasta_id bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  marcados integer;
begin
  update public.avisos
     set leido_en = now()
   where leido_en is null
     and id <= p_hasta_id
     and privado.es_aviso_mio(estudiante_id, oficina, carrera, docente_id);
  get diagnostics marcados = row_count;
  return marcados;
end
$$;

revoke all on function public.marcar_avisos_leidos(bigint) from public, anon;
grant execute on function public.marcar_avisos_leidos(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------

revoke all on table public.avisos from anon, authenticated;
grant select on table public.avisos to authenticated;
grant all on table public.avisos to service_role;

alter table public.avisos enable row level security;

create policy avisos_leer_propios on public.avisos
  for select to authenticated
  using ((select privado.es_aviso_mio(estudiante_id, oficina, carrera, docente_id)));

-- ---------------------------------------------------------------------------
-- Limpieza de los datos de prueba (D57): borra también sus avisos
-- ---------------------------------------------------------------------------

-- Reemplaza la versión de 2026102502: agrega los avisos, que apuntan al
-- historial y a los cambios de docente (se borran antes que ellos).
create or replace function public.limpiar_datos_de_prueba()
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

  delete from public.avisos where expediente_id = any(ids_expedientes);
  delete from public.notificaciones where estudiante_id = any(ids_estudiantes);
  delete from public.cambios_docente where expediente_id = any(ids_expedientes);
  delete from public.historial where expediente_id = any(ids_expedientes);
  delete from public.expedientes where id = any(ids_expedientes);
  delete from public.estudiantes where id = any(ids_estudiantes);

  perform set_config('efsrt.limpiando_pruebas', '', true);
  return cardinality(ids_estudiantes);
end
$$;
