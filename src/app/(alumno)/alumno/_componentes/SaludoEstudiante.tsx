import type { UsuarioActual } from "@/modules/auth";
import { Saludo } from "@/shared";

/** Saludo de las páginas del estudiante (inicio y seguimiento). */
export function SaludoEstudiante({ usuario }: { usuario: UsuarioActual }) {
  return (
    <Saludo
      nombre={usuario.nombre}
      correo={usuario.correo}
      subtitulo="Sigue el recorrido de tus expedientes de EFSRT por las oficinas del instituto."
    />
  );
}
