// Geometría del mapa isométrico del recorrido (de docs/diseno/prototipo/PC_Panel.dc.html).
// Funciones puras: el componente MapaRecorrido solo pinta lo que calcula este archivo.
import type { SituacionEtapa } from "../application";

export const ANCHO = 620;
export const ALTO = 500;

const UNIDAD = 24;
const ORIGEN_X = 310;
const ORIGEN_Y = 118;

type Punto3D = [x: number, y: number, z: number];

/** Proyección isométrica de una coordenada de la cuadrícula a píxeles del lienzo. */
export function proyectar([x, y, z]: Punto3D): [number, number] {
  return [ORIGEN_X + (x - y) * UNIDAD * 0.866, ORIGEN_Y + (x + y) * UNIDAD * 0.5 - z * UNIDAD];
}

function puntos(lista: Punto3D[]): string {
  return lista.map((p) => proyectar(p).map((n) => n.toFixed(1)).join(",")).join(" ");
}

/** Posición en porcentaje del lienzo, para elementos HTML superpuestos (escala con el ancho). */
export function enPorcentaje([x, y]: [number, number]): { left: string; top: string } {
  return { left: `${((x / ANCHO) * 100).toFixed(2)}%`, top: `${((y / ALTO) * 100).toFixed(2)}%` };
}

// ---- Colores: derivados de los tokens del tema, sin hex (D25) --------------

const mezcla = (token: string, porcentaje: number, base = "white") =>
  `color-mix(in oklab, var(--color-${token}) ${porcentaje}%, ${base})`;

export type EstadoEdificio = "pendiente" | "actual" | "conforme" | "observado" | "listo" | "externo";

type Colores = { techo: string; izquierda: string; derecha: string; ventana: string; puerta: string };

export const COLORES_EDIFICIO: Record<EstadoEdificio, Colores> = {
  pendiente: {
    techo: mezcla("pending", 15),
    izquierda: mezcla("pending", 60),
    derecha: mezcla("pending", 100),
    ventana: mezcla("navy", 22),
    puerta: mezcla("navy", 38),
  },
  actual: {
    techo: mezcla("navy", 10),
    izquierda: mezcla("navy", 25),
    derecha: mezcla("navy", 40),
    ventana: "white",
    puerta: mezcla("navy", 100),
  },
  conforme: {
    techo: mezcla("ok", 10),
    izquierda: mezcla("ok", 24),
    derecha: mezcla("ok", 42),
    ventana: "white",
    puerta: mezcla("ok", 70),
  },
  observado: {
    techo: mezcla("warn", 26),
    izquierda: mezcla("warn", 46),
    derecha: mezcla("warn", 66),
    ventana: mezcla("warn", 8),
    puerta: mezcla("warn", 85, "black"),
  },
  listo: {
    techo: mezcla("ok", 22),
    izquierda: mezcla("ok", 42),
    derecha: mezcla("ok", 62),
    ventana: "white",
    puerta: mezcla("ok", 100),
  },
  externo: {
    techo: mezcla("neutral-bg", 70),
    izquierda: mezcla("pending", 55),
    derecha: mezcla("pending", 80),
    ventana: mezcla("neutral-bg", 100),
    puerta: mezcla("muted", 55),
  },
};

export const COLORES_ESCENA = {
  sueloTecho: mezcla("bg", 60),
  sueloBorde: mezcla("pending", 55),
  sueloFrente: mezcla("pending", 75),
  sueloDerecha: mezcla("pending", 100),
  plaza: mezcla("bg", 100),
  caminoCompletado: mezcla("ok", 100),
  caminoPendiente: mezcla("pending", 100),
  tronco: mezcla("warn-text", 60),
  copa: mezcla("ok", 50),
};

// ---- Escena ----------------------------------------------------------------

export const SUELO = {
  techo: puntos([[0, 0, 0], [14, 0, 0], [14, 14, 0], [0, 14, 0]]),
  derecha: puntos([[14, 0, 0], [14, 14, 0], [14, 14, -0.5], [14, 0, -0.5]]),
  frente: puntos([[0, 14, 0], [14, 14, 0], [14, 14, -0.5], [0, 14, -0.5]]),
  plaza: puntos([[5.6, 5.6, 0], [9.6, 5.6, 0], [9.6, 6.4, 0], [5.6, 6.4, 0]]),
};

export const ARBOLES = (
  [[12.6, 12.4], [13.1, 1.6], [0.6, 1.0], [5.6, 13.2], [0.5, 8.4], [12.8, 9.6]] as const
).map(([x, y]) => proyectar([x, y, 0]));

/** "tesoreria" es el paso previo fuera del sistema; 0–3 son las etapas (dependencias en orden). */
export type IdEdificio = "tesoreria" | number;

type Edificio = { id: IdEdificio; x0: number; y0: number; ancho: number; fondo: number; alto: number };

// Recorrido en sentido horario: Tesorería → Mesa de Partes → Coordinación → Docente → Bienestar.
const EDIFICIOS: Edificio[] = [
  { id: "tesoreria", x0: 1.2, y0: 4.2, ancho: 3, fondo: 3, alto: 2.0 },
  { id: 0, x0: 6.2, y0: 1.2, ancho: 3, fondo: 3, alto: 2.4 },
  { id: 1, x0: 10.0, y0: 5.0, ancho: 3, fondo: 3, alto: 2.4 },
  { id: 2, x0: 6.4, y0: 7.2, ancho: 2.6, fondo: 4.0, alto: 3.6 },
  { id: 3, x0: 1.2, y0: 9.4, ancho: 3, fondo: 3, alto: 2.0 },
];

export const IDS_EDIFICIOS = EDIFICIOS.map((e) => e.id);

function edificio(id: IdEdificio): Edificio {
  const encontrado = EDIFICIOS.find((e) => e.id === id);
  if (!encontrado) throw new Error(`Edificio inexistente: ${id}`);
  return encontrado;
}

export type CarasEdificio = {
  id: IdEdificio;
  techo: string;
  izquierda: string;
  derecha: string;
  ventanaIzquierda: string;
  ventanaDerecha: string;
  puerta: string;
};

/** Caras de cada edificio, ordenadas de atrás hacia adelante para dibujarlas sin solaparse mal. */
export const CARAS_EDIFICIOS: CarasEdificio[] = [...EDIFICIOS]
  .sort((a, b) => a.x0 + a.ancho + a.y0 + a.fondo - (b.x0 + b.ancho + b.y0 + b.fondo))
  .map(({ id, x0, y0, ancho, fondo, alto }) => {
    const x1 = x0 + ancho;
    const y1 = y0 + fondo;
    const centro = x0 + ancho / 2;
    const [zv0, zv1] = [alto - 0.95, alto - 0.5];
    return {
      id,
      techo: puntos([[x0, y0, alto], [x1, y0, alto], [x1, y1, alto], [x0, y1, alto]]),
      izquierda: puntos([[x0, y1, 0], [x1, y1, 0], [x1, y1, alto], [x0, y1, alto]]),
      derecha: puntos([[x1, y0, 0], [x1, y1, 0], [x1, y1, alto], [x1, y0, alto]]),
      ventanaIzquierda: puntos([[x0 + 0.35, y1, zv0], [x1 - 0.35, y1, zv0], [x1 - 0.35, y1, zv1], [x0 + 0.35, y1, zv1]]),
      ventanaDerecha: puntos([[x1, y0 + 0.35, zv0], [x1, y1 - 0.35, zv0], [x1, y1 - 0.35, zv1], [x1, y0 + 0.35, zv1]]),
      puerta: puntos([[centro - 0.35, y1, 0], [centro + 0.35, y1, 0], [centro + 0.35, y1, 0.85], [centro - 0.35, y1, 0.85]]),
    };
  });

/** Centro del techo del edificio (donde van la etiqueta y el marcador). */
export function techoDe(id: IdEdificio, elevacion = 0): [number, number] {
  const { x0, y0, ancho, fondo, alto } = edificio(id);
  return proyectar([x0 + ancho / 2, y0 + fondo / 2, alto + elevacion]);
}

/** Estado visual de cada edificio según la situación de su etapa. */
export function estadoDeEdificio(
  id: IdEdificio,
  situaciones: SituacionEtapa[],
  posicion: number | null,
  listo: boolean,
): EstadoEdificio {
  if (id === "tesoreria") return "externo";
  if (listo && id === posicion) return "listo";
  const situacion = situaciones[id];
  if (situacion === "completada") return "conforme";
  if (situacion === "observada") return "observado";
  return situacion;
}

// Tramos del camino entre edificios. El primero (Tesorería → Mesa de Partes) es
// previo al sistema: siempre punteado.
const TRAMOS: { desde: IdEdificio; puntos: [number, number][] }[] = [
  { desde: "tesoreria", puntos: [[4.4, 5.7], [5.3, 5.7], [5.3, 4.7], [7.7, 4.7], [7.7, 4.4]] },
  { desde: 0, puntos: [[7.7, 4.7], [9.7, 4.7], [9.7, 8.4], [11.5, 8.4], [11.5, 8.2]] },
  { desde: 1, puntos: [[11.5, 8.4], [9.7, 8.4], [9.7, 9.2], [9.2, 9.2]] },
  { desde: 2, puntos: [[7.7, 11.4], [5.3, 11.4], [5.3, 10.9], [4.4, 10.9]] },
];

/** Un tramo está recorrido si su etapa de origen terminó y la siguiente ya empezó. */
export function tramos(situaciones: SituacionEtapa[]): { puntos: string; recorrido: boolean }[] {
  return TRAMOS.map(({ desde, puntos: lista }) => ({
    puntos: puntos(lista.map(([x, y]) => [x, y, 0])),
    recorrido:
      desde !== "tesoreria" && situaciones[desde] === "completada" && situaciones[desde + 1] !== "pendiente",
  }));
}
