import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  AvisoCuentaNoHabilitada,
  AvisoEnlaceVencido,
  PantallaIngreso,
  RUTA_DE_ROL,
  obtenerSesion,
} from "@/modules/auth";
import { VistaPreviaSeguimiento } from "@/modules/tramitacion";

export const metadata = { title: "Ingresar — EFSRT Seguimiento" };

export default function PaginaIngreso({ searchParams }: PageProps<"/login">) {
  return (
    <PantallaIngreso
      vistaPrevia={<VistaPreviaSeguimiento />}
      aviso={
        <Suspense fallback={null}>
          <AvisoSegunUrl searchParams={searchParams} />
        </Suspense>
      }
    />
  );
}

/**
 * Con sesión habilitada, el ingreso no tiene nada que hacer: lleva a su ruta.
 * Si no, muestra el aviso que pidió el retorno del login (?error=…).
 */
async function AvisoSegunUrl({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const sesion = await obtenerSesion();
  if (sesion.estado === "activa") redirect(RUTA_DE_ROL[sesion.usuario.rol]);

  const { error } = await searchParams;
  if (error === "enlace") return <AvisoEnlaceVencido />;
  if (error === "cuenta" || sesion.estado === "sin-perfil") return <AvisoCuentaNoHabilitada />;
  return null;
}
