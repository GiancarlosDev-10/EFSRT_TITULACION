// Siembra el proyecto de DESARROLLO con los datos ficticios de los mockups.
// Uso: bun run db:sembrar   (usa SUPABASE_SECRET_KEY: solo en esta máquina)
//
// Se puede ejecutar varias veces: reutiliza usuarios, estudiantes y expedientes
// existentes. El historial no se puede borrar (D11); para empezar de cero hay
// que reiniciar la base del proyecto de desarrollo.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/shared/lib/supabase/tipos-db";
import { ubicacionDe, type Dependencia, type Expediente } from "../../src/modules/tramitacion/domain";
import { EXPEDIENTES_DE_PRUEBA } from "../../src/modules/tramitacion/infrastructure/datos-prueba";
import { USUARIOS_PRUEBA, claveUsuariosPrueba, type ClaveUsuarioPrueba } from "./usuarios-prueba";

function variable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta ${nombre} en .env`);
  return valor;
}

const admin = createClient<Database>(variable("NEXT_PUBLIC_SUPABASE_URL"), variable("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Respuestas de supabase-js: o hay `data`, o hay `error`. */
type Respuesta<T> = { data: T; error: null } | { data: unknown; error: { message: string } };

function revisar<T>(respuesta: Respuesta<T>, que: string): T {
  if (respuesta.error) throw new Error(`${que}: ${respuesta.error.message}`);
  return respuesta.data;
}

/** Crea el usuario (o lo reutiliza) y su perfil. Devuelve su id. */
async function asegurarUsuario(clave: ClaveUsuarioPrueba): Promise<string> {
  const { correo, nombre, rol } = USUARIOS_PRUEBA[clave];
  const lista = revisar(await admin.auth.admin.listUsers({ perPage: 1000 }), "listar usuarios");
  let id = lista.users.find((u) => u.email === correo)?.id;
  if (!id) {
    const creado = revisar(
      await admin.auth.admin.createUser({ email: correo, password: claveUsuariosPrueba(), email_confirm: true }),
      `crear ${correo}`,
    );
    id = creado.user.id;
  }
  revisar(await admin.from("perfiles").upsert({ id, nombre, rol }), `perfil de ${correo}`);
  return id;
}

type DatosEstudiante = Database["public"]["Tables"]["estudiantes"]["Insert"];

async function asegurarEstudiante(datos: DatosEstudiante): Promise<string> {
  const { data, error } = await admin
    .from("estudiantes")
    .upsert(datos, { onConflict: "tipo_documento,numero_documento" })
    .select("id")
    .single();
  if (error) throw new Error(`estudiante ${datos.nombres}: ${error.message}`);
  return data.id;
}

/** Carga un expediente con todo su historial, como si cada oficina lo hubiera registrado. */
async function cargarExpediente(
  expediente: Expediente,
  estudianteId: string,
  actores: Record<Dependencia, string>,
): Promise<void> {
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
  const llegoAlDocente = expediente.historial.some((r) => r.estadoNuevo === "06");

  revisar(
    await admin.from("expedientes").insert({
      id,
      estudiante_id: estudianteId,
      modulo: expediente.modulo,
      estado: apertura.estadoNuevo,
      docente_id: llegoAlDocente ? actores.docente : null,
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
        actor_id: actores[dependencia],
        // El trigger los reemplaza con los datos del perfil.
        actor_nombre: "",
        actor_dependencia: dependencia,
      }),
      `historial ${registro.estadoAnterior ?? "—"}→${registro.estadoNuevo}`,
    );
  }
  console.log(`  · Módulo ${expediente.modulo}: ${expediente.historial.length} registros, estado ${expediente.estado}`);
}

async function main() {
  console.log("Usuarios de prueba…");
  const ids = {} as Record<ClaveUsuarioPrueba, string>;
  for (const clave of Object.keys(USUARIOS_PRUEBA) as ClaveUsuarioPrueba[]) {
    ids[clave] = await asegurarUsuario(clave);
  }
  const actores: Record<Dependencia, string> = {
    "mesa-partes": ids.mesaPartes,
    coordinacion: ids.coordinacion,
    docente: ids.docente,
    bienestar: ids.bienestar,
  };

  console.log("Estudiante Giancarlos Ormeño (datos de los mockups)…");
  const giancarlos = await asegurarEstudiante({
    tipo_documento: "DNI",
    numero_documento: "70000001",
    nombres: "Giancarlos",
    apellidos: "Ormeño",
    carrera: "desarrollo-sistemas",
    correo_institucional: "gormeno@iestpgildaballivian.edu.pe",
  });
  revisar(await admin.from("estudiantes").update({ usuario_id: ids.estudiante }).eq("id", giancarlos), "enlazar cuenta");
  for (const expediente of EXPEDIENTES_DE_PRUEBA) await cargarExpediente(expediente, giancarlos, actores);

  console.log("Estudiante ajena (para probar que nadie ve expedientes de otros)…");
  const valeria = await asegurarEstudiante({
    tipo_documento: "CE",
    numero_documento: "001234567",
    nombres: "Valeria",
    apellidos: "Chávez Rojas",
    carrera: "desarrollo-sistemas",
    correo_personal: "valeria.prueba@efsrt.test",
  });
  revisar(await admin.from("estudiantes").update({ usuario_id: ids.estudianteAjeno }).eq("id", valeria), "enlazar cuenta");
  // Su Módulo I es igual al de Giancarlos (llega hasta el docente asignado).
  await cargarExpediente(EXPEDIENTES_DE_PRUEBA[0], valeria, actores);

  console.log("Listo.");
}

await main();
