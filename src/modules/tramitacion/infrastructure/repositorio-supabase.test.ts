// Contra el proyecto de desarrollo de Supabase: solo con `bun run test:db`.
// Cada ejecución registra estudiantes "Prueba Automática" nuevos (el historial
// no se puede borrar, D11); son datos del proyecto de desarrollo, no de producción.
import type { Dependencia } from "../domain";
import { PRUEBAS_SUPABASE, clienteComo } from "../../../../scripts/db/clientes-prueba";
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

    return {
      repositorioDe: (dependencia) => repositorios.get(dependencia)!,
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
            carrera: "desarrollo-sistemas",
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
