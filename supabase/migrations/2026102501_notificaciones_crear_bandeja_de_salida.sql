-- Módulo notificaciones: bandeja de salida de los avisos al estudiante (D20, D55).
--
-- 1. Cada fila nueva del historial crea un aviso pendiente EN LA MISMA
--    OPERACIÓN: si el cambio se guarda, el aviso existe aunque luego falle el
--    correo. El aviso copia los datos del momento (como `actor_nombre` en el
--    historial), así el envío solo lee esta tabla, que es de este módulo.
-- 2. Solo las peticiones de usuarios crean avisos: la siembra y los scripts
--    con la clave secreta no envían correos a cuentas reales.
-- 3. Los correos de dominios reservados para pruebas (.test, example.com…)
--    no se envían: el aviso queda "omitido".
-- 4. El servidor envía con la clave secreta (`reclamar_notificaciones`); el
--    estudiante solo puede leer sus propios avisos y nadie los edita por la API.

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

create table public.notificaciones (
  id bigint generated always as identity primary key,
  historial_id bigint not null unique references public.historial (id) on delete restrict,
  estudiante_id uuid not null references public.estudiantes (id) on delete restrict,
  -- Copia de los datos al momento del cambio.
  destinatarios text[] not null,
  nombres text not null,
  carrera text not null,
  modulo text not null,
  estado_codigo text not null references public.estados (codigo),
  -- El registro con el que nace el expediente (Mesa de Partes recibió la carpeta).
  apertura boolean not null,
  motivo text,
  fecha timestamptz not null,
  -- Envío: pendiente → enviando → enviado | fallido (se reintenta) · omitido (sin correo válido).
  envio text not null default 'pendiente' check (envio in ('pendiente', 'enviando', 'enviado', 'fallido', 'omitido')),
  intentos integer not null default 0 check (intentos >= 0),
  ultimo_error text,
  enviado_en timestamptz,
  actualizado_en timestamptz not null default now()
);

create index notificaciones_por_enviar on public.notificaciones (id) where envio in ('pendiente', 'enviando', 'fallido');
create index notificaciones_por_estudiante on public.notificaciones (estudiante_id, id);

-- ---------------------------------------------------------------------------
-- Creación del aviso con cada cambio de estado
-- ---------------------------------------------------------------------------

-- Dominios reservados para pruebas y documentación (RFC 2606): nunca se envía a ellos.
create function privado.es_correo_de_prueba(p_correo text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_correo ~* '\.(test|example|invalid|localhost)$' or p_correo ~* '@example\.(com|net|org)$'
$$;

create function privado.crear_notificacion()
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
    estado_codigo, apertura, motivo, fecha, envio
  ) values (
    new.id, dato.estudiante_id, validos, dato.nombres, dato.carrera, dato.modulo,
    new.estado_nuevo, new.estado_anterior is null, new.motivo, new.fecha,
    case when cardinality(validos) = 0 then 'omitido' else 'pendiente' end
  );
  return null;
end
$$;

-- AFTER: la fila del historial ya pasó todas las validaciones de su trigger.
create trigger historial_crear_notificacion
  after insert on public.historial
  for each row execute function privado.crear_notificacion();

revoke all on function privado.es_correo_de_prueba(text) from public;
revoke all on function privado.crear_notificacion() from public;

-- ---------------------------------------------------------------------------
-- Envío (solo el servidor, con la clave secreta)
-- ---------------------------------------------------------------------------

-- Aparta hasta `p_limite` avisos por enviar: los pendientes, los fallidos con
-- menos de `p_max_intentos` intentos y los que se quedaron "enviando" (el
-- proceso se cortó). `skip locked`: dos envíos simultáneos no toman el mismo.
create function public.reclamar_notificaciones(p_limite integer default 20, p_max_intentos integer default 5)
returns setof public.notificaciones
language sql
security invoker
set search_path = ''
as $$
  update public.notificaciones n
     set envio = 'enviando', intentos = n.intentos + 1, actualizado_en = now()
   where n.id in (
     select x.id from public.notificaciones x
      where (x.envio in ('pendiente', 'fallido') and x.intentos < p_max_intentos)
         or (x.envio = 'enviando' and x.actualizado_en < now() - interval '10 minutes')
      order by x.id
      limit p_limite
      for update skip locked
   )
  returning n.*
$$;

revoke all on function public.reclamar_notificaciones(integer, integer) from public, anon, authenticated;
grant execute on function public.reclamar_notificaciones(integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------

revoke all on table public.notificaciones from anon, authenticated;
grant select on table public.notificaciones to authenticated;
grant all on table public.notificaciones to service_role;

alter table public.notificaciones enable row level security;

-- El estudiante ve sus avisos (para una futura campana, D24); las oficinas, no.
create policy notificaciones_leer_propias on public.notificaciones
  for select to authenticated
  using (estudiante_id = (select privado.mi_estudiante_id()));
