-- Módulo tramitacion: Docente Supervisor asignado (D49, resuelve D19) y
-- Coordinación de Carrera limitada a su carrera (D50).
--
-- 1. El docente se elige al registrar el estado de asignación (06): va en
--    `historial.docente_id`. El trigger lo valida (personal activo con rol
--    docente) y lo copia al expediente. Sigue siendo un solo INSERT (D40).
-- 2. `expedientes.docente_id` apunta ahora a `personal` (antes, a `perfiles`):
--    se puede asignar a un docente que todavía no ingresó. Con
--    `docente_nombre`, es el docente VIGENTE; solo lo cambian los triggers.
-- 3. Coordinación cambia al docente (p. ej. renunció) con un INSERT en
--    `cambios_docente`, también de solo añadidura, mientras la supervisión
--    esté en curso (06, 07, 08). El estado no cambia.
-- 4. RLS: Coordinación ve solo su carrera; el docente, lo asignado a su fila
--    de `personal`.

-- ---------------------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------------------

-- Mismo criterio que permiteCambiarDocente() en domain/reglas.ts: estado de
-- asignación, o etapa del docente sin conformidad (en supervisión, observada).
create function privado.supervision_en_curso(p_estado text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_estado = privado.estado_asignacion_docente()
      or exists (
        select 1 from public.estados
        where codigo = p_estado and dependencia = 'docente' and tipo <> 'conforme'
      )
$$;

-- Dependencia que asigna y cambia al docente: la del estado de asignación.
create function privado.dependencia_que_asigna_docente()
returns text
language sql
stable
set search_path = ''
as $$
  select dependencia from public.estados where codigo = privado.estado_asignacion_docente()
$$;

-- Nombre del docente si es personal activo con rol docente; `null` si no.
-- Solo la usan los triggers (SECURITY DEFINER): nadie lee `personal` por la API.
create function privado.nombre_de_docente_activo(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select nombre from public.personal where id = p_id and rol = 'docente' and activo
$$;

-- ¿El estudiante es de la carrera de quien llama (Coordinación)?
-- SECURITY DEFINER: lee `estudiantes` sin pasar por su RLS, que a su vez
-- consulta `expedientes` (evita la recursión entre ambas políticas).
create function privado.es_de_mi_carrera(p_estudiante_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.estudiantes where id = p_estudiante_id and carrera = privado.mi_carrera()
  )
$$;

revoke all on function privado.supervision_en_curso(text) from public;
grant execute on function privado.supervision_en_curso(text) to authenticated, service_role;
revoke all on function privado.dependencia_que_asigna_docente() from public;
grant execute on function privado.dependencia_que_asigna_docente() to authenticated, service_role;
revoke all on function privado.nombre_de_docente_activo(uuid) from public;
revoke all on function privado.es_de_mi_carrera(uuid) from public;
grant execute on function privado.es_de_mi_carrera(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. Expediente: docente vigente, referido a `personal`
-- ---------------------------------------------------------------------------

alter table public.expedientes drop constraint expedientes_docente_id_fkey;

-- Los valores actuales son ids de cuenta (perfiles): se pasan a la fila de
-- `personal` de esa cuenta; si no la tiene, el expediente queda sin docente.
update public.expedientes e
  set docente_id = x.id
  from public.personal x
  where x.usuario_id = e.docente_id;
update public.expedientes e
  set docente_id = null
  where docente_id is not null
    and not exists (select 1 from public.personal x where x.id = e.docente_id);

alter table public.expedientes
  add constraint expedientes_docente_id_fkey foreign key (docente_id) references public.personal (id),
  add column docente_nombre text;

update public.expedientes e set docente_nombre = x.nombre from public.personal x where x.id = e.docente_id;

alter table public.expedientes
  add constraint expedientes_docente_con_nombre check ((docente_id is null) = (docente_nombre is null));

-- El docente, como el estado, solo cambia desde los triggers (historial y
-- cambios de docente). Reemplaza la versión de 2026101102.
create or replace function privado.proteger_expediente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id or new.estudiante_id <> old.estudiante_id or new.modulo <> old.modulo then
    raise exception 'EXPEDIENTE_INMUTABLE' using errcode = '42501';
  end if;
  if current_setting('efsrt.cambio_desde_historial', true) is distinct from 'si' then
    if new.estado is distinct from old.estado then
      raise exception 'ESTADO_SOLO_DESDE_HISTORIAL' using errcode = '42501';
    end if;
    if new.docente_id is distinct from old.docente_id or new.docente_nombre is distinct from old.docente_nombre then
      raise exception 'DOCENTE_SOLO_DESDE_HISTORIAL' using errcode = '42501';
    end if;
  end if;
  return new;
end
$$;

-- Todo expediente nace sin docente: se asigna después, registrando el 06.
create function privado.expediente_nace_sin_docente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.docente_id is not null or new.docente_nombre is not null then
    raise exception 'DOCENTE_SOLO_DESDE_HISTORIAL' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger expedientes_nacer_sin_docente
  before insert on public.expedientes
  for each row execute function privado.expediente_nace_sin_docente();

-- ---------------------------------------------------------------------------
-- 2. Historial: el registro de asignación lleva al docente
-- ---------------------------------------------------------------------------

alter table public.historial
  add column docente_id uuid references public.personal (id),
  -- Copia del nombre al asignar, como `actor_nombre`.
  add column docente_nombre text;

grant insert (docente_id) on table public.historial to authenticated;

-- Reemplaza la versión de 2026101102: agrega la validación del docente (D49)
-- y lo copia al expediente. El resto queda igual.
create or replace function privado.registrar_en_historial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Peticiones de usuarios (anon/authenticated): actor y fecha salen de la sesión.
  -- Clave secreta o conexión directa (siembra de datos): se respetan los enviados.
  peticion_de_usuario boolean := coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role';
  perfil record;
  destino record;
  estado_actual text;
begin
  if peticion_de_usuario then
    new.actor_id := auth.uid();
    new.fecha := now();
  end if;

  select nombre, rol into perfil from public.perfiles where id = new.actor_id;
  if not found or perfil.rol = 'estudiante' then
    raise exception 'DEPENDENCIA_NO_AUTORIZADA' using errcode = '42501';
  end if;
  new.actor_nombre := perfil.nombre;
  new.actor_dependencia := perfil.rol;

  select dependencia, tipo, es_inicial into destino from public.estados where codigo = new.estado_nuevo;
  if not found then
    raise exception 'TRANSICION_NO_PERMITIDA' using errcode = 'P0001';
  end if;

  -- Bloquea el expediente hasta terminar: dos oficinas a la vez no pueden cambiarlo.
  select estado into estado_actual from public.expedientes where id = new.expediente_id for update;
  if not found then
    raise exception 'EXPEDIENTE_NO_ENCONTRADO' using errcode = 'P0001';
  end if;

  if new.estado_anterior is null then
    -- Registro de apertura: solo en el estado inicial y solo como primera fila.
    if not destino.es_inicial
       or estado_actual <> new.estado_nuevo
       or exists (select 1 from public.historial where expediente_id = new.expediente_id) then
      raise exception 'TRANSICION_NO_PERMITIDA' using errcode = 'P0001';
    end if;
  else
    if estado_actual <> new.estado_anterior then
      raise exception 'CONFLICTO_DE_ESTADO' using errcode = 'P0001';
    end if;
    if not exists (
      select 1 from public.transiciones where desde = new.estado_anterior and hacia = new.estado_nuevo
    ) then
      raise exception 'TRANSICION_NO_PERMITIDA' using errcode = 'P0001';
    end if;
  end if;

  -- D07: registra el estado la dependencia responsable del estado destino.
  if destino.dependencia <> perfil.rol then
    raise exception 'DEPENDENCIA_NO_AUTORIZADA' using errcode = '42501';
  end if;

  -- D08: toda observación exige motivo.
  new.motivo := nullif(btrim(new.motivo), '');
  if destino.tipo = 'observacion' and new.motivo is null then
    raise exception 'MOTIVO_REQUERIDO' using errcode = 'P0001';
  end if;

  -- D49: el estado de asignación exige un docente activo; los demás no llevan.
  if new.estado_nuevo = privado.estado_asignacion_docente() then
    if new.docente_id is null then
      raise exception 'DOCENTE_REQUERIDO' using errcode = 'P0001';
    end if;
    new.docente_nombre := privado.nombre_de_docente_activo(new.docente_id);
    if new.docente_nombre is null then
      raise exception 'DOCENTE_NO_VALIDO' using errcode = 'P0001';
    end if;
  else
    new.docente_id := null;
    new.docente_nombre := null;
  end if;

  if new.estado_anterior is not null then
    perform set_config('efsrt.cambio_desde_historial', 'si', true);
    update public.expedientes
      set estado = new.estado_nuevo,
          actualizado_en = new.fecha,
          docente_id = coalesce(new.docente_id, docente_id),
          docente_nombre = coalesce(new.docente_nombre, docente_nombre)
      where id = new.expediente_id;
    perform set_config('efsrt.cambio_desde_historial', '', true);
  end if;

  return new;
end
$$;

-- La función de la API recibe ahora al docente (solo cuenta en el 06).
drop function public.registrar_cambio(uuid, text, text, text);

create function public.registrar_cambio(
  p_expediente_id uuid,
  p_estado_anterior text,
  p_estado_nuevo text,
  p_motivo text default null,
  p_docente_id uuid default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.historial (expediente_id, estado_anterior, estado_nuevo, motivo, docente_id)
  values (p_expediente_id, p_estado_anterior, p_estado_nuevo, p_motivo, p_docente_id)
$$;

revoke all on function public.registrar_cambio(uuid, text, text, text, uuid) from public, anon;
grant execute on function public.registrar_cambio(uuid, text, text, text, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Cambios de docente: de solo añadidura
-- ---------------------------------------------------------------------------

create table public.cambios_docente (
  id bigint generated always as identity primary key,
  expediente_id uuid not null references public.expedientes (id) on delete restrict,
  -- Quien pide el cambio dice a quién reemplaza: si otra persona ya lo cambió,
  -- hay conflicto (D15).
  docente_anterior_id uuid not null references public.personal (id),
  docente_anterior_nombre text not null,
  docente_nuevo_id uuid not null references public.personal (id),
  docente_nuevo_nombre text not null,
  motivo text not null check (
    motivo = btrim(motivo) and char_length(motivo) between 1 and privado.longitud_maxima_motivo()
  ),
  -- Actor y fecha los fija el trigger (D10).
  actor_id uuid not null references public.perfiles (id),
  actor_nombre text not null,
  fecha timestamptz not null default now()
);

create index cambios_docente_por_expediente on public.cambios_docente (expediente_id, id);

create function privado.registrar_cambio_docente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  peticion_de_usuario boolean := coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role';
  perfil record;
  expediente record;
begin
  if peticion_de_usuario then
    new.actor_id := auth.uid();
    new.fecha := now();
  end if;

  -- Lo registra la dependencia que asigna al docente.
  select nombre, rol into perfil from public.perfiles where id = new.actor_id;
  if not found or perfil.rol is distinct from privado.dependencia_que_asigna_docente() then
    raise exception 'DEPENDENCIA_NO_AUTORIZADA' using errcode = '42501';
  end if;
  new.actor_nombre := perfil.nombre;

  new.motivo := nullif(btrim(new.motivo), '');
  if new.motivo is null then
    raise exception 'MOTIVO_REQUERIDO' using errcode = 'P0001';
  end if;

  select estado, docente_id, docente_nombre into expediente
    from public.expedientes where id = new.expediente_id for update;
  if not found then
    raise exception 'EXPEDIENTE_NO_ENCONTRADO' using errcode = 'P0001';
  end if;
  if expediente.docente_id is null or not privado.supervision_en_curso(expediente.estado) then
    raise exception 'CAMBIO_DE_DOCENTE_NO_PERMITIDO' using errcode = 'P0001';
  end if;
  if expediente.docente_id <> new.docente_anterior_id then
    raise exception 'CONFLICTO_DE_ESTADO' using errcode = 'P0001';
  end if;
  if new.docente_nuevo_id = expediente.docente_id then
    raise exception 'MISMO_DOCENTE' using errcode = 'P0001';
  end if;

  new.docente_anterior_nombre := expediente.docente_nombre;
  new.docente_nuevo_nombre := privado.nombre_de_docente_activo(new.docente_nuevo_id);
  if new.docente_nuevo_nombre is null then
    raise exception 'DOCENTE_NO_VALIDO' using errcode = 'P0001';
  end if;

  perform set_config('efsrt.cambio_desde_historial', 'si', true);
  update public.expedientes
    set docente_id = new.docente_nuevo_id, docente_nombre = new.docente_nuevo_nombre, actualizado_en = new.fecha
    where id = new.expediente_id;
  perform set_config('efsrt.cambio_desde_historial', '', true);

  return new;
end
$$;

create trigger cambios_docente_registrar
  before insert on public.cambios_docente
  for each row execute function privado.registrar_cambio_docente();

-- D11: como el historial, nadie lo edita ni lo borra.
create trigger cambios_docente_sin_cambios
  before update or delete on public.cambios_docente
  for each row execute function privado.historial_inmutable();

create trigger cambios_docente_sin_vaciado
  before truncate on public.cambios_docente
  for each statement execute function privado.historial_inmutable();

create function public.cambiar_docente(
  p_expediente_id uuid,
  p_docente_anterior_id uuid,
  p_docente_nuevo_id uuid,
  p_motivo text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.cambios_docente (expediente_id, docente_anterior_id, docente_nuevo_id, motivo)
  values (p_expediente_id, p_docente_anterior_id, p_docente_nuevo_id, p_motivo)
$$;

revoke all on table public.cambios_docente from anon, authenticated;
grant all on table public.cambios_docente to service_role;
grant select on table public.cambios_docente to authenticated;
grant insert (expediente_id, docente_anterior_id, docente_nuevo_id, motivo) on table public.cambios_docente to authenticated;

revoke all on function public.cambiar_docente(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.cambiar_docente(uuid, uuid, uuid, text) to authenticated, service_role;

alter table public.cambios_docente enable row level security;

create policy cambios_docente_leer on public.cambios_docente
  for select to authenticated
  using (exists (select 1 from public.expedientes e where e.id = expediente_id));

create policy cambios_docente_insertar on public.cambios_docente
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and (select privado.mi_rol()) = (select privado.dependencia_que_asigna_docente())
    and exists (select 1 from public.expedientes e where e.id = expediente_id)
  );

-- ---------------------------------------------------------------------------
-- 4. Docentes para elegir (Coordinación)
-- ---------------------------------------------------------------------------

-- Todos los docentes, también los desactivados (sus expedientes hay que
-- reasignarlos), con cuántos expedientes supervisan ahora. Solo para la
-- dependencia que asigna; para los demás, vacío.
create function public.docentes()
returns table (id uuid, nombre text, activo boolean, en_supervision integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    x.id,
    x.nombre,
    x.activo,
    (
      select count(*)::integer from public.expedientes e
      where e.docente_id = x.id and privado.supervision_en_curso(e.estado)
    )
  from public.personal x
  where x.rol = 'docente'
    and (select privado.mi_rol()) = (select privado.dependencia_que_asigna_docente())
  order by x.nombre
$$;

revoke all on function public.docentes() from public, anon;
grant execute on function public.docentes() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. RLS: Coordinación por carrera; docente por su fila de `personal`
-- ---------------------------------------------------------------------------

drop policy expedientes_leer on public.expedientes;
create policy expedientes_leer on public.expedientes
  for select to authenticated
  using (
    (select privado.mi_rol()) in ('mesa-partes', 'bienestar')
    or ((select privado.mi_rol()) = 'coordinacion' and privado.es_de_mi_carrera(estudiante_id))
    or ((select privado.mi_rol()) = 'docente' and docente_id = (select privado.mi_personal_id()))
    or estudiante_id = (select privado.mi_estudiante_id())
  );

drop policy estudiantes_leer on public.estudiantes;
create policy estudiantes_leer on public.estudiantes
  for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or (select privado.mi_rol()) in ('mesa-partes', 'bienestar')
    or ((select privado.mi_rol()) = 'coordinacion' and carrera = (select privado.mi_carrera()))
    -- `estudiantes.id` calificado: sin prefijo, `id` se resolvería como `e.id`.
    or exists (
      select 1 from public.expedientes e
      where e.estudiante_id = estudiantes.id and e.docente_id = (select privado.mi_personal_id())
    )
  );
