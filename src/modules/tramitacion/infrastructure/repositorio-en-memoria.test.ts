import { probarContratoRepositorio } from "./contrato-repositorio";
import { crearRepositorioEnMemoria } from "./repositorio-en-memoria";

// En memoria no hay sesiones: todas las dependencias comparten el mismo repositorio.
probarContratoRepositorio("en memoria", async () => {
  const repositorio = crearRepositorioEnMemoria();
  return {
    repositorioDe: () => repositorio,
    nuevoEstudiante: async () => crypto.randomUUID(),
  };
});
