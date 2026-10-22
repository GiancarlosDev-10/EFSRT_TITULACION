// Raíz de composición: el ÚNICO lugar donde se eligen los adaptadores.
// La aplicación usa Supabase con la sesión de quien pide (el RLS ve a esa
// persona). El repositorio en memoria queda para las pruebas (D47).
// "server-only": si un componente del navegador lo importa, el build falla.
import "server-only";
import { cache } from "react";
import { crearBusEnMemoria } from "@/shared";
import { crearClienteServidor } from "@/shared/lib/supabase/servidor";
import type { ExpedienteCambioDeEstado } from "../domain";
import {
  crearObtenerSeguimientoDelEstudiante,
  crearRegistrarCambioEstado,
  crearRegistrarRecepcion,
  type DependenciasTramitacion,
  type SolicitudCambioEstado,
  type SolicitudRecepcion,
} from "../application";
import { crearDirectorioSupabase } from "./directorio-supabase";
import { crearRepositorioSupabase } from "./repositorio-supabase";

// Uno solo para toda la aplicación: así los suscriptores reciben todos los cambios.
const bus = crearBusEnMemoria<ExpedienteCambioDeEstado>();

// El cliente lleva la sesión de quien pide: se arma en cada petición (cache: una vez por petición).
const cliente = cache(crearClienteServidor);

const dependencias = cache(
  async (): Promise<DependenciasTramitacion> => ({
    repositorio: crearRepositorioSupabase(await cliente()),
    publicador: bus,
    reloj: { ahora: () => new Date() },
    ids: { nuevoId: () => crypto.randomUUID() },
  }),
);

/** Estudiante enlazado a la cuenta (el id de la cuenta sale de la sesión, nunca del navegador). */
export const obtenerEstudianteDeUsuario = cache(async (usuarioId: string) =>
  crearDirectorioSupabase(await cliente()).buscarPorUsuario(usuarioId),
);

// cache: el layout y la página lo piden en la misma petición; se consulta una sola vez.
export const obtenerSeguimientoDelEstudiante = cache(async (estudianteId: string) =>
  crearObtenerSeguimientoDelEstudiante(await dependencias())(estudianteId),
);

export async function registrarRecepcion(solicitud: SolicitudRecepcion) {
  return crearRegistrarRecepcion(await dependencias())(solicitud);
}

export async function registrarCambioEstado(solicitud: SolicitudCambioEstado) {
  return crearRegistrarCambioEstado(await dependencias())(solicitud);
}

/** Otros módulos (p. ej. notificaciones) escuchan aquí los cambios de estado. */
export const suscribirseACambiosDeEstado = bus.suscribir;
