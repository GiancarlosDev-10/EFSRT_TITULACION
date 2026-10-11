// Datos ficticios de los mockups (docs/diseno/prototipo/Tracker.dc.html). No se escriben
// a mano: se construyen con las funciones del dominio, así que un historial
// inválido falla al cargar en vez de llegar a la pantalla.
import {
  abrirExpediente,
  aplicarCambioEstado,
  ubicacionDe,
  type Actor,
  type CodigoEstado,
  type Dependencia,
  type Expediente,
  type Modulo,
} from "../domain";

/** Mientras no haya login, /alumno muestra a esta estudiante. */
export const ESTUDIANTE_DE_PRUEBA = {
  id: "est-giancarlos-ormeno",
  nombre: "Giancarlos Ormeño",
  correo: "gormeno@iestpgildaballivian.edu.pe",
} as const;

const ACTORES = {
  "mesa-partes": { id: "act-mp-1", nombre: "A. Quispe", dependencia: "mesa-partes" },
  coordinacion: { id: "act-co-1", nombre: "Lic. M. Torres", dependencia: "coordinacion" },
  docente: { id: "act-do-1", nombre: "Mg. R. Paredes", dependencia: "docente" },
  bienestar: { id: "act-bi-1", nombre: "Lic. P. Salazar", dependencia: "bienestar" },
} as const satisfies Record<Dependencia, Actor>;

type Paso = [hacia: CodigoEstado, fechaLima: string, nota?: string];

const enLima = (fecha: string) => new Date(`${fecha}-05:00`);

function construir(id: string, modulo: Modulo, fechaRecepcion: string, pasos: Paso[]): Expediente {
  let resultado = abrirExpediente(
    { id, estudianteId: ESTUDIANTE_DE_PRUEBA.id, modulo },
    { actor: ACTORES["mesa-partes"], fecha: enLima(fechaRecepcion) },
  );

  for (const [hacia, fecha, nota] of pasos) {
    if (!resultado.ok) break;
    resultado = aplicarCambioEstado(resultado.valor.expediente, {
      hacia,
      actor: ACTORES[ubicacionDe(hacia)],
      fecha: enLima(fecha),
      motivo: nota,
    });
  }

  if (!resultado.ok) throw new Error(`Dato de prueba inválido en ${id}: ${resultado.error}`);
  return resultado.valor.expediente;
}

export const EXPEDIENTES_DE_PRUEBA: readonly Expediente[] = [
  construir("exp-giancarlos-I", "I", "2026-06-10T11:20", [
    ["03", "2026-06-11T09:02", "Voucher revisado. Carpeta derivada a Coordinación."],
    ["05", "2026-06-14T15:30"],
    ["06", "2026-06-17T10:11", "Mg. R. Paredes"],
    ["07", "2026-07-02T12:40"],
    ["09", "2026-08-20T17:15", "Informe de la empresa (Anexo 4) conforme."],
    ["10", "2026-08-28T16:05", "Visto bueno final registrado. Acércate con tu DNI."],
  ]),
  construir("exp-giancarlos-II", "II", "2026-08-02T10:14", [
    ["02", "2026-08-03T08:50", "El monto del voucher no coincidía con S/ 20 × 1 módulo."],
    ["03", "2026-08-04T11:26", "Carpeta derivada a Coordinación."],
    ["05", "2026-08-08T16:02"],
    ["06", "2026-09-12T09:15", "Mg. R. Paredes"],
    ["07", "2026-09-15T14:30", "Llamada de monitoreo con tu jefe inmediato."],
    ["08", "2026-10-10T09:40", "Anexo 4: falta la firma y el sello del jefe inmediato en la página 3."],
  ]),
  // Módulo III: sin expediente todavía.
];
