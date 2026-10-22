// Contra el proyecto de desarrollo de Supabase: solo con `bun run test:db`.
// Cada ejecución registra estudiantes "Prueba Automática" nuevos (el historial
// no se puede borrar, D11); son datos del proyecto de desarrollo, no de producción.
import type { Dependencia } from "../domain";
import { PRUEBAS_SUPABASE, clienteAdmin, clienteComo } from "../../../../scripts/db/clientes-prueba";
import { CARRERA_DE_PRUEBAS, DOCENTES_CONTRATO } from "../../../../scripts/db/usuarios-prueba";
import { probarContratoRepositorio } from "./contrato-repositorio";
import { crearRepositorioSupabase } from "./repositorio-supabase";

const USUARIO_DE: Record<Dependencia, "mesaPartes" | "coordinacion" | "docente" | "bienestar"> = {
  "mesa-partes": "mesaPartes",
  coordinacion: "coordinacion",
  docente: "docente",
  bienestar: "bienestar",
};

let correlativo = 0;

probarContratoRepositorio(
  "Supabase",
  async () => {
    const dependencias = Object.keys(USUARIO_DE) as Dependencia[];
    const clientes = await Promise.all(dependencias.map((d) => clienteComo(USUARIO_DE[d])));
    const repositorios = new Map(dependencias.map((d, i) => [d, crearRepositorioSupabase(clientes[i])]));
    const mesa = await clienteComo("mesaPartes");
    // Docentes sin cuenta, solo para este contrato (los habilita db:sembrar).
    const correos = DOCENTES_CONTRATO.map((d) => d.correo);
    const { data: personal, error: errorPersonal } = await clienteAdmin().from("personal").select("id, nombre, correo").in("correo", correos);
    if (errorPersonal) throw new Error(errorPersonal.message);
    const docente = (correo: string) => {
      const fila = personal.find((p) => p.correo === correo);
      if (!fila) throw new Error(`Falta ${correo} en personal. ¿Corriste bun run db:sembrar?`);
      return { id: fila.id, nombre: fila.nombre };
    };

    return {
      repositorioDe: (dependencia) => repositorios.get(dependencia)!,
      docentes: [docente(correos[0]), docente(correos[1])],
      // Mesa de Partes registra al estudiante, como al recibir la carpeta.
      async nuevoEstudiante() {
        const marca = `${Date.now()}${++correlativo}`;
        const { data, error } = await mesa
          .from("estudiantes")
          .insert({
            tipo_documento: "DNI",
            numero_documento: `9${marca.slice(-7)}`,
            nombres: "Prueba",
            apellidos: `Automática ${marca}`,
            carrera: CARRERA_DE_PRUEBAS,
            correo_personal: `prueba-${marca}@efsrt.test`,
          })
          .select("id")
          .single();
        if (error) throw new Error(`No se pudo registrar el estudiante de prueba: ${error.message}`);
        return data.id;
      },
    };
  },
  { omitir: !PRUEBAS_SUPABASE },
);
