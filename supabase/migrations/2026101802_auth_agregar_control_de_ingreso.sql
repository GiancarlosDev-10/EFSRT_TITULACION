-- Módulo auth: quién puede tener cuenta y cómo se enlaza con sus datos (D45).
--
-- 1. Hook "before user created" de Supabase Auth: rechaza crear la cuenta si
--    el correo no está habilitado (personal activo o estudiante registrado por
--    Mesa de Partes). Una cuenta de Google cualquiera ni siquiera se crea.
--    Se activa en el panel: Authentication → Hooks → Before User Created.
-- 2. Trigger en `auth.users`: cuando el correo queda confirmado, crea el perfil
--    y enlaza la cuenta con su fila de `personal` o `estudiantes`.
--
-- Lee `estudiantes` (módulo tramitacion) solo para habilitar y enlazar por
-- correo; es el único punto donde auth toca esa tabla.

-- Correo habilitado: personal activo o estudiante con ese correo.
create function privado.correo_habilitado(p_correo text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.personal where correo = lower(btrim(p_correo)) and activo)
      or exists (
        select 1 from public.estudiantes
        where correo_institucional = lower(btrim(p_correo)) or correo_personal = lower(btrim(p_correo))
      )
$$;

revoke all on function privado.correo_habilitado(text) from public;

create function privado.antes_de_crear_usuario(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if privado.correo_habilitado(event -> 'user' ->> 'email') then
    return '{}'::jsonb;
  end if;
  -- El mensaje no se muestra tal cual: la app enseña su propio aviso.
  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'CUENTA_NO_HABILITADA')
  );
end
$$;

grant usage on schema privado to supabase_auth_admin;
revoke all on function privado.antes_de_crear_usuario(jsonb) from public, anon, authenticated;
grant execute on function privado.antes_de_crear_usuario(jsonb) to supabase_auth_admin;
grant execute on function privado.correo_habilitado(text) to supabase_auth_admin;

-- Enlaza la cuenta solo con el correo CONFIRMADO: así nadie puede crear una
-- cuenta sin confirmar con el correo de otra persona y quedarse con su perfil.
-- Google entrega el correo ya confirmado; el enlace al correo lo confirma al abrirlo.
create function privado.enlazar_cuenta()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correo text := lower(btrim(new.email));
  v_personal record;
  v_estudiante record;
begin
  if v_correo is null or new.email_confirmed_at is null then
    return new;
  end if;

  select id, nombre, rol into v_personal
    from public.personal
    where correo = v_correo and activo and usuario_id is null;
  if found then
    insert into public.perfiles (id, nombre, rol) values (new.id, v_personal.nombre, v_personal.rol)
      on conflict (id) do nothing;
    update public.personal set usuario_id = new.id where id = v_personal.id;
    return new;
  end if;

  -- Si el estudiante ya tiene otra cuenta enlazada, no se toca (una sola cuenta por estudiante).
  select id, nombres, apellidos into v_estudiante
    from public.estudiantes
    where (correo_institucional = v_correo or correo_personal = v_correo) and usuario_id is null
    limit 1;
  if found then
    insert into public.perfiles (id, nombre, rol)
      values (new.id, v_estudiante.nombres || ' ' || v_estudiante.apellidos, 'estudiante')
      on conflict (id) do nothing;
    update public.estudiantes set usuario_id = new.id where id = v_estudiante.id;
  end if;

  return new;
end
$$;

revoke all on function privado.enlazar_cuenta() from public, anon, authenticated;

create trigger enlazar_cuenta_al_crear
  after insert on auth.users
  for each row execute function privado.enlazar_cuenta();

create trigger enlazar_cuenta_al_confirmar
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function privado.enlazar_cuenta();
