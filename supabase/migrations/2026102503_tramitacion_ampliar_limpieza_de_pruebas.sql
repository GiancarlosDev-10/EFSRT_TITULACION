-- Limpieza de los datos de prueba (D57), regla más simple: en la carrera
-- ficticia de pruebas, todo estudiante SIN CUENTA lo creó una prueba
-- automática (el único sembrado ahí, la estudiante ajena, tiene cuenta). La
-- versión de 2026102502 exigía además el apellido "Automática …" y dejaba
-- fuera a los "Prueba Directorio …" del contrato del directorio.

create or replace function privado.es_estudiante_de_prueba(p_estudiante_id uuid)
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
  )
$$;
