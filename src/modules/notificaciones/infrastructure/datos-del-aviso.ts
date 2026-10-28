// Traduce una fila de la bandeja de salida a los datos del correo, con los
// textos del catálogo de `tramitacion` (su API pública). Si el catálogo cambia,
// los correos cambian con él.
import {
  DEPENDENCIAS,
  DESTINO_DE,
  ESTADOS,
  INSTITUCION,
  RUTAS_ALUMNO,
  UBICACION_DE,
  esCodigoEstado,
  esModulo,
  indicacionDe,
  nombresDeModulos,
  pasaA,
  ubicacionDe,
} from "@/modules/tramitacion";
import type { Tables } from "@/shared/lib/supabase/tipos-db";
import type { DatosAviso } from "../domain/aviso";

export type FilaNotificacion = Tables<"notificaciones">;

export function datosDelAviso(fila: FilaNotificacion, sitio: string): DatosAviso {
  const { estado_codigo: codigo, modulo } = fila;
  if (!esCodigoEstado(codigo) || !esModulo(modulo)) {
    throw new Error(`Aviso ${fila.id}: estado "${codigo}" o módulo "${modulo}" desconocido`);
  }
  const estado = ESTADOS[codigo];
  const indicacion = indicacionDe(codigo);
  const { bienestar } = INSTITUCION;
  const pasa = pasaA(codigo);
  return {
    // Saludo con el primer nombre, como en la aplicación.
    nombres: fila.nombres.split(" ")[0],
    modulo,
    nombreModulo: nombresDeModulos(fila.carrera)?.[modulo] ?? null,
    estado: { codigo, nombre: estado.nombre, tipo: estado.tipo },
    apertura: fila.apertura,
    // "pasa a Coordinación de Carrera" si lo siguiente ya lo registra otra oficina (03, 06, 09).
    ahora: pasa ? `pasa ${DESTINO_DE[pasa]}` : `está ${UBICACION_DE[ubicacionDe(codigo)]}`,
    motivo: fila.motivo,
    // La corrección se entrega a la oficina que observó.
    subsanar: indicacion && fila.cambio_docente_id === null ? { indicacion, entregarA: DEPENDENCIAS[estado.dependencia].conPreposicion } : null,
    constancia:
      estado.tipo === "final"
        ? { lugar: bienestar.nombre, ubicacion: bienestar.ubicacion, horario: bienestar.horario, queLlevar: bienestar.queLlevar }
        : null,
    // Un cambio de docente no es un cambio de estado: la fila no viene del historial.
    docenteAsignado: fila.cambio_docente_id === null ? fila.docente_nombre : null,
    cambioDeDocente:
      fila.cambio_docente_id !== null && fila.docente_nombre && fila.docente_anterior_nombre
        ? { nuevo: fila.docente_nombre, anterior: fila.docente_anterior_nombre }
        : null,
    fecha: new Date(fila.fecha),
    enlace: `${sitio}${RUTAS_ALUMNO.seguimiento(modulo)}`,
  };
}
