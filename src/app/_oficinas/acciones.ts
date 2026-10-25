"use server";
// Server Actions de las oficinas. Son endpoints públicos (CLAUDE.md, Seguridad):
// cada una valida la sesión y cada dato por sí misma. La dependencia y el
// actor salen de la sesión verificada, nunca del formulario. Cubren el cambio
// de estado (D51), el cambio de docente (D53), la recepción y el alta de
// estudiantes (D52). Cada cambio de estado avisa al estudiante por correo (D55).
import "./avisos";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/modules/auth";
import {
  MENSAJES_ALTA_ESTUDIANTE,
  MENSAJES_DATOS_ESTUDIANTE,
  MENSAJES_DE_ERROR,
  RUTAS_OFICINA,
  RUTAS_RECEPCION,
  cambiarDocente,
  esCodigoEstado,
  esModulo,
  obtenerCandidatoRecepcion,
  registrarCambioEstado,
  registrarEstudiante,
  registrarRecepcion,
  type DatosEstudiante,
  type EntradaEstudiante,
  type EstadoAltaEstudiante,
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

/** Coordinación cambia al Docente Supervisor de un expediente en supervisión (D53). */
export async function cambiarDocenteDeOficina(_previo: EstadoPanelAccion, datos: FormData): Promise<EstadoPanelAccion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol === "estudiante") return SIN_PERMISO;
  const dependencia = usuario.rol;

  const expedienteId = datos.get("expedienteId");
  const docenteAnteriorId = datos.get("docenteAnteriorId");
  const docenteId = datos.get("docenteId");
  if (!esUuid(expedienteId) || !esUuid(docenteAnteriorId) || !esUuid(docenteId)) return DATOS_INVALIDOS;

  // Las reglas (oficina, estado, motivo, docente activo y distinto) las aplica el caso de uso, y la base otra vez.
  const resultado = await cambiarDocente({
    actor: { id: usuario.id, nombre: usuario.nombre, dependencia },
    expedienteId,
    docenteAnteriorId,
    docenteId,
    motivo: textoOpcional(datos, "motivo"),
  });
  if (!resultado.ok) {
    return { error: MENSAJES_DE_ERROR[resultado.error], conflicto: resultado.error === "CONFLICTO_DE_ESTADO" };
  }
  redirect(`${RUTAS_OFICINA.expediente(dependencia, expedienteId)}?docente=cambiado`);
}

/** Mesa de Partes recibe la carpeta física: nace el expediente del módulo elegido. */
export async function registrarRecepcionDeOficina(_previo: EstadoPanelAccion, datos: FormData): Promise<EstadoPanelAccion> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol === "estudiante") return SIN_PERMISO;
  const dependencia = usuario.rol;

  const estudianteId = datos.get("estudianteId");
  const modulo = datos.get("modulo");
  if (!esUuid(estudianteId) || !esModulo(modulo)) return DATOS_INVALIDOS;
  // Un estudiante que la sesión no ve (o no existe) no recibe expediente.
  if (!(await obtenerCandidatoRecepcion(estudianteId))) return DATOS_INVALIDOS;

  // Solo Mesa de Partes abre expedientes: lo exige el caso de uso, y la base otra vez.
  const resultado = await registrarRecepcion({
    actor: { id: usuario.id, nombre: usuario.nombre, dependencia },
    estudianteId,
    modulo,
    nota: textoOpcional(datos, "nota"),
  });
  if (!resultado.ok) return { error: MENSAJES_DE_ERROR[resultado.error], conflicto: false };
  const { id, estado } = resultado.valor;
  redirect(`${RUTAS_OFICINA.expediente(dependencia, id)}?registrado=${estado}`);
}

const CAMPOS_ESTUDIANTE: (keyof DatosEstudiante)[] = [
  "tipoDocumento",
  "numeroDocumento",
  "nombres",
  "apellidos",
  "carrera",
  "correoInstitucional",
  "correoPersonal",
];

/** Largo máximo de cualquier campo del alta (un correo admite hasta 254). */
const LARGO_MAXIMO_CAMPO = 254;

/** Mesa de Partes registra a un estudiante en su primera carpeta y sigue con la elección del módulo. */
export async function registrarEstudianteDeOficina(
  _previo: EstadoAltaEstudiante,
  datos: FormData,
): Promise<EstadoAltaEstudiante> {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol === "estudiante") return { error: SIN_PERMISO.error, campos: {} };

  const entrada = Object.fromEntries(
    CAMPOS_ESTUDIANTE.map((campo) => {
      const valor = datos.get(campo);
      return [campo, typeof valor === "string" ? valor.slice(0, LARGO_MAXIMO_CAMPO) : undefined];
    }),
  ) as EntradaEstudiante;

  const resultado = await registrarEstudiante({
    actor: { id: usuario.id, nombre: usuario.nombre, dependencia: usuario.rol },
    datos: entrada,
  });
  if (!resultado.ok) {
    const { error } = resultado;
    if (error.tipo !== "DATOS_INVALIDOS") return { error: MENSAJES_ALTA_ESTUDIANTE[error.tipo], campos: {} };
    const campos = Object.fromEntries(
      Object.entries(error.campos).map(([campo, codigo]) => [campo, MENSAJES_DATOS_ESTUDIANTE[codigo]]),
    );
    return { error: null, campos };
  }
  redirect(`${RUTAS_RECEPCION.modulo(resultado.valor.id)}&nuevo=1`);
}
