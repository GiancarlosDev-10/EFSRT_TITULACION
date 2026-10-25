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

### Fase 8 por partes

| Parte | Qué se hizo |
|---|---|
| 8.1 | Dominio y base: docente vigente en el expediente, `cambiarDocente`, Coordinación por carrera |
| 8.2 | Bandeja y detalle comunes a las cuatro oficinas, registrar cambios de estado |
| 8.3 | Recepción de la carpeta: buscar o registrar al estudiante y elegir el módulo |
| 8.4 | Cambiar al Docente Supervisor desde la ficha (diálogo), aviso de docente desactivado |
| 8.5 | Ataque a las Server Actions con sesión de estudiante (`bun run seguridad:acciones`) |

## Pendientes

| Fase | Qué falta |
|---|---|
| 9. Notificaciones | Correo al estudiante en cada cambio de estado (proveedor por decidir; hoy el adaptador solo imprime en consola) |
| Entrevistas | Validar con los actores los nombres de estados y transiciones, la regla del estado destino, el límite de 150 caracteres, si los docentes pertenecen a una carrera y si el estudiante debe enterarse del cambio de docente |
| Reportes | Módulo `reportes` (más adelante) |
| Video de demostración | Entrar con cada perfil usando las cuentas reales (D48) |

## Cómo verificar cada fase

- `bunx tsc --noEmit`, `bun run lint`, `bun test`.
- `bun run test:db`: pruebas contra el proyecto de Supabase de desarrollo.
- `bun run seguridad:acciones` (con `bun run dev` encendido): ataque a las Server Actions.
- `bun run build`, solo con el servidor de desarrollo detenido.
