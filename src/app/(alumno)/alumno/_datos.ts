import { redirect } from "next/navigation";
import { cache } from "react";
import { RUTAS_AUTH, exigirRol } from "@/modules/auth";
import { nombresDeModulos, obtenerEstudianteDeUsuario, obtenerSeguimientoDelEstudiante } from "@/modules/tramitacion";

/**
 * Lo que necesitan todas las páginas del estudiante con datos personales. Exige
 * el rol en cada página (el layout no basta, D46). La identidad sale de la
 * sesión, nunca de la URL: los parámetros de la URL solo eligen entre sus datos.
 */
export const datosDelEstudiante = cache(async () => {
  const usuario = await exigirRol("estudiante");
  const estudiante = await obtenerEstudianteDeUsuario(usuario.id);
  // Perfil de estudiante sin fila enlazada: no debería ocurrir (la base los crea juntos).
  if (!estudiante) redirect(RUTAS_AUTH.cuentaNoHabilitada);

  const seguimiento = await obtenerSeguimientoDelEstudiante(estudiante.id);
  return {
    usuario: { nombre: estudiante.nombre, correo: usuario.correo },
    seguimiento,
    nombresModulo: nombresDeModulos(estudiante.carrera),
    ahora: new Date(),
  };
});
