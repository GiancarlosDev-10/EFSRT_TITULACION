// Layout de las cuatro oficinas: barra lateral en PC y barra superior oscura en
// celular. No decide el acceso: cada página exige su rol (D46).
import { Suspense, type ReactNode } from "react";
import { BotonCerrarSesion, obtenerUsuarioActual } from "@/modules/auth";
import { DEPENDENCIAS, RUTAS_OFICINA, type Dependencia } from "@/modules/tramitacion";
import { Avatar, BarraLateral, IconoBandeja, Logo, NavegacionLateral, type ItemNavegacion } from "@/shared";

type Props = { dependencia: Dependencia; children: ReactNode };

function navegacion(dependencia: Dependencia): ItemNavegacion[] {
  return [{ href: RUTAS_OFICINA.bandeja(dependencia), etiqueta: "Bandeja", icono: <IconoBandeja /> }];
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
        <header className="sticky top-0 z-10 flex items-center gap-2.5 bg-ink px-5 py-2.5 text-white lg:hidden">
          <Logo tamano={32} />
          <span className="flex min-w-0 grow flex-col">
            <span className="font-display text-sm font-extrabold">EFSRT Seguimiento</span>
            <span className="truncate text-[11px] text-on-ink-muted">{DEPENDENCIAS[dependencia].nombre}</span>
          </span>
          <BotonCerrarSesion variante="barra" />
        </header>
        <div className="grow">{children}</div>
      </div>
    </div>
  );
}
