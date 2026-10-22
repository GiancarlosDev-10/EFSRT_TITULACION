// Recorrido por dependencia: una tarjeta desplegable por oficina con su
// historial. Usa <details>/<summary> nativos: accesible y sin JavaScript.
import { IconoCheck, IconoChevronAbajo, IconoExclamacion } from "@/shared";
import type { EtapaSeguimiento, SituacionEtapa } from "../application";
import { ChipCodigo } from "./ChipCodigo";
import { momento, resumenDeEtapa, textoEtapaVacia, textoSubsanado, tonoDeEvento } from "./presentacion";

const PUNTO_ETAPA: Record<SituacionEtapa, string> = {
  completada: "bg-ok text-white",
  observada: "bg-warn text-white ring-4 ring-warn-soft",
  actual: "bg-navy text-white",
  pendiente: "border-2 border-pending bg-white text-muted",
};

function PuntoEtapa({ situacion, numero }: { situacion: SituacionEtapa; numero: number }) {
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-bold ${PUNTO_ETAPA[situacion]}`}
    >
      {situacion === "completada" && <IconoCheck tamano={15} />}
      {situacion === "observada" && <IconoExclamacion tamano={15} />}
      {(situacion === "actual" || situacion === "pendiente") && numero}
    </span>
  );
}

type Props = {
  etapas: EtapaSeguimiento[];
  hayExpediente: boolean;
  /** Dependencia que se muestra desplegada al cargar. */
  abierta: EtapaSeguimiento["dependencia"] | null;
  ahora: Date;
};

export function TrackerDependencias({ etapas, hayExpediente, abierta, ahora }: Props) {
  return (
    <ol aria-label="Recorrido por dependencia" className="flex flex-col gap-2">
      {etapas.map((etapa, i) => (
        <li
          key={etapa.dependencia}
          className={`rounded-2xl bg-white ${etapa.situacion === "observada" ? "border-2 border-warn-bright" : "border border-line"}`}
        >
          <details open={etapa.dependencia === abierta} className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-2xl px-3.5 py-3 [&::-webkit-details-marker]:hidden">
              <PuntoEtapa situacion={etapa.situacion} numero={i + 1} />
              <span className="flex min-w-0 grow flex-col gap-px">
                <span className={`text-sm font-semibold ${etapa.situacion === "pendiente" ? "text-muted" : "text-ink"}`}>
                  {etapa.nombre}
                </span>
                <span className="text-xs text-muted">{resumenDeEtapa(etapa, ahora)}</span>
              </span>
              <IconoChevronAbajo tamano={18} className="shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>

            <div className="flex flex-col pr-3.5 pb-3 pl-[58px]">
              {etapa.eventos.length === 0 && (
                <p className="pt-0.5 text-xs leading-normal text-muted">{textoEtapaVacia(etapa, hayExpediente)}</p>
              )}
              {etapa.eventos.map((evento) => {
                const tono = tonoDeEvento(evento);
                const subsanado = textoSubsanado(evento, ahora);
                return (
                  <div key={evento.fecha.getTime()} className="flex flex-col gap-[3px] border-t border-line py-[9px]">
                    <div className="flex items-center gap-2">
                      <ChipCodigo codigo={evento.codigo} tono={tono} />
                      <span
                        className={`text-[13px] font-semibold ${tono === "subsanado" ? "text-muted line-through" : "text-ink"}`}
                      >
                        {evento.nombre}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-muted">
                      {momento(evento.fecha, ahora)} · {evento.actor}
                    </span>
                    {evento.docente && (
                      <span className="text-xs leading-normal text-text-soft">Docente Supervisor: {evento.docente}</span>
                    )}
                    {evento.nota && <span className="text-xs leading-normal text-text-soft">{evento.nota}</span>}
                    {subsanado && <span className="text-xs font-semibold text-ok">{subsanado}</span>}
                  </div>
                );
              })}
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}
