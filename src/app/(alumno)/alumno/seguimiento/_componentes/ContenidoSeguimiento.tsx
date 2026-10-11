import { SeguimientoDeModulo, SeguimientoEscritorio, type Modulo } from "@/modules/tramitacion";
import { SaludoEstudiante } from "../../_componentes/SaludoEstudiante";
import { datosDelEstudiante } from "../../_datos";

/**
 * Seguimiento de un módulo: una sola dirección para celular y PC. En celular,
 * pestañas y tracker; en PC, el mismo panel del inicio (tracker y mapa).
 */
export async function ContenidoSeguimiento({ modulo }: { modulo: Modulo | null }) {
  const { usuario, seguimiento, nombresModulo, ahora } = await datosDelEstudiante();
  return (
    <>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 lg:hidden">
        <SeguimientoDeModulo seguimiento={seguimiento} modulo={modulo} nombresModulo={nombresModulo} ahora={ahora} />
      </div>
      <SeguimientoEscritorio
        seguimiento={seguimiento}
        ahora={ahora}
        encabezado={<SaludoEstudiante usuario={usuario} />}
        modulo={modulo}
      />
    </>
  );
}
