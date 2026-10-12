-- Módulo tramitacion: catálogo, estudiantes, expedientes e historial.
--
-- Idea central (D40): un cambio de estado es UN SOLO INSERT en `historial`.
-- Un trigger valida la transición, bloquea el expediente, comprueba que nadie
-- lo cambió antes (concurrencia optimista, D15) y actualiza `expedientes.estado`.
-- Ningún usuario puede hacer UPDATE en `expedientes` ni UPDATE/DELETE en
-- `historial`: el estado actual siempre es el último registro del historial.
--
-- Errores de negocio: se lanzan con el mismo código que usa el dominio en
-- TypeScript (p. ej. 'CONFLICTO_DE_ESTADO') como mensaje, para que el adaptador
-- los traduzca sin adivinar.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Catálogo. Las filas NO se escriben aquí: las genera `bun run db:catalogo`
-- a partir de src/modules/tramitacion/domain/catalogo.ts (D41).
-- ---------------------------------------------------------------------------

create table public.dependencias (
  codigo text primary key,
  nombre text not null,
  orden smallint not null unique
);

create table public.estados (
  codigo text primary key check (codigo ~ '^[0-9]{2}$'),
  nombre text not null,
  dependencia text not null references public.dependencias (codigo),
  tipo text not null check (tipo in ('proceso', 'conforme', 'observacion', 'final')),
  es_inicial boolean not null default false
);

-- Solo un estado inicial.
create unique index estados_un_solo_inicial on public.estados (es_inicial) where es_inicial;

create table public.transiciones (
  desde text not null references public.estados (codigo),
  hacia text not null references public.estados (codigo),
  primary key (desde, hacia)
);

create table public.modulos (
  codigo text primary key,
  orden smallint not null unique
);

-- Largo máximo de motivo/nota. La migración del catálogo la reemplaza con el
-- valor de LONGITUD_MAXIMA_MOTIVO.
create function privado.longitud_maxima_motivo()
returns integer
language sql
immutable
set search_path = ''
as $$ select 150 $$;

-- ---------------------------------------------------------------------------
-- Estudiantes (D38): DNI o carné de extranjería; búsqueda por documento o nombre.
-- ---------------------------------------------------------------------------

-- Minúsculas y sin tildes: "Ormeño" y "ormeno" se encuentran igual.
create function privado.normalizar_texto(texto text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, '')))
$$;

create table public.estudiantes (
  id uuid primary key default gen_random_uuid(),
  tipo_documento text not null check (tipo_documento in ('DNI', 'CE')),
  numero_documento text not null,
  nombres text not null check (char_length(nombres) between 1 and 100),
  apellidos text not null check (char_length(apellidos) between 1 and 100),
  -- Identificador de la carrera (los nombres de módulos se buscan con él, D18).
  carrera text not null check (carrera ~ '^[a-z0-9-]{1,60}$'),
  correo_institucional text check (correo_institucional ~ '^[^@\s]+@iestpgildaballivian\.edu\.pe$'),
  -- Registrado por Mesa de Partes para egresados sin cuenta institucional (D36).
  correo_personal text check (correo_personal ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- Cuenta con la que ingresa; se enlaza al iniciar sesión (Fase 7).
  usuario_id uuid unique references auth.users (id) on delete set null,
  nombre_busqueda text generated always as (privado.normalizar_texto(nombres || ' ' || apellidos)) stored,
  creado_en timestamptz not null default now(),
  constraint estudiantes_documento_valido check (
    (tipo_documento = 'DNI' and numero_documento ~ '^[0-9]{8}$')
    or (tipo_documento = 'CE' and numero_documento ~ '^[A-Z0-9]{1,12}$')
  ),
  constraint estudiantes_documento_unico unique (tipo_documento, numero_documento),
  constraint estudiantes_algun_correo check (correo_institucional is not null or correo_personal is not null)
);

create unique index estudiantes_correo_institucional_unico on public.estudiantes (correo_institucional);
create unique index estudiantes_correo_personal_unico on public.estudiantes (correo_personal);
create index estudiantes_nombre_busqueda on public.estudiantes using gin (nombre_busqueda extensions.gin_trgm_ops);

-- Normaliza lo que digita Mesa de Partes antes de validar: espacios sobrantes,
-- guiones en el documento, mayúsculas en el carné, correos en minúsculas.
create function privado.normalizar_estudiante()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.nombres := regexp_replace(btrim(new.nombres), '\s+', ' ', 'g');
  new.apellidos := regexp_replace(btrim(new.apellidos), '\s+', ' ', 'g');
  new.numero_documento := upper(regexp_replace(new.numero_documento, '[\s.-]', '', 'g'));
  new.correo_institucional := nullif(lower(btrim(new.correo_institucional)), '');
  new.correo_personal := nullif(lower(btrim(new.correo_personal)), '');
  return new;
end
$$;

create trigger estudiantes_normalizar
  before insert or update on public.estudiantes
  for each row execute function privado.normalizar_estudiante();

-- Id del estudiante de la petición; `null` si quien consulta no es estudiante.
create function privado.mi_estudiante_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.estudiantes where usuario_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Expedientes: uno por (estudiante, módulo).
-- ---------------------------------------------------------------------------

create table public.expedientes (
  id uuid primary key,
  estudiante_id uuid not null references public.estudiantes (id) on delete restrict,
  modulo text not null references public.modulos (codigo),
  estado text not null references public.estados (codigo),
  -- Docente Supervisor asignado (D19). Solo él ve el expediente entre los docentes.
  docente_id uuid references public.perfiles (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint expedientes_uno_por_modulo unique (estudiante_id, modulo)
);

create index expedientes_docente on public.expedientes (docente_id);

-- El estado solo cambia desde el trigger del historial; id, estudiante y
-- módulo no cambian nunca. Protege incluso de un error del propio servidor.
create function privado.proteger_expediente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id or new.estudiante_id <> old.estudiante_id or new.modulo <> old.modulo then
    raise exception 'EXPEDIENTE_INMUTABLE' using errcode = '42501';
  end if;
  if new.estado is distinct from old.estado
     and current_setting('efsrt.cambio_desde_historial', true) is distinct from 'si' then
    raise exception 'ESTADO_SOLO_DESDE_HISTORIAL' using errcode = '42501';
  end if;
  return new;
end
$$;

create trigger expedientes_proteger
  before update on public.expedientes
  for each row execute function privado.proteger_expediente();

-- ---------------------------------------------------------------------------
-- Historial: de solo añadidura.
-- ---------------------------------------------------------------------------

create table public.historial (
  id bigint generated always as identity primary key,
  expediente_id uuid not null references public.expedientes (id) on delete restrict,
  -- `null` en el registro con el que nace el expediente.
  estado_anterior text references public.estados (codigo),
  estado_nuevo text not null references public.estados (codigo),
  -- Actor, dependencia y fecha los fija el trigger (D10): el cliente no puede enviarlos.
  actor_id uuid not null references public.perfiles (id),
  -- Copia del nombre al momento del cambio: el estudiante lo ve sin poder leer `perfiles`.
  actor_nombre text not null,
  actor_dependencia text not null references public.dependencias (codigo),
  motivo text check (
    motivo is null
    or (motivo = btrim(motivo) and char_length(motivo) between 1 and privado.longitud_maxima_motivo())
  ),
  fecha timestamptz not null default now()
);

create index historial_por_expediente on public.historial (expediente_id, id);

-- Valida y aplica el cambio de estado. Mismas reglas que domain/reglas.ts:
-- la base las repite para que nadie las salte llamando a la API directamente.
create function privado.registrar_en_historial()
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

  if new.estado_anterior is not null then
    perform set_config('efsrt.cambio_desde_historial', 'si', true);
    update public.expedientes
      set estado = new.estado_nuevo, actualizado_en = new.fecha
      where id = new.expediente_id;
    perform set_config('efsrt.cambio_desde_historial', '', true);
  end if;

  return new;
end
$$;

create trigger historial_registrar
  before insert on public.historial
  for each row execute function privado.registrar_en_historial();

-- D11: nadie edita ni borra el historial, ni siquiera con la clave secreta.
create function privado.historial_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'HISTORIAL_INMUTABLE' using errcode = '42501';
end
$$;

create trigger historial_sin_cambios
  before update or delete on public.historial
  for each row execute function privado.historial_inmutable();

create trigger historial_sin_vaciado
  before truncate on public.historial
  for each statement execute function privado.historial_inmutable();

-- ---------------------------------------------------------------------------
-- Apertura del expediente: Mesa de Partes recibe la carpeta física.
-- Inserta expediente y primera fila del historial en una sola transacción.
-- ---------------------------------------------------------------------------

create function public.abrir_expediente(
  p_id uuid,
  p_estudiante_id uuid,
  p_modulo text,
  p_nota text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  inicial text;
begin
  if (select privado.mi_rol()) is distinct from 'mesa-partes' then
    raise exception 'DEPENDENCIA_NO_AUTORIZADA' using errcode = '42501';
  end if;

  select codigo into strict inicial from public.estados where es_inicial;

  insert into public.expedientes (id, estudiante_id, modulo, estado)
    values (p_id, p_estudiante_id, p_modulo, inicial);
  -- El trigger del historial pone actor y fecha desde la sesión.
  insert into public.historial (expediente_id, estado_anterior, estado_nuevo, motivo)
    values (p_id, null, inicial, p_nota);
end
$$;

-- ---------------------------------------------------------------------------
-- Búsqueda de estudiantes (D38): por documento si el texto lleva dígitos;
-- si no, por nombres y apellidos (cada palabra debe aparecer).
-- SECURITY INVOKER: respeta el RLS de `estudiantes`.
-- ---------------------------------------------------------------------------

create function public.buscar_estudiantes(p_consulta text)
returns setof public.estudiantes
language sql
stable
security invoker
set search_path = ''
as $$
  with consulta as (
    select
      upper(regexp_replace(coalesce(p_consulta, ''), '[\s.-]', '', 'g')) as documento,
      regexp_split_to_array(btrim(privado.normalizar_texto(p_consulta)), '\s+') as palabras
  )
  select e.*
  from public.estudiantes e, consulta c
  where char_length(btrim(coalesce(p_consulta, ''))) >= 2
    and case
      when c.documento ~ '[0-9]' then
        e.numero_documento = c.documento
        -- Carnés digitados sin los ceros iniciales.
        or ltrim(e.numero_documento, '0') = ltrim(c.documento, '0')
      else
        not exists (
          select 1 from unnest(c.palabras) as p
          where e.nombre_busqueda not like '%' || p || '%'
        )
    end
  order by e.apellidos, e.nombres
  limit 20
$$;

-- ---------------------------------------------------------------------------
-- Permisos. Las tablas nuevas no se exponen solas a la API: se da lo mínimo.
-- ---------------------------------------------------------------------------

revoke all on table
  public.dependencias, public.estados, public.transiciones, public.modulos,
  public.estudiantes, public.expedientes, public.historial
  from anon, authenticated;

grant all on table
  public.dependencias, public.estados, public.transiciones, public.modulos,
  public.estudiantes, public.expedientes, public.historial
  to service_role;

grant select on table public.dependencias, public.estados, public.transiciones, public.modulos to authenticated;

grant select on table public.estudiantes to authenticated;
-- Columnas que Mesa de Partes puede digitar; `usuario_id` lo enlaza el servidor.
grant insert (tipo_documento, numero_documento, nombres, apellidos, carrera, correo_institucional, correo_personal),
  update (tipo_documento, numero_documento, nombres, apellidos, carrera, correo_institucional, correo_personal)
  on table public.estudiantes to authenticated;

-- Expedientes: solo lectura; se crean con abrir_expediente() y cambian vía historial.
grant select on table public.expedientes to authenticated;

-- Historial: leer e insertar solo estas columnas (actor y fecha los pone el trigger).
grant select on table public.historial to authenticated;
grant insert (expediente_id, estado_anterior, estado_nuevo, motivo) on table public.historial to authenticated;

revoke all on function privado.mi_estudiante_id() from public;
grant execute on function privado.mi_estudiante_id() to authenticated, service_role;
revoke all on function privado.normalizar_texto(text) from public;
grant execute on function privado.normalizar_texto(text) to authenticated, service_role;
revoke all on function privado.longitud_maxima_motivo() from public;
grant execute on function privado.longitud_maxima_motivo() to authenticated, service_role;

revoke all on function public.abrir_expediente(uuid, uuid, text, text) from public, anon;
grant execute on function public.abrir_expediente(uuid, uuid, text, text) to authenticated, service_role;
revoke all on function public.buscar_estudiantes(text) from public, anon;
grant execute on function public.buscar_estudiantes(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS: activado en todas las tablas.
-- ---------------------------------------------------------------------------

alter table public.dependencias enable row level security;
alter table public.estados enable row level security;
alter table public.transiciones enable row level security;
alter table public.modulos enable row level security;
alter table public.estudiantes enable row level security;
alter table public.expedientes enable row level security;
alter table public.historial enable row level security;

-- Catálogo: lectura para cualquier usuario con sesión.
create policy dependencias_leer on public.dependencias for select to authenticated using (true);
create policy estados_leer on public.estados for select to authenticated using (true);
create policy transiciones_leer on public.transiciones for select to authenticated using (true);
create policy modulos_leer on public.modulos for select to authenticated using (true);

-- Expedientes: el estudiante ve los suyos; el docente, los que tiene asignados;
-- Mesa de Partes, Coordinación y Bienestar, todos (necesitan buscarlos).
create policy expedientes_leer on public.expedientes
  for select to authenticated
  using (
    (select privado.mi_rol()) in ('mesa-partes', 'coordinacion', 'bienestar')
    or ((select privado.mi_rol()) = 'docente' and docente_id = (select auth.uid()))
    or estudiante_id = (select privado.mi_estudiante_id())
  );

-- Historial: visible si el expediente es visible (aplica la política de arriba).
create policy historial_leer on public.historial
  for select to authenticated
  using (exists (select 1 from public.expedientes e where e.id = expediente_id));

-- Insertar: el actor es quien llama, su dependencia es la del estado destino y
-- el expediente le es visible (un docente no toca expedientes ajenos).
create policy historial_insertar on public.historial
  for insert to authenticated
  with check (
    actor_id = (select auth.uid())
    and actor_dependencia = (select privado.mi_rol())
    and exists (select 1 from public.estados s where s.codigo = estado_nuevo and s.dependencia = (select privado.mi_rol()))
    and exists (select 1 from public.expedientes e where e.id = expediente_id)
  );

-- Estudiantes: el propio estudiante; el personal de las oficinas; el docente,
-- solo los estudiantes de los expedientes que supervisa.
create policy estudiantes_leer on public.estudiantes
  for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or (select privado.mi_rol()) in ('mesa-partes', 'coordinacion', 'bienestar')
    -- `estudiantes.id` calificado: sin prefijo, `id` se resolvería como `e.id`.
    or exists (
      select 1 from public.expedientes e
      where e.estudiante_id = estudiantes.id and e.docente_id = (select auth.uid())
    )
  );

create policy estudiantes_registrar on public.estudiantes
  for insert to authenticated
  with check ((select privado.mi_rol()) = 'mesa-partes');

create policy estudiantes_corregir on public.estudiantes
  for update to authenticated
  using ((select privado.mi_rol()) = 'mesa-partes')
  with check ((select privado.mi_rol()) = 'mesa-partes');
