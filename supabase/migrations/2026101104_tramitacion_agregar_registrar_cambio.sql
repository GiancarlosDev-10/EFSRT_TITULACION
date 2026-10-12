-- Cambio de estado como función de la API, con los permisos de quien llama
-- (SECURITY INVOKER): aplican igual los permisos por columna, el RLS y el
-- trigger de `historial`. Solo recibe lo que decide la oficina; actor y fecha
-- los pone el trigger desde la sesión.
create function public.registrar_cambio(
  p_expediente_id uuid,
  p_estado_anterior text,
  p_estado_nuevo text,
  p_motivo text default null
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.historial (expediente_id, estado_anterior, estado_nuevo, motivo)
  values (p_expediente_id, p_estado_anterior, p_estado_nuevo, p_motivo)
$$;

revoke all on function public.registrar_cambio(uuid, text, text, text) from public, anon;
grant execute on function public.registrar_cambio(uuid, text, text, text) to authenticated, service_role;
