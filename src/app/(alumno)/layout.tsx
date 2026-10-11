// Layout de todas las páginas del estudiante: barra lateral en PC y
// navegación inferior en celular.
import { Suspense, type ReactNode } from "react";
import { obtenerUsuarioActual } from "@/modules/auth";
import { RUTAS_ALUMNO } from "@/modules/tramitacion";
import {
  Avatar,
  BarraLateral,
  IconoConstancia,
  IconoInicio,
  IconoRequisitos,
  IconoUbicacion,
  NavegacionInferior,
  NavegacionLateral,
  type ItemNavegacion,
} from "@/shared";

const NAVEGACION_PC: ItemNavegacion[] = [
  { href: RUTAS_ALUMNO.inicio, etiqueta: "Mi seguimiento", icono: <IconoUbicacion />, exacto: true },
  { href: RUTAS_ALUMNO.requisitos, etiqueta: "Cómo iniciar mi trámite", icono: <IconoRequisitos /> },
  { href: RUTAS_ALUMNO.constancias, etiqueta: "Mis constancias", icono: <IconoConstancia /> },
];

const NAVEGACION_MOVIL: ItemNavegacion[] = [
  { href: RUTAS_ALUMNO.inicio, etiqueta: "Inicio", icono: <IconoInicio tamano={22} />, exacto: true },
  { href: RUTAS_ALUMNO.seguimientos, etiqueta: "Seguimiento", icono: <IconoUbicacion tamano={22} /> },
  { href: RUTAS_ALUMNO.requisitos, etiqueta: "Requisitos", icono: <IconoRequisitos tamano={22} /> },
];

async function TarjetaUsuario() {
  const usuario = await obtenerUsuarioActual();
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-ink-raised p-3">
      <Avatar nombre={usuario.nombre} variante="claro" className="size-[38px] text-[13px]" />
      <div className="flex min-w-0 flex-col gap-px">
        <span className="truncate text-[13px] font-semibold">{usuario.nombre}</span>
        <span className="truncate font-mono text-[11px] text-on-ink-muted">{usuario.correo}</span>
      </div>
    </div>
  );
}

export default function LayoutAlumno({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <BarraLateral
        pie={
          <Suspense fallback={<div className="h-[62px] rounded-[14px] bg-ink-raised" />}>
            <TarjetaUsuario />
          </Suspense>
        }
      >
        <NavegacionLateral items={NAVEGACION_PC} />
      </BarraLateral>
      <div className="flex min-w-0 grow flex-col">
        <div className="grow">{children}</div>
        <NavegacionInferior items={NAVEGACION_MOVIL} className="lg:hidden" />
      </div>
    </div>
  );
}
