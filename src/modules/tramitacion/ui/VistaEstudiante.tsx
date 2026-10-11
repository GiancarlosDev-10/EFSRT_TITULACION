// Composiciones de /alumno (D26): el mismo seguimiento se muestra como
// tarjetas en celular y como panel con tracker y mapa en PC.
import type { ReactNode } from "react";
import type { Modulo } from "../domain";
import type { SeguimientoModulo } from "../application";
import { AvisoObservacion } from "./AvisoObservacion";
import { MapaRecorrido } from "./MapaRecorrido";
import { PanelSeguimiento } from "./PanelSeguimiento";
import {
  avisosDeObservacion,
  etapaInicial,
  etapasDe,
  etiquetaDeModulo,
  moduloInicial,
  resumenDeEtapa,
  tonoDeExpediente,
  ubicacionDeModulo,
  ultimosMovimientos,
} from "./presentacion";
import { TarjetaModulo } from "./TarjetaModulo";
import { TarjetaUbicacion } from "./TarjetaUbicacion";
import { TrackerDependencias } from "./TrackerDependencias";
import { UltimosMovimientos } from "./UltimosMovimientos";

type Props = { seguimiento: SeguimientoModulo[]; ahora: Date };

/** Un aviso por cada módulo con una observación vigente. */
export function AvisosDeObservacion({ seguimiento, ahora }: Props) {
  return avisosDeObservacion(seguimiento, ahora).map((aviso) => (
    <AvisoObservacion key={aviso.expedienteId} aviso={aviso} />
  ));
}

/** Celular: tarjetas por módulo y últimos movimientos. */
export function SeguimientoMovil({ seguimiento, ahora }: Props) {
  return (
    <div className="flex flex-col gap-5 lg:hidden">
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[17px] font-extrabold">Mis expedientes</h2>
        {seguimiento.map((modulo) => (
          <TarjetaModulo key={modulo.modulo} seguimiento={modulo} ahora={ahora} />
        ))}
      </section>
      <UltimosMovimientos movimientos={ultimosMovimientos(seguimiento, ahora)} />
    </div>
  );
}

/** PC: selector de módulo, tarjeta de ubicación, tracker y mapa. */
export function SeguimientoEscritorio({ seguimiento, ahora }: Props) {
  const paneles = Object.fromEntries(
    seguimiento.map((modulo) => {
      const { expediente } = modulo;
      const etapas = etapasDe(expediente);
      const posicion = expediente ? etapas.findIndex((e) => e.dependencia === expediente.ubicacion.dependencia) : null;
      return [
        modulo.modulo,
        {
          columna: (
            <>
              <TarjetaUbicacion ubicacion={ubicacionDeModulo(modulo, ahora)} />
              <TrackerDependencias
                etapas={etapas}
                hayExpediente={expediente !== null}
                abierta={etapaInicial(expediente)}
                ahora={ahora}
              />
            </>
          ),
          mapa: (
            <MapaRecorrido
              etapas={etapas.map((etapa) => ({
                nombre: etapa.nombre,
                situacion: etapa.situacion,
                resumen: resumenDeEtapa(etapa, ahora),
              }))}
              tono={tonoDeExpediente(expediente)}
              posicion={posicion}
            />
          ),
        },
      ];
    }),
  ) as Record<Modulo, { columna: ReactNode; mapa: ReactNode }>;

  return (
    <div className="hidden lg:block">
      <PanelSeguimiento
        opciones={seguimiento.map((modulo) => ({
          modulo: modulo.modulo,
          etiqueta: etiquetaDeModulo(modulo),
          tono: tonoDeExpediente(modulo.expediente),
        }))}
        inicial={moduloInicial(seguimiento)}
        paneles={paneles}
      />
    </div>
  );
}
