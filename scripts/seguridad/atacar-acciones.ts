// Ataque a la capa 2 (CLAUDE.md, Seguridad): llama a las Server Actions de las
// oficinas como lo haría `curl`, saltándose las pantallas, con la sesión de
// usuarios de prueba que no deberían poder hacerlo. Cada caso debe terminar
// rechazado y sin filas nuevas en la base.
//
// Uso (con `bun run dev` encendido): bun run seguridad:acciones
//
// Solo usa cuentas y datos de prueba (*@efsrt.test, "Estudiante De Prueba").
// No entra en `bun test`: necesita el servidor de desarrollo.
//
// Alcance: sin sesión y con sesión de estudiante (el rol se revisa antes de
// leer el formulario). Las reglas entre oficinas (oficina equivocada, otra
// carrera, datos inválidos) se prueban en los casos de uso y en la base.
import { createServerClient } from "@supabase/ssr";
import { clienteAdmin } from "../db/clientes-prueba";
import { ESTUDIANTES_PRUEBA, USUARIOS_PRUEBA, claveUsuariosPrueba, type ClaveUsuarioPrueba } from "../db/usuarios-prueba";

const SITIO = (process.env.URL_DEL_SITIO ?? "http://localhost:3000").replace(/\/+$/, "");
const MANIFIESTO = ".next/dev/server/server-reference-manifest.json";
const admin = clienteAdmin();

type NombreAccion =
  | "registrarCambioDeOficina"
  | "cambiarDocenteDeOficina"
  | "registrarRecepcionDeOficina"
  | "registrarEstudianteDeOficina"
  | "leerCampana"
  | "marcarCampanaLeida";

// ---- Sesión: la cookie que guardaría el navegador -----------------------------

/** Inicia sesión con la misma librería que la aplicación y devuelve el encabezado `Cookie`. */
async function cookieDe(usuario: ClaveUsuarioPrueba): Promise<string> {
  const guardadas = new Map<string, string>();
  const cliente = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => [...guardadas].map(([name, value]) => ({ name, value })),
      setAll: (nuevas) => nuevas.forEach(({ name, value }) => guardadas.set(name, value)),
    },
  });
  const { error } = await cliente.auth.signInWithPassword({ email: USUARIOS_PRUEBA[usuario].correo, password: claveUsuariosPrueba() });
  if (error) throw new Error(`No se pudo iniciar sesión como ${usuario}: ${error.message}. ¿Corriste bun run db:sembrar?`);
  return [...guardadas].map(([nombre, valor]) => `${nombre}=${valor}`).join("; ");
}

// ---- Llamada a una Server Action ----------------------------------------------

async function idDeAccion(nombre: NombreAccion): Promise<string> {
  const manifiesto = (await Bun.file(MANIFIESTO).json()) as { node: Record<string, { exportedName?: string }> };
  const id = Object.entries(manifiesto.node).find(([, accion]) => accion.exportedName === nombre)?.[0];
  if (!id) throw new Error(`No encontré ${nombre} en ${MANIFIESTO}. Abre una vez el detalle de un expediente en el navegador.`);
  return id;
}

/**
 * Cuerpo que arma React al llamar a una acción de `useActionState`: el campo
 * "0" lleva los argumentos [estado previo, formulario] y los campos del
 * formulario van con el prefijo "_1_" (como encodeReply de React).
 */
function cuerpo(campos: Record<string, string>): FormData {
  const datos = new FormData();
  datos.append("0", JSON.stringify([{ error: null, conflicto: false }, "$K1"]));
  for (const [clave, valor] of Object.entries(campos)) datos.append(`_1_${clave}`, valor);
  return datos;
}

type Respuesta = { estado: number; redirigeA: string | null; texto: string };

/**
 * `campos`: formulario de `useActionState` (acciones de las oficinas).
 * `unknown[]`: argumentos sueltos (acciones de la campana); React los envía como JSON.
 */
async function llamar(ruta: string, accion: NombreAccion, campos: Record<string, string> | unknown[], cookie?: string): Promise<Respuesta> {
  const argumentos = Array.isArray(campos);
  const respuesta = await fetch(`${SITIO}${ruta}`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Next-Action": await idDeAccion(accion),
      Accept: "text/x-component",
      Origin: SITIO,
      ...(argumentos ? { "Content-Type": "text/plain;charset=UTF-8" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: argumentos ? JSON.stringify(campos) : cuerpo(campos),
  });
  return {
    estado: respuesta.status,
    // Éxito de la acción: Next responde con la ruta a la que redirige.
    redirigeA: respuesta.headers.get("x-action-redirect") ?? respuesta.headers.get("location"),
    texto: await respuesta.text(),
  };
}

// ---- Estado de la base: nada debe cambiar ---------------------------------------

async function contar(tabla: "historial" | "cambios_docente" | "expedientes" | "estudiantes"): Promise<number> {
  const { count, error } = await admin.from(tabla).select("*", { count: "exact", head: true });
  if (error) throw new Error(`contar ${tabla}: ${error.message}`);
  return count ?? 0;
}

/**
 * Avisos de la campana (D58) que NO son del estudiante atacante y ya están
 * leídos: marcar los suyos es legítimo; tocar los ajenos, no.
 */
async function avisosAjenosLeidos(alumnoId: string): Promise<number> {
  const { count, error } = await admin
    .from("avisos")
    .select("*", { count: "exact", head: true })
    .not("leido_en", "is", null)
    .or(`estudiante_id.is.null,estudiante_id.neq.${alumnoId}`);
  if (error) throw new Error(`contar avisos: ${error.message}`);
  return count ?? 0;
}

async function fotoDeLaBase(alumnoId: string) {
  const [historial, cambiosDocente, expedientes, estudiantes, avisosAjenos] = await Promise.all([
    contar("historial"),
    contar("cambios_docente"),
    contar("expedientes"),
    contar("estudiantes"),
    avisosAjenosLeidos(alumnoId),
  ]);
  return { historial, cambiosDocente, expedientes, estudiantes, avisosAjenos };
}

// ---- Datos de prueba que se atacan -------------------------------------------------

async function prepararDatos() {
  const { estudiante } = ESTUDIANTES_PRUEBA;
  const { data: alumno, error } = await admin
    .from("estudiantes")
    .select("id")
    .eq("numero_documento", estudiante.numero_documento)
    .single();
  if (error) throw new Error(`Estudiante De Prueba: ${error.message}`);
  // Su Módulo II, en 08 (supervisión observada), en la carrera real.
  const { data: expediente } = await admin
    .from("expedientes")
    .select("id, estado, docente_id")
    .eq("estudiante_id", alumno.id)
    .eq("modulo", "II")
    .single();
  if (!expediente?.docente_id) throw new Error("El Módulo II del Estudiante De Prueba debe tener docente. ¿Corriste bun run db:sembrar?");
  const { data: otro } = await admin.from("personal").select("id").eq("correo", USUARIOS_PRUEBA.docenteAjeno.correo).single();
  return { alumnoId: alumno.id, expediente, otroDocenteId: otro!.id };
}

// ---- Casos ------------------------------------------------------------------------

type Caso = {
  quien: string;
  intenta: string;
  usuario: ClaveUsuarioPrueba | null;
  ruta: string;
  accion: NombreAccion;
  campos: Record<string, string> | unknown[];
  /** Para acciones que solo leen: qué NO debe aparecer en la respuesta. */
  noDebeMostrar?: RegExp;
};

/** Primer mensaje de error que devolvió la acción (o qué la detuvo antes). */
function motivoDelRechazo({ estado, redirigeA, texto }: Respuesta): string {
  if (redirigeA?.includes("/login")) return "El proxy lo mandó a /login (sin sesión)";
  const mensaje = texto.match(/"error":"([^"]+)"/)?.[1];
  if (mensaje) return mensaje;
  if (/server action not found|Failed to find Server Action/i.test(texto)) return "Next no encontró la acción en esa ruta";
  // Acciones de la campana: lo que devolvió (la línea "1:" de la respuesta de React).
  const valor = texto.match(/^1:(true|false|null)$/m)?.[1];
  if (valor) return `La acción devolvió ${valor}`;
  return `HTTP ${estado}`;
}

async function main() {
  const { alumnoId, expediente, otroDocenteId } = await prepararDatos();
  // El aviso más reciente de la base: "marcar hasta aquí" abarca todos los avisos.
  const { data: ultimo } = await admin.from("avisos").select("id").order("id", { ascending: false }).limit(1);
  const ultimoAviso = ultimo?.[0]?.id ?? 1;
  const { count: ajenosSinLeer } = await admin
    .from("avisos")
    .select("*", { count: "exact", head: true })
    .is("leido_en", null)
    .or(`estudiante_id.is.null,estudiante_id.neq.${alumnoId}`);
  if (!ajenosSinLeer) console.warn("Aviso: no hay avisos ajenos sin leer; los casos de la campana no demuestran mucho. Registra un cambio desde una oficina y vuelve a correrlo.\n");
  const ruta = `/coordinacion/expediente/${expediente.id}`;
  const cambioEstado = { expedienteId: expediente.id, desde: expediente.estado, hacia: "07" };
  const cambioDocente = {
    expedienteId: expediente.id,
    docenteAnteriorId: expediente.docente_id!,
    docenteId: otroDocenteId,
    motivo: "Ataque de prueba.",
  };

  const casos: Caso[] = [
    { quien: "Sin sesión", intenta: "Dar por subsanada una observación (08→07)", usuario: null, ruta, accion: "registrarCambioDeOficina", campos: cambioEstado },
    { quien: "Estudiante", intenta: "Dar por subsanada su propia observación (08→07)", usuario: "estudiante", ruta, accion: "registrarCambioDeOficina", campos: cambioEstado },
    { quien: "Estudiante", intenta: "Cambiar a su Docente Supervisor", usuario: "estudiante", ruta, accion: "cambiarDocenteDeOficina", campos: cambioDocente },
    { quien: "Estudiante", intenta: "Abrirse un expediente del Módulo III", usuario: "estudiante", ruta, accion: "registrarRecepcionDeOficina", campos: { estudianteId: alumnoId, modulo: "III" } },
    {
      quien: "Estudiante",
      intenta: "Registrar a un estudiante nuevo",
      usuario: "estudiante",
      ruta,
      accion: "registrarEstudianteDeOficina",
      campos: { tipoDocumento: "DNI", numeroDocumento: "79999999", nombres: "Intruso", apellidos: "De Prueba", carrera: "desarrollo-sistemas", correoInstitucional: "", correoPersonal: "intruso@efsrt.test" },
    },
    // Campana (D58): cualquier sesión puede leer y marcar SUS avisos; nunca los ajenos.
    { quien: "Sin sesión", intenta: "Leer avisos de la campana", usuario: null, ruta: "/alumno", accion: "leerCampana", campos: [] },
    { quien: "Sin sesión", intenta: "Marcar avisos como leídos", usuario: null, ruta: "/alumno", accion: "marcarCampanaLeida", campos: [ultimoAviso] },
    {
      quien: "Estudiante",
      intenta: "Leer avisos de oficinas o docentes",
      usuario: "estudiante",
      ruta: "/alumno",
      accion: "leerCampana",
      campos: [],
      noDebeMostrar: /Llegó el expediente|Te asignaron/,
    },
    { quien: "Estudiante", intenta: "Marcar como leídos los avisos de todos", usuario: "estudiante", ruta: "/alumno", accion: "marcarCampanaLeida", campos: [ultimoAviso] },
    { quien: "Estudiante", intenta: "Marcar con un id que no es número", usuario: "estudiante", ruta: "/alumno", accion: "marcarCampanaLeida", campos: ["1 or 1=1"] },
  ];

  const cookies = new Map<ClaveUsuarioPrueba, string>();
  const sesion = async (usuario: ClaveUsuarioPrueba | null) => {
    if (!usuario) return undefined;
    if (!cookies.has(usuario)) cookies.set(usuario, await cookieDe(usuario));
    return cookies.get(usuario);
  };

  console.log(`Atacando ${SITIO} con ${casos.length} casos…\n`);
  const filas = [];
  let fallidos = 0;
  for (const caso of casos) {
    const antes = await fotoDeLaBase(alumnoId);
    const respuesta = await llamar(caso.ruta, caso.accion, caso.campos, await sesion(caso.usuario));
    const despues = await fotoDeLaBase(alumnoId);
    const baseIgual = JSON.stringify(antes) === JSON.stringify(despues);
    const ejecutada = Boolean(respuesta.redirigeA) && !respuesta.redirigeA!.includes("/login");
    const filtro = Boolean(caso.noDebeMostrar?.test(respuesta.texto));
    const rechazado = baseIgual && !ejecutada && !filtro;
    if (!rechazado) fallidos++;
    const leyoSoloLosSuyos = caso.noDebeMostrar && respuesta.estado === 200 && !filtro;
    filas.push({
      Resultado: rechazado ? "RECHAZADO" : "¡PASÓ!",
      Quién: caso.quien,
      Intenta: caso.intenta,
      Respuesta: leyoSoloLosSuyos ? "Solo recibió sus propios avisos" : motivoDelRechazo(respuesta),
      "Base sin cambios": baseIgual ? "sí" : "NO",
    });
  }
  console.table(filas);

  // Evidencia para la tesis: el mismo ataque del estudiante, listo para copiar.
  const cookie = await sesion("estudiante");
  console.log("\nComando curl del caso \"Estudiante: dar por subsanada su propia observación\" (para Git Bash):\n");
  console.log(
    [
      `curl -i -X POST '${SITIO}${ruta}'`,
      `  -H 'Next-Action: ${await idDeAccion("registrarCambioDeOficina")}'`,
      `  -H 'Accept: text/x-component'`,
      `  -H 'Origin: ${SITIO}'`,
      `  -H 'Cookie: ${cookie}'`,
      `  -F '0=[{"error":null,"conflicto":false},"$K1"]'`,
      ...Object.entries(cambioEstado).map(([clave, valor]) => `  -F '_1_${clave}=${valor}'`),
    ].join(" \\\n"),
  );
  console.log("\n(La cookie es de la cuenta de prueba estudiante@efsrt.test y vence en una hora.)");

  console.log(fallidos === 0 ? `\nTodos los ataques fueron rechazados (${casos.length}/${casos.length}).` : `\n${fallidos} ataque(s) NO fueron rechazados.`);
  process.exit(fallidos === 0 ? 0 : 1);
}

await main();
