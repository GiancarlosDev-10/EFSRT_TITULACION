// Cómo iniciar el trámite (mockup Requisitos.dc.html). Página informativa:
// el trámite empieza en físico y el seguimiento, al recibir Mesa de Partes la carpeta.
import type { ReactNode } from "react";
import { EncabezadoPagina, TituloSeccion } from "@/shared";
import { DEPENDENCIAS, ORDEN_DEPENDENCIAS } from "../domain";
import { INSTITUCION } from "./contenido";
import { ListaDocumentos } from "./ListaDocumentos";
import { RUTAS_ALUMNO } from "./rutas";

type PropsPaso = {
  numero: number;
  titulo: string;
  /** Etiqueta destacada al pie del paso. */
  etiqueta?: { texto: string; tono: "neutro" | "inicio" };
  children: ReactNode;
};

function Paso({ numero, titulo, etiqueta, children }: PropsPaso) {
  return (
    <li className="flex gap-3 rounded-[20px] border border-line bg-white p-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">
        {numero}
      </span>
      <div className="flex min-w-0 grow flex-col gap-2">
        <span className="pt-1 text-[15px] font-semibold">{titulo}</span>
        {children}
        {etiqueta && (
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              etiqueta.tono === "inicio" ? "bg-navy text-white" : "bg-neutral-bg text-text-soft"
            }`}
          >
            {etiqueta.texto}
          </span>
        )}
      </div>
    </li>
  );
}

export function VistaRequisitos() {
  const { montoPorModulo, mesaPartes, documentos } = INSTITUCION;
  return (
    <>
      <EncabezadoPagina volverA={RUTAS_ALUMNO.inicio} etiquetaVolver="Volver al inicio" titulo="Cómo iniciar mi trámite" />
      <p className="px-1 text-[13px] leading-relaxed text-text-soft">
        El trámite se hace en físico. El sistema empieza a seguir tu expediente apenas Mesa de Partes recibe tu carpeta.
      </p>

      {/* En PC, dos columnas: pasos 1 y 2 | paso 3, el recorrido y el horario. */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <ol className="flex flex-col gap-3">
          <Paso numero={1} titulo="Paga el derecho de constancia" etiqueta={{ texto: "Este paso no se registra en el sistema", tono: "neutro" }}>
            <span className="text-[13px] leading-relaxed text-text-soft">
              <b className="font-semibold text-ink">S/ {montoPorModulo} por módulo</b> en el banco o agente autorizado. Luego
              canjea tu voucher en <b className="font-semibold text-ink">Tesorería</b>.
            </span>
          </Paso>
          <Paso numero={2} titulo="Arma tu carpeta física">
            <span className="text-[13px] leading-relaxed text-text-soft">
              Marca lo que ya tienes. Esta lista es solo una guía para ti y se guarda en este dispositivo.
            </span>
            <ListaDocumentos documentos={documentos} />
          </Paso>
        </ol>
        <div className="flex flex-col gap-4">
          <ol start={3} className="flex flex-col gap-3">
            <Paso numero={3} titulo="Entrégala en Mesa de Partes" etiqueta={{ texto: "Aquí empieza el seguimiento", tono: "inicio" }}>
              <span className="text-[13px] leading-relaxed text-text-soft">
                Al recibirla, Mesa de Partes abre tu expediente en el sistema. Te llegará un correo y desde ese momento podrás
                seguirlo aquí.
              </span>
            </Paso>
          </ol>
          <section className="flex flex-col gap-3">
            <TituloSeccion>El recorrido de tu carpeta</TituloSeccion>
            <ol className="flex flex-col gap-2.5 rounded-[20px] bg-ink p-4 text-white">
              {ORDEN_DEPENDENCIAS.map((dependencia, i) => (
                <li key={dependencia} className="flex items-center gap-3 text-[13px]">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-active font-display text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <span>
                    <b className="font-semibold">{DEPENDENCIAS[dependencia].nombreCorto}</b>
                    <span className="text-on-ink"> · {DEPENDENCIAS[dependencia].funcion}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <p className="rounded-[14px] bg-navy-tint px-3.5 py-3 text-xs leading-relaxed text-navy-hover">
            {/* Sin punto tras el horario: la abreviatura "p. m." ya lo lleva. */}
            Horario de Mesa de Partes: <b>{mesaPartes.horario}</b> Si tramitas varios módulos a la vez, puedes pagarlos en un
            solo voucher: S/ {montoPorModulo} por cada módulo (por ejemplo, S/ {montoPorModulo * 2} por dos).
          </p>
        </div>
      </div>
    </>
  );
}
