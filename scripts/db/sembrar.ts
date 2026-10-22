// Siembra el proyecto de DESARROLLO con los datos ficticios de los mockups.
// Uso: bun run db:sembrar   (usa SUPABASE_SECRET_KEY: solo en esta máquina)
//
// Dos grupos de datos (D48):
// - Pruebas automáticas: usuarios *@efsrt.test con contraseña y sus estudiantes.
// - Video y pruebas a mano: Giancarlos y Valeria, habilitados para tus cuentas
//   reales del .env (CUENTA_*), igual que el personal de cada oficina.
//
// Se puede ejecutar varias veces: reutiliza usuarios, estudiantes y expedientes
// existentes. Si la cuenta real del docente ya ingresó al sembrar, los
// expedientes del video se asignan a ella; si no, al docente de prueba.
// El historial no se puede borrar (D11); para empezar de cero hay que reiniciar
// la base del proyecto de desarrollo.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/shared/lib/supabase/tipos-db";
import { ubicacionDe, type Dependencia, type Expediente } from "../../src/modules/tramitacion/domain";
import { EXPEDIENTES_DE_PRUEBA, EXPEDIENTE_POR_ASIGNAR } from "../../src/modules/tramitacion/infrastructure/datos-prueba";
import {
  CUENTAS_REALES,
  ESTUDIANTES_PRUEBA,
  USUARIOS_PRUEBA,
  claveUsuariosPrueba,
  type ClaveUsuarioPrueba,
  type UsuarioPrueba,
} from "./usuarios-prueba";

function variable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env`);
  return valor;
}

const admin = createClient<Database>(variable("NEXT_PUBLIC_SUPABASE_URL"), variable("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DOMINIO_INSTITUCIONAL = "@iestpgildaballivian.edu.pe";
const CARRERA = "desarrollo-sistemas";

/** Respuestas de supabase-js: o hay `data`, o hay `error`. */
type Respuesta<T> = { data: T; error: null } | { data: unknown; error: { message: string } };

function revisar<T>(respuesta: Respuesta<T>, que: string): T {
  if (respuesta.error) throw new Error(`${que}: ${respuesta.error.message}`);
  return respuesta.data;
}

type DatosEstudiante = Database["public"]["Tables"]["estudiantes"]["Insert"];
type RolOficina = Dependencia;

// ---------------------------------------------------------------------------
// Cuentas
// ---------------------------------------------------------------------------

let cuentasExistentes: Map<string, string> | null = null;

/** Id de la cuenta con ese correo, si ya existe (p. ej. si ya ingresaste una vez). */
async function idDeCuenta(correo: string): Promise<string | null> {
  if (!cuentasExistentes) {
    const lista = revisar(await admin.auth.admin.listUsers({ perPage: 1000 }), "listar usuarios");
    cuentasExistentes = new Map(lista.users.map((u) => [u.email!.toLowerCase(), u.id]));
  }
  return cuentasExistentes.get(correo.toLowerCase()) ?? null;
}

/** Crea (o reutiliza) un usuario de prueba con contraseña. Antes hay que habilitar su correo. */
async function asegurarUsuarioPrueba(clave: ClaveUsuarioPrueba): Promise<string> {
  const { correo } = USUARIOS_PRUEBA[clave];
  const existente = await idDeCuenta(correo);
  if (existente) return existente;
  const creado = revisar(
    await admin.auth.admin.createUser({ email: correo, password: claveUsuariosPrueba(), email_confirm: true }),
    `crear ${correo}`,
  );
  cuentasExistentes!.set(correo, creado.user.id);
  return creado.user.id;
}

type PersonalHabilitado = { usuarioId: string | null; personalId: string };

/**
 * Habilita un correo para un rol de oficina y, si la cuenta ya existe, la
 * enlaza. Coordinación lleva su carrera (D50).
 */
async function habilitarPersonal(
  correo: string,
  nombre: string,
  rol: RolOficina,
  carrera: string | null = rol === "coordinacion" ? CARRERA : null,
): Promise<PersonalHabilitado> {
  const usuarioId = await idDeCuenta(correo);
  const { data: fila, error } = await admin
    .from("personal")
    .upsert({ correo: correo.toLowerCase(), nombre, rol, carrera, activo: true, usuario_id: usuarioId }, { onConflict: "correo" })
    .select("id")
    .single();
  if (error) throw new Error(`personal ${correo}: ${error.message}`);
  if (usuarioId) revisar(await admin.from("perfiles").upsert({ id: usuarioId, nombre, rol }), `perfil de ${correo}`);
  return { usuarioId, personalId: fila.id };
}

// ---------------------------------------------------------------------------
// Estudiantes
// ---------------------------------------------------------------------------

/** Registra al estudiante (como Mesa de Partes) y devuelve su id. */
async function asegurarEstudiante(datos: DatosEstudiante): Promise<string> {
  const { data, error } = await admin
    .from("estudiantes")
    .upsert(datos, { onConflict: "tipo_documento,numero_documento" })
    .select("id")
    .single();
  if (error) throw new Error(`estudiante ${datos.nombres}: ${error.message}`);
  return data.id;
}

/** Correo institucional o personal según el dominio. */
function correosDe(correo: string): Pick<DatosEstudiante, "correo_institucional" | "correo_personal"> {
  const institucional = correo.toLowerCase().endsWith(DOMINIO_INSTITUCIONAL);
  return { correo_institucional: institucional ? correo : null, correo_personal: institucional ? null : correo };
}

/**
 * Enlaza al estudiante con la cuenta (o lo deja libre si `usuarioId` es null,
 * para que se enlace solo al primer ingreso). Una cuenta, un estudiante.
 */
async function enlazarEstudiante(estudianteId: string, usuarioId: string | null, nombre: string) {
  if (usuarioId) {
    revisar(
      await admin.from("estudiantes").update({ usuario_id: null }).eq("usuario_id", usuarioId).neq("id", estudianteId),
      "liberar cuenta",
    );
    revisar(await admin.from("perfiles").upsert({ id: usuarioId, nombre, rol: "estudiante" }), "perfil de estudiante");
  }
  revisar(await admin.from("estudiantes").update({ usuario_id: usuarioId }).eq("id", estudianteId), "enlazar cuenta");
}

// ---------------------------------------------------------------------------
// Expedientes
// ---------------------------------------------------------------------------

/** Cuentas (perfiles) que registran cada estado y fila de `personal` del docente que se asigna en 06. */
type Actores = { cuentas: Record<Dependencia, string>; docentePersonalId: string };

/** Carga un expediente con todo su historial, como si cada oficina lo hubiera registrado. */
async function cargarExpediente(expediente: Expediente, estudianteId: string, actores: Actores): Promise<void> {
  const existente = revisar(
    await admin.from("expedientes").select("id").eq("estudiante_id", estudianteId).eq("modulo", expediente.modulo),
    "buscar expediente",
  );
  if (existente.length > 0) {
    console.log(`  · Módulo ${expediente.modulo}: ya existe, se deja como está`);
    return;
  }

  const id = crypto.randomUUID();
  const [apertura, ...cambios] = expediente.historial;

  // Nace sin docente: lo asigna el registro 06, como en producción (D49).
  revisar(
    await admin.from("expedientes").insert({
      id,
      estudiante_id: estudianteId,
      modulo: expediente.modulo,
      estado: apertura.estadoNuevo,
      creado_en: apertura.fecha.toISOString(),
    }),
    "crear expediente",
  );

  // Fila por fila y en orden: el trigger valida cada transición igual que en producción.
  for (const registro of [apertura, ...cambios]) {
    const dependencia = ubicacionDe(registro.estadoNuevo);
    revisar(
      await admin.from("historial").insert({
        expediente_id: id,
        estado_anterior: registro.estadoAnterior,
        estado_nuevo: registro.estadoNuevo,
        motivo: registro.motivo,
        fecha: registro.fecha.toISOString(),
        actor_id: actores.cuentas[dependencia],
        // El trigger los reemplaza con los datos del perfil.
        actor_nombre: "",
        actor_dependencia: dependencia,
        docente_id: registro.docente ? actores.docentePersonalId : null,
      }),
      `historial ${registro.estadoAnterior ?? "—"}→${registro.estadoNuevo}`,
    );
  }
  console.log(`  · Módulo ${expediente.modulo}: ${expediente.historial.length} registros, estado ${expediente.estado}`);
}

// ---------------------------------------------------------------------------

const CLAVE_DE_ROL: Record<RolOficina, ClaveUsuarioPrueba> = {
  "mesa-partes": "mesaPartes",
  coordinacion: "coordinacion",
  docente: "docente",
  bienestar: "bienestar",
};

async function sembrarPruebasAutomaticas(): Promise<Actores> {
  console.log("Personal de prueba (*@efsrt.test)…");
  const ids = {} as Record<ClaveUsuarioPrueba, PersonalHabilitado>;
  for (const clave of ["mesaPartes", "coordinacion", "coordinacionAjena", "docente", "docenteAjeno", "bienestar"] as const) {
    const { correo, nombre, rol } = USUARIOS_PRUEBA[clave];
    const { carrera }: UsuarioPrueba = USUARIOS_PRUEBA[clave];
    await habilitarPersonal(correo, nombre, rol, carrera);
    await asegurarUsuarioPrueba(clave);
    ids[clave] = await habilitarPersonal(correo, nombre, rol, carrera); // enlaza la cuenta recién creada
  }
  const cuenta = (clave: ClaveUsuarioPrueba) => {
    const { usuarioId } = ids[clave];
    if (!usuarioId) throw new Error(`Sin cuenta enlazada: ${clave}`);
    return usuarioId;
  };
  const actores: Actores = {
    cuentas: {
      "mesa-partes": cuenta("mesaPartes"),
      coordinacion: cuenta("coordinacion"),
      docente: cuenta("docente"),
      bienestar: cuenta("bienestar"),
    },
    docentePersonalId: ids.docente.personalId,
  };

  console.log("Estudiantes de prueba…");
  for (const clave of ["estudiante", "estudianteAjeno"] as const) {
    const datos = ESTUDIANTES_PRUEBA[clave];
    const estudianteId = await asegurarEstudiante({
      ...datos,
      carrera: CARRERA,
      correo_institucional: null,
      correo_personal: USUARIOS_PRUEBA[clave].correo,
    });
    await enlazarEstudiante(estudianteId, await asegurarUsuarioPrueba(clave), `${datos.nombres} ${datos.apellidos}`);
    // Mismo recorrido que Giancarlos (I conforme, II observado); la ajena, el I
    // conforme y el II en 05, por asignar (para las pruebas de seguridad).
    const expedientes = clave === "estudiante" ? EXPEDIENTES_DE_PRUEBA : [EXPEDIENTES_DE_PRUEBA[0], EXPEDIENTE_POR_ASIGNAR];
    for (const expediente of expedientes) await cargarExpediente(expediente, estudianteId, actores);
  }
  return actores;
}

/** Habilita tus cuentas reales; si la del docente ya ingresó, supervisa los expedientes del video. */
async function sembrarPersonalReal(actores: Actores): Promise<Actores> {
  console.log("Personal con tus cuentas reales…");
  let delVideo = actores;
  for (const rol of Object.keys(CLAVE_DE_ROL) as RolOficina[]) {
    const correo = CUENTAS_REALES[rol];
    if (!correo) {
      console.log(`  · ${rol}: sin CUENTA_* en .env, se omite`);
      continue;
    }
    const { usuarioId, personalId } = await habilitarPersonal(correo, USUARIOS_PRUEBA[CLAVE_DE_ROL[rol]].nombre, rol);
    console.log(`  · ${rol}: habilitado${usuarioId ? " y enlazado" : " (se enlaza en su primer ingreso)"}`);
    if (rol === "docente" && usuarioId) {
      delVideo = { cuentas: { ...actores.cuentas, docente: usuarioId }, docentePersonalId: personalId };
    }
  }
  return delVideo;
}

async function sembrarDatosDelVideo(actores: Actores) {
  console.log("Giancarlos Ormeño (estudiante con cuenta institucional)…");
  const correoGiancarlos = CUENTAS_REALES.estudiante ?? `gormeno${DOMINIO_INSTITUCIONAL}`;
  const giancarlos = await asegurarEstudiante({
    tipo_documento: "DNI",
    numero_documento: "70000001",
    nombres: "Giancarlos",
    apellidos: "Ormeño",
    carrera: CARRERA,
    ...correosDe(correoGiancarlos),
  });
  await enlazarEstudiante(giancarlos, await idDeCuenta(correoGiancarlos), "Giancarlos Ormeño");
  for (const expediente of EXPEDIENTES_DE_PRUEBA) await cargarExpediente(expediente, giancarlos, actores);

  console.log("Valeria Chávez Rojas (egresada, ingresa con correo personal)…");
  const correoValeria = CUENTAS_REALES.egresada ?? "valeria.prueba@efsrt.test";
  const valeria = await asegurarEstudiante({
    tipo_documento: "CE",
    numero_documento: "001234567",
    nombres: "Valeria",
    apellidos: "Chávez Rojas",
    carrera: CARRERA,
    ...correosDe(correoValeria),
  });
  await enlazarEstudiante(valeria, await idDeCuenta(correoValeria), "Valeria Chávez Rojas");
  await cargarExpediente(EXPEDIENTES_DE_PRUEBA[0], valeria, actores);
}

async function main() {
  const actores = await sembrarPruebasAutomaticas();
  await sembrarDatosDelVideo(await sembrarPersonalReal(actores));
  console.log("Listo.");
}

await main();
