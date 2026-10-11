// Raíz de composición: el ÚNICO lugar donde se eligen los adaptadores.
// Para pasar a Supabase se cambia el repositorio aquí y nada más.
// "server-only": si un componente del navegador lo importa, el build falla.
import "server-only";
import { crearBusEnMemoria } from "@/shared";
import type { ExpedienteCambioDeEstado } from "../domain";
import {
  crearObtenerSeguimientoDelEstudiante,
  crearRegistrarCambioEstado,
  crearRegistrarRecepcion,
  type DependenciasTramitacion,
} from "../application";
import { EXPEDIENTES_DE_PRUEBA } from "./datos-prueba";
import { crearRepositorioEnMemoria } from "./repositorio-en-memoria";

const bus = crearBusEnMemoria<ExpedienteCambioDeEstado>();

const dependencias: DependenciasTramitacion = {
  repositorio: crearRepositorioEnMemoria(EXPEDIENTES_DE_PRUEBA),
  publicador: bus,
  reloj: { ahora: () => new Date() },
  ids: { nuevoId: () => crypto.randomUUID() },
};

export const obtenerSeguimientoDelEstudiante = crearObtenerSeguimientoDelEstudiante(dependencias);
export const registrarRecepcion = crearRegistrarRecepcion(dependencias);
export const registrarCambioEstado = crearRegistrarCambioEstado(dependencias);

/** Otros módulos (p. ej. notificaciones) escuchan aquí los cambios de estado. */
export const suscribirseACambiosDeEstado = bus.suscribir;
