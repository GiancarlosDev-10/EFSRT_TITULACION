# Mockups de la vista del estudiante

Estos archivos vienen del prototipo de diseño. **No son código para copiar tal
cual**: son la referencia visual y de comportamiento para construir las pantallas
en Next.js + Tailwind.

## Pantallas y a qué ruta corresponden

| Archivo | Pantalla | Ruta en Next.js |
|---|---|---|
| `Main.dc.html` | Ingreso (celular) | `/login` |
| `PC_Ingreso.dc.html` | Ingreso (PC) | `/login` (misma página, diseño de escritorio) |
| `Inicio.dc.html` | Inicio del estudiante (celular) | `/alumno` |
| `PC_Panel.dc.html` | Panel con mapa del recorrido (PC) | `/alumno` (misma página, diseño de escritorio) |
| `Tracker.dc.html` | Seguimiento por dependencia | `/alumno/seguimiento/[modulo]` (en PC está integrado en el panel) |
| `Observacion.dc.html` | Detalle de una observación | `/alumno/observacion/[expedienteId]` |
| `Requisitos.dc.html` | Cómo iniciar el trámite (informativa) | `/alumno/requisitos` |
| `Constancia.dc.html` | Constancia lista para recoger | `/alumno/constancia/[modulo]` |
| `Correo.dc.html` | Correo de notificación | plantilla en `modules/notificaciones` (no es una ruta) |
| `Oficinas.html` | Bandeja, detalle del expediente y registro de recepción de las cuatro oficinas (celular y PC) | `/mesa-partes`, `/coordinacion`, `/docente`, `/bienestar` y sus subrutas (Fase 8) |

`Oficinas.html` no viene del visor de diseño: es HTML con Tailwind (CDN) y los
mismos tokens de `globals.css`. La barra superior elige la oficina y la vista; la
variante `@5xl:` hace de `lg:`. Se puede abrir en una pantalla concreta con la
dirección, p. ej. `Oficinas.html#oficina=docente&vista=celular&exp=x7`.
Desde la Fase 10 incluye la campana de notificaciones de Coordinación, Docente y
Bienestar (Mesa de Partes no la tiene); `&campana=1` la abre al cargar.

`canvas.json` solo describe cómo estaban ordenadas las pantallas en el lienzo.

## Cómo leer un `.dc.html`

Cada archivo es una pantalla con estilos en línea y una pequeña clase de lógica
al final. Equivalencias para pasarlo a React:

| En el mockup | En Next.js |
|---|---|
| `style="padding: 16px; border-radius: 18px; …"` | clases de Tailwind (`p-4 rounded-[18px] …`) usando los tokens del tema |
| `{{variable}}` | prop o estado del componente |
| `<sc-for list="{{items}}" as="item">` | `items.map(item => …)` |
| `<sc-if value="{{cond}}">` | renderizado condicional `{cond && …}` |
| `onClick="{{fn}}"` | `onClick={fn}` |
| `renderVals()` | lógica del componente / hooks; los objetos `DATA` son datos de prueba → van a `modules/tramitacion/infrastructure/` (repositorio mock) |
| `<a href="Otra.dc.html">` | `<Link href="/ruta">` |
| `<script src="./support.js">`, `<x-dc>`, `<helmet>` | no se usan; son del visor de diseño |

## Componentes que se repiten (crear una sola vez)

- **TarjetaUbicacion**: tarjeta oscura "Tu expediente está en …" con estado y fecha.
- **TrackerDependencias**: lista de las 4 dependencias, desplegable, con el
  historial de eventos (código, título, fecha, nota).
- **SelectorModulo**: desplegable de módulos (PC) / pestañas (celular).
- **MapaRecorrido**: mapa isométrico de PC (5 edificios: Tesorería fuera del
  sistema + 4 oficinas; marcador animado; botón "Ver recorrido"). La geometría
  está calculada en la lógica de `PC_Panel.dc.html` (función `P(x, y, z)`).
- **ChipEstado**, **AvisoObservacion**, **NavegacionInferior** (celular),
  **BarraLateral** (PC).

## Datos de ejemplo usados en los mockups

- Módulo I: recorrido completo, estado 10 (constancia lista).
- Módulo II: estado 08 (supervisión observada), con una observación previa
  subsanada (02).
- Módulo III: sin expediente todavía.
