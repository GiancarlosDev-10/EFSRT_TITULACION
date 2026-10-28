import { Saludo } from "@/shared";
import { CampanaDeSesion } from "../../../_campana/CampanaDeSesion";

/**
 * Saludo de las páginas del estudiante (inicio y seguimiento). La campana (D58)
 * va aquí solo en PC; en celular está en la barra superior, con "Salir".
 */
export function SaludoEstudiante({ usuario }: { usuario: { nombre: string; correo: string } }) {
  return (
    <Saludo
      nombre={usuario.nombre}
      correo={usuario.correo}
      subtitulo="Sigue el recorrido de tus expedientes de EFSRT por las oficinas del instituto."
      campana={
        <div className="hidden lg:block">
          <CampanaDeSesion />
        </div>
      }
    />
  );
}
