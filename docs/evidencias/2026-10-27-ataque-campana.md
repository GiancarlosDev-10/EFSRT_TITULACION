# Evidencia: ataque a las Server Actions con la campana (Fase 10.4, D54 y D58)

- **Fecha:** 27 de octubre de 2026, después de la prueba manual de la campana
  (hora de Perú).
- **Entorno:** servidor de desarrollo (`bun run dev`, `http://localhost:3000`) y
  proyecto de Supabase de desarrollo.
- **Cuentas:** solo de prueba (`estudiante@efsrt.test`); expediente atacado: Módulo II
  del "Estudiante De Prueba", en 08 (Supervisión observada).
- **Estado de la base antes del ataque:** un aviso ajeno sin leer (id 319, del
  docente de prueba Mg. D. Castillo, que quedó del cambio de docente de ida y
  vuelta de la prueba manual). Sin un aviso así, los casos 7 y 8 no demostrarían
  nada: no habría nada ajeno que filtrar ni que marcar por error.
- Se omite el comando `curl` que imprime el script: es el mismo de la evidencia del
  25 de octubre (`2026-10-25-ataque-server-actions.md`) y lleva la cookie de sesión.

## Script `bun run seguridad:acciones`

```text
$ bun run seguridad:acciones
$ bun scripts/seguridad/atacar-acciones.ts
Atacando http://localhost:3000 con 10 casos…

┌───┬───────────┬────────────┬─────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┬──────────────────┐
│   │ Resultado │ Quién      │ Intenta                                         │ Respuesta                                                  │ Base sin cambios │
├───┼───────────┼────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼──────────────────┤
│ 0 │ RECHAZADO │ Sin sesión │ Dar por subsanada una observación (08→07)       │ El proxy lo mandó a /login (sin sesión)                    │ sí               │
│ 1 │ RECHAZADO │ Estudiante │ Dar por subsanada su propia observación (08→07) │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 2 │ RECHAZADO │ Estudiante │ Cambiar a su Docente Supervisor                 │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 3 │ RECHAZADO │ Estudiante │ Abrirse un expediente del Módulo III            │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 4 │ RECHAZADO │ Estudiante │ Registrar a un estudiante nuevo                 │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 5 │ RECHAZADO │ Sin sesión │ Leer avisos de la campana                       │ El proxy lo mandó a /login (sin sesión)                    │ sí               │
│ 6 │ RECHAZADO │ Sin sesión │ Marcar avisos como leídos                       │ El proxy lo mandó a /login (sin sesión)                    │ sí               │
│ 7 │ RECHAZADO │ Estudiante │ Leer avisos de oficinas o docentes              │ Solo recibió sus propios avisos                            │ sí               │
│ 8 │ RECHAZADO │ Estudiante │ Marcar como leídos los avisos de todos          │ La acción devolvió true                                    │ sí               │
│ 9 │ RECHAZADO │ Estudiante │ Marcar con un id que no es número               │ La acción devolvió false                                   │ sí               │
└───┴───────────┴────────────┴─────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┴──────────────────┘

Todos los ataques fueron rechazados (10/10).
```

## Lectura

- **Casos 0–4** (Fase 8): se repiten para confirmar que la campana no abrió ningún
  camino nuevo hacia los cambios de estado.
- **Casos 5–6:** sin sesión, el proxy detiene las acciones de la campana antes de
  llegar a ellas.
- **Caso 7:** el estudiante pide la campana y recibe solo sus avisos; el aviso del
  docente no aparece en la respuesta. Lo decide el RLS de `avisos` (capa 3), no la
  acción.
- **Caso 8:** el estudiante pide marcar como leído "hasta el último aviso de la
  base". La acción responde `true` (el dato es válido y los suyos sí se marcan),
  pero el aviso ajeno sigue sin leer: `marcar_avisos_leidos` solo toca los avisos
  de quien llama. "Base sin cambios" cuenta los avisos ajenos leídos antes y
  después.
- **Caso 9:** un id que no es número entero se rechaza en el caso de uso antes de
  llegar a la base.
- Las reglas de quién recibe cada aviso y la prohibición de crear, editar o borrar
  avisos por la API se prueban contra la base en `supabase/pruebas/avisos.test.ts`.
