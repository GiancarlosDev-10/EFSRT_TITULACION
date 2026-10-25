// Contra el proyecto de desarrollo: solo con `bun run test:db`. Registra
// estudiantes "Prueba Directorio" en la carrera de pruebas (no se borran).
import { PRUEBAS_SUPABASE, clienteComo } from "../../../../scripts/db/clientes-prueba";
import { CARRERA_DE_PRUEBAS } from "../../../../scripts/db/usuarios-prueba";
import { probarContratoDirectorio } from "./contrato-directorio";
import { crearDirectorioSupabase } from "./directorio-supabase";

let correlativo = 0;
// Sin dígitos: con dígitos, la búsqueda sería por documento (D38).
const enLetras = (numero: string) => numero.replace(/\d/g, (d) => "abcdefghij"[Number(d)]);

probarContratoDirectorio(
  "Supabase",
  async () => ({
    directorio: crearDirectorioSupabase(await clienteComo("mesaPartes")),
    datosNuevos: () => {
      const marca = `${Date.now()}${++correlativo}`.slice(-7);
      return {
        tipoDocumento: "DNI",
        numeroDocumento: `8${marca}`,
        nombres: "Prueba",
        apellidos: `Directorio ${enLetras(marca)}`,
        carrera: CARRERA_DE_PRUEBAS,
        correoInstitucional: null,
        correoPersonal: `directorio-${marca}@efsrt.test`,
      };
    },
  }),
  { omitir: !PRUEBAS_SUPABASE },
);
