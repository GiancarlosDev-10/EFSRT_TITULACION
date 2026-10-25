// Detalle de un expediente para una oficina (mockup Oficinas.html): ficha del
// estudiante, panel de acción e historial. En PC el panel va a la derecha y
// queda fijo al desplazarse; en celular va entre la ficha y el historial.
import type { ReactNode } from "react";
import { Avatar, EncabezadoPagina, IconoAlerta, IconoCambiar, IconoCheck, capitalizar } from "@/shared";
import { ESTADOS, esFinal, pasaA, ubicacionDe, type CodigoEstado, type Dependencia } from "../domain";
import { nombreCompleto, type ExpedienteDeOficina, type MovimientoDeOficina } from "../application";
import { ChipCodigo } from "./ChipCodigo";
import { CorreoPartible } from "./CorreoPartible";
import { DatoFicha } from "./DatoFicha";
import { nombreDeCarrera, nombresDeModulos } from "./contenido";
import { PildoraEstado } from "./PildoraEstado";
import { momento, type TonoEvento } from "./presentacion";
import { nombreBreve, situacionDelExpediente, textoDePildora, tonoDeEstado, tonoDePildora } from "./presentacion-oficina";
import { RUTAS_OFICINA } from "./rutas";

type Props = {
  expediente: ExpedienteDeOficina;
  dependencia: Dependencia;
  ahora: Date;
  /** Estado recién registrado (para el aviso de éxito); `null` si no hay aviso. */
  registrado: CodigoEstado | null;
  /** Se acaba de cambiar al Docente Supervisor (para el aviso de éxito). */
  docenteCambiado: boolean;
  /** Formulario de acción (componente de cliente con su Server Action). */
  panel: ReactNode;
  /** Docente con "Cambiar" y su diálogo (solo si esta oficina puede cambiarlo ahora); si no, la ficha lo muestra sin botón. */
  cambioDocente?: ReactNode;
};

export function DetalleExpedienteOficina({
  expediente,
  dependencia,
  ahora,
  registrado,
  docenteCambiado,
  panel,
  cambioDocente,
}: Props) {
  const ubicacion = esFinal(expediente.estado) ? "Trámite terminado" : capitalizar(situacionDelExpediente(expediente.estado));
  return (
    <>
      <EncabezadoPagina
        volverA={RUTAS_OFICINA.bandeja(dependencia)}
        etiquetaVolver="Volver a la bandeja"
        titulo={`Expediente del Módulo ${expediente.modulo}`}
        subtitulo={ubicacion}
      />

      {registrado && (
        <AvisoExito titulo={`Registraste ${registrado} · ${nombreBreve(registrado)}`}>
          {expediente.estudiante.nombres.split(" ")[0]} ya lo ve en su seguimiento.
        </AvisoExito>
      )}
      {docenteCambiado && expediente.docente && (
        <AvisoExito titulo="Cambiaste al Docente Supervisor">
          Ahora supervisa {expediente.docente.nombre}. El cambio quedó en el historial.
        </AvisoExito>
      )}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-6">
        <div className="lg:col-start-1 lg:row-start-1">
          <FichaEstudiante expediente={expediente} cambioDocente={cambioDocente} />
        </div>
        <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <section aria-label="Registrar un cambio" className="rounded-2xl border border-line bg-white">
            <div className="flex flex-col gap-1 border-b border-line p-5">
              <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">Estado actual</span>
              <span className="flex items-start gap-2">
                <ChipCodigo codigo={expediente.estado} tono={tonoDeEstado(expediente.estado)} />
                <b className="text-sm leading-snug">{ESTADOS[expediente.estado].nombre}</b>
              </span>
            </div>
            {expediente.acciones.length > 0 ? panel : <SinAcciones expediente={expediente} dependencia={dependencia} />}
          </section>
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <Historial movimientos={expediente.movimientos} ahora={ahora} />
        </div>
      </div>
    </>
  );
}

function AvisoExito({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    // Ancho de su texto, no de la pantalla.
    <div role="status" className="flex w-fit max-w-full items-start gap-3 rounded-2xl border border-ok/30 bg-ok-bg py-3 pr-5 pl-4 text-ok">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ok text-white">
        <IconoCheck tamano={14} />
      </span>
      <div className="flex flex-col gap-0.5">
        <b className="text-sm">{titulo}</b>
        <span className="text-[13px] text-ink">{children}</span>
      </div>
    </div>
  );
}

function SinAcciones({ expediente, dependencia }: { expediente: ExpedienteDeOficina; dependencia: Dependencia }) {
  const final = esFinal(expediente.estado);
  // La oficina que acaba de derivarlo (p. ej. Mesa de Partes en 03) ya hizo su parte.
  const yaDerivo = pasaA(expediente.estado) !== null && ubicacionDe(expediente.estado) === dependencia;
  return (
    <div className="flex flex-col gap-2 p-5">
      <b className="text-sm">{final ? "Trámite terminado" : "Sin acciones para tu oficina"}</b>
      <span className="text-[13px] leading-normal text-muted">
        {final ? (
          "La constancia está lista para que el estudiante la recoja."
        ) : expediente.docenteDesactivado ? (
          <>
            El Docente Supervisor fue desactivado. Usa <b>Cambiar</b> en la ficha para asignar a otro y que la
            supervisión continúe.
          </>
        ) : (
          `El expediente ${situacionDelExpediente(expediente.estado)}. ${
            yaDerivo ? "Tu oficina ya registró su parte." : "Podrás registrar algo cuando llegue a tu oficina."
          }`
        )}
      </span>
    </div>
  );
}

function FichaEstudiante({ expediente, cambioDocente }: { expediente: ExpedienteDeOficina; cambioDocente?: ReactNode }) {
  const { estudiante, modulo, estado, docente, docenteDesactivado } = expediente;
  const nombre = nombreCompleto(estudiante);
  const nombreModulo = nombresDeModulos(estudiante.carrera)?.[modulo];
  return (
    <section aria-label="Datos del estudiante" className="rounded-2xl border border-line bg-white">
      <div className="flex items-center gap-3 border-b border-line p-5">
        <Avatar nombre={nombre} className="size-12 text-base" />
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="font-display text-lg leading-tight font-extrabold">{nombre}</span>
          <span className="font-mono text-xs text-muted">
            {estudiante.tipoDocumento} {estudiante.numeroDocumento}
          </span>
        </span>
        <PildoraEstado texto={textoDePildora(estado)} tono={tonoDePildora(estado)} />
      </div>
      <dl className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        <DatoFicha etiqueta="Carrera">{nombreDeCarrera(estudiante.carrera)}</DatoFicha>
        <DatoFicha etiqueta="Módulo">{nombreModulo ? `Módulo ${modulo} · ${nombreModulo}` : `Módulo ${modulo}`}</DatoFicha>
        {/* Al menos uno de los dos correos existe (D52); el que falta no se muestra. */}
        {estudiante.correoInstitucional && (
          <DatoFicha etiqueta="Correo institucional" mono>
            <CorreoPartible correo={estudiante.correoInstitucional} />
          </DatoFicha>
        )}
        {estudiante.correoPersonal && (
          <DatoFicha etiqueta="Correo personal" mono>
            <CorreoPartible correo={estudiante.correoPersonal} />
          </DatoFicha>
        )}
        <DatoFicha etiqueta="Docente Supervisor">
          {cambioDocente ||
            (docente && (
              <>
                {docente.nombre}
                {docenteDesactivado && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-warn-bg px-1.5 py-0.5 text-[11px] font-semibold text-warn-text">
                    <IconoAlerta tamano={13} />
                    Desactivado
                  </span>
                )}
              </>
            ))}
        </DatoFicha>
      </dl>
    </section>
  );
}

const TONO_OBSERVACION: Record<"vigente" | "subsanada", TonoEvento> = { vigente: "observado", subsanada: "subsanado" };

function Historial({ movimientos, ahora }: { movimientos: MovimientoDeOficina[]; ahora: Date }) {
  return (
    <section aria-labelledby="titulo-historial" className="rounded-2xl border border-line bg-white">
      <div className="flex items-baseline justify-between gap-2 border-b border-line px-5 py-4">
        <h2 id="titulo-historial" className="font-display text-base font-extrabold">
          Historial
        </h2>
        <span className="text-[11px] text-muted">Lo más reciente primero</span>
      </div>
      <ol className="divide-y divide-line px-5">
        {movimientos.map((movimiento, i) => (
          <li key={i} className="flex gap-3 py-3">
            {movimiento.tipo === "estado" ? (
              <MovimientoDeEstado movimiento={movimiento} ahora={ahora} />
            ) : (
              <>
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-navy-tint text-navy">
                  <IconoCambiar tamano={13} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <b className="text-[13px]">Docente Supervisor cambiado</b>
                  <span className="text-[13px] text-text-soft">
                    {movimiento.anterior} → {movimiento.nuevo}
                  </span>
                  <span className="font-mono text-[11px] text-muted">
                    {momento(movimiento.fecha, ahora)} · {movimiento.actor}
                  </span>
                  <span className="text-xs leading-normal text-text-soft">{movimiento.motivo}</span>
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function MovimientoDeEstado({
  movimiento,
  ahora,
}: {
  movimiento: Extract<MovimientoDeOficina, { tipo: "estado" }>;
  ahora: Date;
}) {
  const tono = movimiento.observacion ? TONO_OBSERVACION[movimiento.observacion] : tonoDeEstado(movimiento.codigo);
  return (
    <>
      <span className="mt-0.5 w-6 shrink-0">
        <ChipCodigo codigo={movimiento.codigo} tono={tono} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <b className={`text-[13px] ${tono === "subsanado" ? "text-muted line-through" : ""}`}>{ESTADOS[movimiento.codigo].nombre}</b>
        <span className="font-mono text-[11px] text-muted">
          {momento(movimiento.fecha, ahora)} · {movimiento.actor}
        </span>
        {movimiento.docente && <span className="text-xs text-text-soft">Docente Supervisor: {movimiento.docente}</span>}
        {movimiento.nota && <span className="text-xs leading-normal text-text-soft">{movimiento.nota}</span>}
      </span>
    </>
  );
}
