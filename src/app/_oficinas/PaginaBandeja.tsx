// Página de bandeja, común a las cuatro oficinas. Cada ruta la usa con su
// dependencia; el rol se exige aquí, en cada petición (D46).
import { Suspense } from "react";
import { exigirRol } from "@/modules/auth";
import {
  BandejaOficina,
  esVistaBandeja,
  obtenerBandeja,
  registraObservaciones,
  type Dependencia,
  type VistaBandeja,
} from "@/modules/tramitacion";
import { CargandoPagina, MarcoPagina } from "@/shared";

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
    />
  );
}
