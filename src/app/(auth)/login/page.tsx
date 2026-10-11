import { Suspense } from "react";
import { AvisoCuentaNoHabilitada, PantallaIngreso } from "@/modules/auth";
import { RUTAS_ALUMNO, VistaPreviaSeguimiento } from "@/modules/tramitacion";

export const metadata = { title: "Ingresar — EFSRT Seguimiento" };

export default function PaginaIngreso({ searchParams }: PageProps<"/login">) {
  return (
    <PantallaIngreso
      destino={RUTAS_ALUMNO.inicio}
      vistaPrevia={<VistaPreviaSeguimiento />}
      aviso={
        <Suspense fallback={null}>
          <AvisoSegunUrl searchParams={searchParams} />
        </Suspense>
      }
    />
  );
}

/** El login real redirigirá a /login?error=cuenta si la cuenta no está habilitada. */
async function AvisoSegunUrl({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { error } = await searchParams;
  return error === "cuenta" ? <AvisoCuentaNoHabilitada /> : null;
}
