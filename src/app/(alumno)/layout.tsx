// Layout de todas las páginas del estudiante: barra lateral en PC (módulos bajo
// "Mi seguimiento" y constancias listas bajo "Mis constancias"); en celular,
// barra superior y navegación inferior.
import { Suspense, type ReactNode } from "react";
import { BotonCerrarSesion } from "@/modules/auth";
import { RUTAS_ALUMNO, subitemsDeConstancias, subitemsDeModulos } from "@/modules/tramitacion";
import {
  Avatar,
  BarraLateral,
  BarraSuperior,
  IconoConstancia,
  IconoInicio,
  IconoRequisitos,
  IconoUbicacion,
  NavegacionInferior,
  NavegacionLateral,
  type ItemNavegacion,
  type SubitemNavegacion,
} from "@/shared";
import { CampanaDeSesion } from "../_campana/CampanaDeSesion";
import { datosDelEstudiante } from "./alumno/_datos";

function navegacionPC(modulos?: SubitemNavegacion[], constancias: SubitemNavegacion[] = []): ItemNavegacion[] {
  const items: ItemNavegacion[] = [
    { href: RUTAS_ALUMNO.inicio, etiqueta: "Mi seguimiento", icono: <IconoUbicacion />, exacto: true, subitems: modulos },
    { href: RUTAS_ALUMNO.requisitos, etiqueta: "Cómo iniciar mi trámite", icono: <IconoRequisitos /> },
  ];
  // "Mis constancias" solo aparece si hay alguna lista; se despliega para elegirla.
  if (constancias.length > 0) {
    items.push({
      href: constancias[0].href,
      etiqueta: "Mis constancias",
      icono: <IconoConstancia />,
      subitems: constancias,
      desplegable: true,
    });
  }
  return items;
}

const NAVEGACION_MOVIL: ItemNavegacion[] = [
  { href: RUTAS_ALUMNO.inicio, etiqueta: "Inicio", icono: <IconoInicio tamano={22} />, exacto: true },
  { href: RUTAS_ALUMNO.seguimientos, etiqueta: "Seguimiento", icono: <IconoUbicacion tamano={22} /> },
  { href: RUTAS_ALUMNO.requisitos, etiqueta: "Requisitos", icono: <IconoRequisitos tamano={22} /> },
];

async function NavegacionConModulos() {
  const { seguimiento } = await datosDelEstudiante();
  return <NavegacionLateral items={navegacionPC(subitemsDeModulos(seguimiento), subitemsDeConstancias(seguimiento))} />;
}

async function TarjetaUsuario() {
  const { usuario } = await datosDelEstudiante();
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-ink-raised p-3 group-data-[contraida=true]/barra:justify-center group-data-[contraida=true]/barra:p-1.5">
      <Avatar nombre={usuario.nombre} variante="claro" className="size-[38px] text-[13px]" />
      <div className="flex min-w-0 flex-col gap-px group-data-[contraida=true]/barra:sr-only">
        <span className="truncate text-[13px] font-semibold">{usuario.nombre}</span>
        {/* D24: la carrera, como en el mockup; el correo sigue para saber con qué cuenta se entró. */}
        <span className="truncate text-[11px] text-on-ink">{usuario.carrera}</span>
        <span className="truncate font-mono text-[11px] text-on-ink-muted">{usuario.correo}</span>
      </div>
      <div className="ml-auto shrink-0 group-data-[contraida=true]/barra:hidden">
        <BotonCerrarSesion variante="barra" />
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
        <Suspense fallback={<NavegacionLateral items={navegacionPC()} />}>
          <NavegacionConModulos />
        </Suspense>
      </BarraLateral>
      <div className="flex min-w-0 grow flex-col">
        {/* Celular: barra superior con la campana (D58) y "Salir", como en las oficinas. */}
        <BarraSuperior subtitulo="Estudiante">
          <CampanaDeSesion enBarra />
          <BotonCerrarSesion variante="barra" />
        </BarraSuperior>
        <div className="grow">{children}</div>
        <NavegacionInferior items={NAVEGACION_MOVIL} className="lg:hidden" />
      </div>
    </div>
  );
}
