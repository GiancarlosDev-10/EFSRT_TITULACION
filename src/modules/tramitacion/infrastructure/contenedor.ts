// Raíz de composición: el ÚNICO lugar donde se eligen los adaptadores.
// REPOSITORIO=memoria (por defecto) usa los datos de prueba; REPOSITORIO=supabase,
// la base con la sesión del usuario (se activa con el login, Fase 7, D37).
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
import { EXPEDIENTES_DE_PRUEBA } from "./datos-prueba";
import { crearRepositorioEnMemoria } from "./repositorio-en-memoria";
import { crearRepositorioSupabase } from "./repositorio-supabase";

const usarSupabase = process.env.REPOSITORIO === "supabase";

// Uno solo para toda la aplicación: así los suscriptores reciben todos los cambios.
const bus = crearBusEnMemoria<ExpedienteCambioDeEstado>();
const repositorioEnMemoria = crearRepositorioEnMemoria(EXPEDIENTES_DE_PRUEBA);

// Con Supabase el repositorio lleva la sesión de quien pide, así que se arma en
// cada petición (cache: una sola vez por petición).
const dependencias = cache(
  async (): Promise<DependenciasTramitacion> => ({
    repositorio: usarSupabase ? crearRepositorioSupabase(await crearClienteServidor()) : repositorioEnMemoria,
    publicador: bus,
    reloj: { ahora: () => new Date() },
    ids: { nuevoId: () => crypto.randomUUID() },
  }),
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
