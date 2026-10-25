import { probarContratoDirectorio } from "./contrato-directorio";
import { crearDirectorioEnMemoria } from "./directorio-en-memoria";

let correlativo = 0;
// Sin dígitos: con dígitos, la búsqueda sería por documento (D38).
const enLetras = (numero: string) => numero.replace(/\d/g, (d) => "abcdefghij"[Number(d)]);

probarContratoDirectorio("en memoria", async () => ({
  directorio: crearDirectorioEnMemoria(),
  datosNuevos: () => {
    const n = String(++correlativo).padStart(7, "0");
    return {
      tipoDocumento: "DNI",
      numeroDocumento: `9${n}`,
      nombres: "Prueba",
      apellidos: `Directorio ${enLetras(n)}`,
      carrera: "pruebas-automaticas",
      correoInstitucional: null,
      correoPersonal: `directorio-${n}@efsrt.test`,
    };
  },
}));
