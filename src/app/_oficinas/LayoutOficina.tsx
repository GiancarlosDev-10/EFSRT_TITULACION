// Layout de las cuatro oficinas: barra lateral en PC y barra superior oscura en
// celular. No decide el acceso: cada página exige su rol (D46). Mesa de
// Partes suma "Registrar recepción" (D52). La campana (D58) va en la barra
// superior en celular y arriba a la derecha en PC, salvo en Mesa de Partes.
import { Suspense, type ReactNode } from "react";
import { BotonCerrarSesion, obtenerUsuarioActual } from "@/modules/auth";
import {
  CODIGOS_ESTADO,
  DEPENDENCIAS,
  ESTADO_INICIAL,
  RUTAS_OFICINA,
  RUTAS_RECEPCION,
  pasaA,
  puedeRegistrar,
  type Dependencia,
} from "@/modules/tramitacion";
import { Avatar, BarraLateral, BarraSuperior, IconoBandeja, IconoCarpeta, NavegacionLateral, type ItemNavegacion } from "@/shared";
import { CampanaDeSesion } from "../_campana/CampanaDeSesion";

type Props = { dependencia: Dependencia; children: ReactNode };

/**
 * D58: tiene campana la oficina a la que "pasa" algún estado (Coordinación con
 * el 03, el docente con el 06, Bienestar con el 09). A Mesa de Partes no le
 * llega nada de otra oficina.
 */
const recibeAvisos = (dependencia: Dependencia) => CODIGOS_ESTADO.some((codigo) => pasaA(codigo) === dependencia);

function navegacion(dependencia: Dependencia): ItemNavegacion[] {
  const bandeja: ItemNavegacion = { href: RUTAS_OFICINA.bandeja(dependencia), etiqueta: "Bandeja", icono: <IconoBandeja /> };
  // Quien abre los expedientes (estado inicial) recibe las carpetas. La recepción
  // cuelga de la misma ruta: "Bandeja" se marca solo en la suya, no en la recepción.
  if (!puedeRegistrar(dependencia, ESTADO_INICIAL)) return [bandeja];
  return [
    { ...bandeja, exacto: true },
    { href: RUTAS_RECEPCION.buscar, etiqueta: "Registrar recepción", icono: <IconoCarpeta /> },
  ];
}

async function TarjetaUsuario({ dependencia }: { dependencia: Dependencia }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-ink-raised p-3 group-data-[contraida=true]/barra:justify-center group-data-[contraida=true]/barra:p-1.5">
      <Avatar nombre={usuario.nombre} variante="claro" className="size-[38px] text-[13px]" />
      <div className="flex min-w-0 flex-col gap-px group-data-[contraida=true]/barra:sr-only">
        <span className="truncate text-[13px] font-semibold">{usuario.nombre}</span>
        <span className="truncate text-[11px] text-on-ink-muted">{DEPENDENCIAS[dependencia].nombre}</span>
      </div>
      <div className="ml-auto shrink-0 group-data-[contraida=true]/barra:hidden">
        <BotonCerrarSesion variante="barra" />
      </div>
    </div>
  );
}

export function LayoutOficina({ dependencia, children }: Props) {
  const campana = recibeAvisos(dependencia);
  return (
    <div className="flex min-h-dvh">
      <BarraLateral
        pie={
          <Suspense fallback={<div className="h-[62px] rounded-[14px] bg-ink-raised" />}>
            <TarjetaUsuario dependencia={dependencia} />
          </Suspense>
        }
      >
        <NavegacionLateral items={navegacion(dependencia)} />
      </BarraLateral>
      <div className="flex min-w-0 grow flex-col">
        <BarraSuperior subtitulo={DEPENDENCIAS[dependencia].nombre}>
          {campana && <CampanaDeSesion enBarra />}
          <BotonCerrarSesion variante="barra" />
        </BarraSuperior>
        {campana && (
          // PC: arriba a la derecha del contenido y fija al desplazarse (altura 0: no empuja la página).
          <div className="pointer-events-none sticky top-0 z-20 hidden h-0 lg:block">
            <div className="pointer-events-auto absolute top-8 right-10">
              <CampanaDeSesion />
            </div>
          </div>
        )}
        <div className="grow">{children}</div>
      </div>
    </div>
  );
}
