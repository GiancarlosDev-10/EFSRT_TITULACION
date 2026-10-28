// La campana de quien tiene la sesión (D58): lee sus avisos en el servidor y
// une el componente del módulo con las Server Actions. La usan el saludo del
// estudiante y el layout de las oficinas que reciben avisos.
import { Suspense } from "react";
import { CampanaNotificaciones, obtenerCampana } from "@/modules/notificaciones";
import { leerCampana, marcarCampanaLeida } from "./acciones";

type Props = { enBarra?: boolean };

async function CampanaConAvisos({ enBarra }: Props) {
  const inicial = { campana: await obtenerCampana(), ahora: new Date() };
  return <CampanaNotificaciones inicial={inicial} leer={leerCampana} marcar={marcarCampanaLeida} enBarra={enBarra} />;
}

export function CampanaDeSesion({ enBarra = false }: Props) {
  // Mientras cargan los avisos, un hueco del mismo tamaño (no mueve el encabezado).
  const hueco = (
    <div aria-hidden="true" className={`size-11 rounded-[14px] border ${enBarra ? "border-ink-line bg-ink-raised" : "border-line bg-white"}`} />
  );
  return (
    <Suspense fallback={hueco}>
      <CampanaConAvisos enBarra={enBarra} />
    </Suspense>
  );
}
