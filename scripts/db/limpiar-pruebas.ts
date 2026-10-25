// Borra los estudiantes que crean las pruebas automáticas (en la carrera de
// pruebas y sin cuenta) con sus expedientes, historial y avisos (D57).
// Solo en el proyecto de desarrollo. `test:db` lo ejecuta al terminar.
// Uso: bun run db:limpiar-pruebas
import { clienteAdmin } from "./clientes-prueba";

const { data, error } = await clienteAdmin().rpc("limpiar_datos_de_prueba");
if (error) {
  console.error(`No se pudo limpiar: ${error.message}`);
  process.exit(1);
}
console.log(`Datos de las pruebas automáticas: ${data} estudiante(s) borrados con sus expedientes.`);
