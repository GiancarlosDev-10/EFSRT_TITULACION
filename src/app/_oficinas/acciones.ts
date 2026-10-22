"use server";
// Server Actions de las oficinas. Son endpoints públicos (CLAUDE.md, Seguridad):
// cada una valida la sesión y cada dato por sí misma. La dependencia y el
// actor salen de la sesión verificada, nunca del formulario.
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/modules/auth";
import {
  MENSAJES_DE_ERROR,
  RUTAS_OFICINA,
  esCodigoEstado,
  registrarCambioEstado,
  type EstadoPanelAccion,
} from "@/modules/tramitacion";
import { esUuid } from "@/shared";

const SIN_PERMISO: EstadoPanelAccion = {
  error: "Tu sesión no permite registrar cambios. Vuelve a ingresar.",
  conflicto: false,
};

const DATOS_INVALIDOS: EstadoPanelAccion = {
  error: "No pudimos leer el formulario. Recarga la página y vuelve a intentarlo.",
  conflicto: false,
};

/** Texto opcional del formulario; `undefined` si no vino o vino vacío. */
function textoOpcional(datos: FormData, campo: string): string | undefined {
  const valor = datos.get(campo);
  return typeof valor === "string" && valor !== "" ? valor : undefined;
}

/** Una oficina registra un cambio de estado desde el detalle del expediente. */
export async function registrarCambioDeOficina(_previo: EstadoPanelAccion, datos: FormData): Promise<EstadoPanelAccion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol === "estudiante") return SIN_PERMISO;
  const dependencia = usuario.rol;

  const expedienteId = datos.get("expedienteId");
  const hacia = datos.get("hacia");
  const desde = datos.get("desde");
  const docenteId = textoOpcional(datos, "docenteId");
  if (!esUuid(expedienteId) || !esCodigoEstado(hacia) || !esCodigoEstado(desde)) return DATOS_INVALIDOS;
  if (docenteId !== undefined && !esUuid(docenteId)) return DATOS_INVALIDOS;

  // Las reglas (transición, oficina, motivo, docente) las aplica el caso de uso, y la base otra vez.
  const resultado = await registrarCambioEstado({
    actor: { id: usuario.id, nombre: usuario.nombre, dependencia },
    expedienteId,
    hacia,
    desde,
    motivo: textoOpcional(datos, "motivo"),
    docenteId,
  });
  if (!resultado.ok) {
    return { error: MENSAJES_DE_ERROR[resultado.error], conflicto: resultado.error === "CONFLICTO_DE_ESTADO" };
  }
  redirect(`${RUTAS_OFICINA.expediente(dependencia, expedienteId)}?registrado=${hacia}`);
}
