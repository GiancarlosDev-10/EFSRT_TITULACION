# Fases del proyecto

Avance del sistema EFSRT Seguimiento. El detalle de cada decisión está en la
bitácora (`docs/decisiones.md`, D01…).

## Hechas

| Fase | Qué se hizo | Decisiones |
|---|---|---|
| 0. Planteamiento | Alcance: capa digital de seguimiento sobre un trámite físico | D01 |
| 1. Esqueleto | Next.js, Tailwind, monolito modular, paleta y tipografías | D02–D05 |
| 2. Dominio | Estados 01–10, transiciones, regla "registra la oficina del estado destino", historial de solo añadidura | D06–D13 |
| 3. Casos de uso y datos de prueba | `obtenerSeguimiento`, `registrarCambioEstado`, repositorio en memoria, eventos de dominio | D14–D20 |
| 4. Pantallas del estudiante | Tracker, mapa del recorrido, ubicación, historial | D21–D30 |
| 5. Resto de pantallas del estudiante | Observaciones, requisitos, constancia lista para recoger | D31–D36 |
| 6. Persistencia en Supabase | Tablas, RLS, triggers, migraciones, siembra de datos | D37–D44 |
| 7. Ingreso | Google y enlace al correo, tabla `personal`, `exigirRol` | D45–D48 |
| 8. Vistas de las oficinas | Bandeja y detalle comunes, recepción en Mesa de Partes, asignación y cambio de Docente Supervisor, prueba de ataque a las Server Actions | D49–D54 |
| 9. Notificaciones por correo | Aviso al estudiante en cada cambio de estado (Gmail), bandeja de salida con reintento, "pasó a…" en 03/06/09, limpieza de los datos de prueba | D55–D57 |

### Fase 8 por partes

| Parte | Qué se hizo |
|---|---|
| 8.1 | Dominio y base: docente vigente en el expediente, `cambiarDocente`, Coordinación por carrera |
| 8.2 | Bandeja y detalle comunes a las cuatro oficinas, registrar cambios de estado |
| 8.3 | Recepción de la carpeta: buscar o registrar al estudiante y elegir el módulo |
| 8.4 | Cambiar al Docente Supervisor desde la ficha (diálogo), aviso de docente desactivado |
| 8.5 | Ataque a las Server Actions con sesión de estudiante (`bun run seguridad:acciones`) |

### Fase 9 por partes

| Parte | Qué se hizo |
|---|---|
| 9.1 | Plantillas del correo (normal, observación, apertura, constancia lista) y caso de uso de envío |
| 9.2 | Bandeja de salida `notificaciones`: la base crea el aviso junto con el cambio de estado |
| 9.3 | Envío por Gmail después de responder a la oficina; `bun run notificaciones:reintentar` |
| 9.4 | Prueba manual con el Módulo II de Valeria, incluida una falla de Gmail y su reintento |
| 9.5 | "Pasó a…" y ubicación que se muestra en 03, 06 y 09 (D56); limpieza de los datos de prueba (D57) |

## Pendientes

| Fase | Qué falta |
|---|---|
| 10. Reportes (opcional) | Módulo `reportes`: tiempos por oficina, expedientes detenidos (según el alcance de la tesis) |
| Entrevistas | Validar con los actores los nombres de estados y transiciones, la regla del estado destino, qué estados "pasan" a la oficina siguiente (D56), el límite de 150 caracteres, si los docentes pertenecen a una carrera y si el estudiante debe enterarse del cambio de docente |
| Proveedor de correo | Definitivo si el sistema se implanta (hoy Gmail, D48 y D55) |
| Video de demostración | Entrar con cada perfil usando las cuentas reales (D48) |

## Cómo verificar cada fase

- `bunx tsc --noEmit`, `bun run lint`, `bun test`.
- `bun run test:db`: pruebas contra el proyecto de Supabase de desarrollo (al terminar, borra los datos que crearon).
- `bun run notificaciones:reintentar`: reenvía los avisos pendientes o fallidos.
- `bun run seguridad:acciones` (con `bun run dev` encendido): ataque a las Server Actions.
- `bun run build`, solo con el servidor de desarrollo detenido.
