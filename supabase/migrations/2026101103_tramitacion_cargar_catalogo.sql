-- GENERADO por scripts/db/generar-catalogo.ts desde domain/catalogo.ts. No editar a mano.

insert into public.dependencias (codigo, nombre, orden) values
  ('mesa-partes', 'Mesa de Partes', 1),
  ('coordinacion', 'Coordinación de Carrera', 2),
  ('docente', 'Docente Supervisor', 3),
  ('bienestar', 'Bienestar y Empleabilidad', 4)
on conflict (codigo) do update set nombre = excluded.nombre, orden = excluded.orden;

insert into public.estados (codigo, nombre, dependencia, tipo, es_inicial) values
  ('01', 'Expediente recibido', 'mesa-partes', 'proceso', true),
  ('02', 'Pago observado', 'mesa-partes', 'observacion', false),
  ('03', 'Pago conforme (derivado a Coordinación)', 'mesa-partes', 'conforme', false),
  ('04', 'Requisitos observados', 'coordinacion', 'observacion', false),
  ('05', 'Requisitos conformes', 'coordinacion', 'conforme', false),
  ('06', 'Docente supervisor asignado', 'coordinacion', 'conforme', false),
  ('07', 'En supervisión', 'docente', 'proceso', false),
  ('08', 'Supervisión observada', 'docente', 'observacion', false),
  ('09', 'Supervisión aprobada', 'docente', 'conforme', false),
  ('10', 'Constancia lista para recoger', 'bienestar', 'final', false)
on conflict (codigo) do update set
  nombre = excluded.nombre, dependencia = excluded.dependencia,
  tipo = excluded.tipo, es_inicial = excluded.es_inicial;

delete from public.transiciones;
insert into public.transiciones (desde, hacia) values
  ('01', '02'),
  ('01', '03'),
  ('02', '03'),
  ('03', '04'),
  ('03', '05'),
  ('04', '05'),
  ('05', '06'),
  ('06', '07'),
  ('07', '08'),
  ('07', '09'),
  ('08', '07'),
  ('09', '10');

insert into public.modulos (codigo, orden) values
  ('I', 1),
  ('II', 2),
  ('III', 3)
on conflict (codigo) do update set orden = excluded.orden;

create or replace function privado.longitud_maxima_motivo()
returns integer
language sql
immutable
set search_path = ''
as $$ select 150 $$;
