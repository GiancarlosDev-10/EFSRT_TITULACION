// Página de bandeja, común a las cuatro oficinas. Cada ruta la usa con su
// dependencia; el rol se exige aquí, en cada petición (D46). La bandeja de
// Mesa de Partes lleva el botón "Registrar recepción" (D52).
import Link from "next/link";
import { Suspense } from "react";
import { exigirRol } from "@/modules/auth";
import {
  BandejaOficina,
  ESTADO_INICIAL,
  RUTAS_RECEPCION,
  esVistaBandeja,
  obtenerBandeja,
  puedeRegistrar,
  registraObservaciones,
  type Dependencia,
  type VistaBandeja,
} from "@/modules/tramitacion";
import { CargandoPagina, IconoCarpeta, MarcoPagina } from "@/shared";

type Parametros = Promise<Record<string, string | string[] | undefined>>;
type Props = { dependencia: Dependencia; searchParams: Parametros };

/** Largo máximo de la búsqueda: un nombre completo o un documento. */
const LARGO_MAXIMO_BUSQUEDA = 80;

export function PaginaBandeja(props: Props) {
  return (
    <MarcoPagina ancho="extenso">
      {/* Esqueleto neutro: si quien entra tiene otro rol, no ve de qué oficina es. */}
      <Suspense fallback={<CargandoPagina etiqueta="Verificando tu acceso" />}>
        <Contenido {...props} />
      </Suspense>
    </MarcoPagina>
  );
}

async function Contenido({ dependencia, searchParams }: Props) {
  const usuario = await exigirRol(dependencia);
  const parametros = await searchParams;
  const consulta = typeof parametros.q === "string" ? parametros.q.trim().slice(0, LARGO_MAXIMO_BUSQUEDA) : "";
  let vista: VistaBandeja = esVistaBandeja(parametros.vista) ? parametros.vista : "atender";
  if (vista === "observados" && !registraObservaciones(dependencia)) vista = "atender";

  const bandeja = await obtenerBandeja(dependencia, consulta);
  return (
    <BandejaOficina
      dependencia={dependencia}
      bandeja={bandeja}
      vista={vista}
      consulta={consulta}
      nombreUsuario={usuario.nombre}
      ahora={new Date()}
      accion={
        // Quien abre los expedientes (estado inicial) recibe las carpetas.
        puedeRegistrar(dependencia, ESTADO_INICIAL) && (
          <Link
            href={RUTAS_RECEPCION.buscar}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover lg:w-auto"
          >
            <IconoCarpeta tamano={18} />
            Registrar recepción
          </Link>
        )
      }
    />
  );
}
