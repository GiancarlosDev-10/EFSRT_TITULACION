import { BotonCerrarSesion } from "@/modules/auth";
import { Saludo } from "@/shared";

/** Saludo de las páginas del estudiante (inicio y seguimiento). En celular lleva "Salir". */
export function SaludoEstudiante({ usuario }: { usuario: { nombre: string; correo: string } }) {
  return (
    <Saludo
      nombre={usuario.nombre}
      correo={usuario.correo}
      subtitulo="Sigue el recorrido de tus expedientes de EFSRT por las oficinas del instituto."
      accionMovil={<BotonCerrarSesion />}
    />
  );
}
