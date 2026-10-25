// Recepción, paso 1 (mockup Oficinas.html): buscar al estudiante por documento
// o nombre. La búsqueda viaja en la URL (?q=…): funciona sin JavaScript.
import Link from "next/link";
import { Avatar, IconoBuscar, IconoCheck, IconoChevronDerecha } from "@/shared";
import { MODULOS } from "../domain";
import { nombreCompleto, type CandidatoRecepcion } from "../application";
import { ChipCodigo } from "./ChipCodigo";
import { tonoDeEstado } from "./presentacion-oficina";
import { RUTAS_RECEPCION } from "./rutas";

/** "1 Estudiante — 2 Módulo": en qué paso de la recepción se está. */
export function PasosRecepcion({ actual }: { actual: 1 | 2 }) {
  const pasos = ["Estudiante", "Módulo"];
  return (
    <ol aria-label="Pasos de la recepción" className="flex items-center gap-2 text-[13px]">
      {pasos.map((paso, i) => {
        const numero = i + 1;
        const hecho = numero < actual;
        return (
          <li key={paso} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="h-px w-8 bg-line" />}
            <span
              aria-current={numero === actual ? "step" : undefined}
              className={`flex items-center gap-2 ${numero <= actual ? "font-semibold text-ink" : "text-muted"}`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  hecho ? "bg-ok text-white" : numero === actual ? "bg-navy text-white" : "border-2 border-pending"
                }`}
              >
                {hecho ? <IconoCheck tamano={12} /> : numero}
              </span>
              {paso}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** "I · 10" o "II · libre": lo que el estudiante tiene en cada módulo. */
export function ChipsModulos({ modulos }: { modulos: CandidatoRecepcion["modulos"] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {MODULOS.map((modulo) => {
        const expediente = modulos[modulo];
        return expediente ? (
          <span key={modulo} className="flex items-center gap-1 font-mono text-[10px] text-muted">
            {modulo} ·
            <ChipCodigo codigo={expediente.estado} tono={tonoDeEstado(expediente.estado)} />
          </span>
        ) : (
          <span key={modulo} className="rounded-md border border-dashed border-pending px-1.5 py-0.5 font-mono text-[10px] text-muted">
            {modulo} · libre
          </span>
        );
      })}
    </span>
  );
}

type Props = { consulta: string; candidatos: CandidatoRecepcion[] };

export function RecepcionBuscar({ consulta, candidatos }: Props) {
  const buscado = consulta.trim().length >= 2;
  return (
    <section className="rounded-2xl border border-line bg-white">
      <div className="flex flex-col gap-4 p-5">
        <form role="search" action={RUTAS_RECEPCION.buscar} className="flex flex-col gap-1.5">
          <label htmlFor="buscar-recepcion" className="text-[13px] font-semibold">
            Busca al estudiante
          </label>
          <span className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 text-muted">
              <IconoBuscar tamano={18} />
            </span>
            <input
              id="buscar-recepcion"
              type="search"
              name="q"
              defaultValue={consulta}
              enterKeyHint="search"
              autoFocus
              placeholder="DNI, carné de extranjería o nombre"
              className="min-h-11 w-full rounded-xl border border-line bg-white pr-3.5 pl-10 text-sm placeholder:text-muted/70 focus:border-navy"
            />
          </span>
          <span className="text-xs text-muted">Con números busca por documento; con letras, por nombres y apellidos.</span>
        </form>

        {buscado && (
          <ul className="flex flex-col gap-2" aria-label="Resultados">
            {candidatos.length === 0 && (
              <li className="rounded-xl bg-bg px-4 py-5 text-center text-[13px] text-muted">
                Ningún estudiante coincide. Revisa el número o búscalo por nombre.
              </li>
            )}
            {candidatos.map(({ estudiante, modulos }) => {
              const nombre = nombreCompleto(estudiante);
              return (
                <li key={estudiante.id}>
                  <Link
                    href={RUTAS_RECEPCION.modulo(estudiante.id)}
                    className="flex items-center gap-3 rounded-xl border border-line p-3.5 hover:bg-bg"
                  >
                    <Avatar nombre={nombre} className="size-10 text-sm" />
                    <span className="flex min-w-0 grow flex-col gap-1">
                      <span className="truncate text-sm font-semibold">{nombre}</span>
                      <span className="font-mono text-[11px] text-muted">
                        {estudiante.tipoDocumento} {estudiante.numeroDocumento}
                      </span>
                      <ChipsModulos modulos={modulos} />
                    </span>
                    <IconoChevronDerecha tamano={18} className="shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex flex-col items-start gap-1 border-t border-line p-5">
        <span className="text-[13px] text-muted">¿Es su primera carpeta y no aparece?</span>
        <Link
          href={RUTAS_RECEPCION.estudianteNuevo}
          className="-mx-2 flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-navy hover:bg-navy-tint"
        >
          Registrar estudiante nuevo
        </Link>
      </div>
    </section>
  );
}
