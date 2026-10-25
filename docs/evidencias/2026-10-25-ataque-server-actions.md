# Evidencia: ataque a las Server Actions (Fase 8.5, D54)

- **Fecha:** 25 de octubre de 2026, 14:39 (hora de Perú).
- **Entorno:** servidor de desarrollo (`bun run dev`, `http://localhost:3000`) y
  proyecto de Supabase de desarrollo.
- **Cuentas:** solo de prueba (`estudiante@efsrt.test`); expediente atacado: Módulo II
  del "Estudiante De Prueba", en 08 (Supervisión observada).
- La cookie de sesión se reemplazó por `[COOKIE DE SESIÓN OMITIDA]`: era un token de
  la cuenta de prueba que vencía en una hora.

## 1. Script `bun run seguridad:acciones`

```text
$ bun run seguridad:acciones
$ bun scripts/seguridad/atacar-acciones.ts
Atacando http://localhost:3000 con 5 casos…

┌───┬───────────┬────────────┬─────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┬──────────────────┐
│   │ Resultado │ Quién      │ Intenta                                         │ Respuesta                                                  │ Base sin cambios │
├───┼───────────┼────────────┼─────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┼──────────────────┤
│ 0 │ RECHAZADO │ Sin sesión │ Dar por subsanada una observación (08→07)       │ El proxy lo mandó a /login (sin sesión)                    │ sí               │
│ 1 │ RECHAZADO │ Estudiante │ Dar por subsanada su propia observación (08→07) │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 2 │ RECHAZADO │ Estudiante │ Cambiar a su Docente Supervisor                 │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 3 │ RECHAZADO │ Estudiante │ Abrirse un expediente del Módulo III            │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
│ 4 │ RECHAZADO │ Estudiante │ Registrar a un estudiante nuevo                 │ Tu sesión no permite registrar cambios. Vuelve a ingresar. │ sí               │
└───┴───────────┴────────────┴─────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┴──────────────────┘

Todos los ataques fueron rechazados (5/5).
```

## 2. Ataque manual con `curl` (sesión de estudiante)

El estudiante intenta registrar por su cuenta que subsanó su observación (08→07),
algo que solo puede registrar el Docente Supervisor.

```bash
curl -i -X POST 'http://localhost:3000/coordinacion/expediente/5e90d6be-46dd-4169-8a8f-34df56dc3e72' \
  -H 'Next-Action: 60deb89eb8f7000837b489575522b68f59659172ca' \
  -H 'Accept: text/x-component' \
  -H 'Origin: http://localhost:3000' \
  -H 'Cookie: sb-rxmjsjcpuuuiyfodomok-auth-token=[COOKIE DE SESIÓN OMITIDA]' \
  -F '0=[{"error":null,"conflicto":false},"$K1"]' \
  -F '_1_expedienteId=5e90d6be-46dd-4169-8a8f-34df56dc3e72' \
  -F '_1_desde=08' \
  -F '_1_hacia=07'
```

Respuesta del servidor:

```text
HTTP/1.1 200 OK
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
Cache-Control: no-store
Content-Type: text/x-component
Date: Sun, 25 Oct 2026 19:39:16 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

0:{"a":"$@1","q":"","i":true,"b":"development"}
1:D"$2"
1:{"error":"Tu sesión no permite registrar cambios. Vuelve a ingresar.","conflicto":false}
```

## Lectura

- La petición llegó a la Server Action (no la detuvo el proxy: la sesión era válida).
- La acción tomó el rol de la sesión verificada en el servidor (estudiante), no de los
  datos enviados, y la rechazó antes de leer el formulario.
- No hubo redirección de éxito (`x-action-redirect`) y el script confirmó que la base
  no cambió.
- Alcance: esta prueba cubre "sin sesión" y "sesión de estudiante". Las reglas entre
  oficinas (oficina equivocada, otra carrera, datos inválidos) se prueban en los casos
  de uso y en la base (`seguridad.test.ts`).
