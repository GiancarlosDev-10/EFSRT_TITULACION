// Vista previa ilustrativa para la pantalla de ingreso (PC). Usa la tarjeta de
// ubicación real con datos de ejemplo del catálogo: si cambia el diseño, cambia sola.
import { IconoCorreo } from "@/shared";
import { DEPENDENCIAS, ESTADOS, ORDEN_DEPENDENCIAS } from "../domain";
import { TarjetaUbicacion } from "./TarjetaUbicacion";

const EJEMPLO = "05" as const;

export function VistaPreviaSeguimiento() {
  const actual = ESTADOS[EJEMPLO].dependencia;
  const posicion = ORDEN_DEPENDENCIAS.indexOf(actual);
  return (
    <div aria-hidden="true" className="flex w-full max-w-sm flex-col gap-3">
      <TarjetaUbicacion
        ubicacion={{
          rotulo: "Tu expediente está en",
          lugar: DEPENDENCIAS[actual].nombre,
          pildora: `${EJEMPLO} · ${ESTADOS[EJEMPLO].nombre}`,
          desde: "Desde hoy, 10:15",
          tono: "en-curso",
        }}
        pasos={ORDEN_DEPENDENCIAS.map((dependencia, i) => ({
          nombre: DEPENDENCIAS[dependencia].nombreCorto,
          situacion: i < posicion ? "completada" : i === posicion ? "actual" : "pendiente",
          actual: i === posicion,
        }))}
      />
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-xl shadow-ink/30">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-tint text-navy">
          <IconoCorreo tamano={20} />
        </span>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-ink">Tu carpeta pasó a {DEPENDENCIAS[actual].nombreCorto}</span>
          <span className="font-mono text-[11px] text-muted">Correo enviado · hace 5 min</span>
        </div>
      </div>
    </div>
  );
}
