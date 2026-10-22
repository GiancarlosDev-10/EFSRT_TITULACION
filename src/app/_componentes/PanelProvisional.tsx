// Pantalla provisional de cada oficina, ya protegida por su rol. Se reemplaza
// cuando se construya la vista de esa oficina.
import { Suspense } from "react";
import { BotonCerrarSesion, RUTA_DE_ROL, exigirRol, type Rol } from "@/modules/auth";
import { CargandoPagina, PaginaProvisional } from "@/shared";

type Props = { rol: Exclude<Rol, "estudiante">; perfil: string };

export function PanelProvisional(props: Props) {
  // El esqueleto no dice de qué oficina es: si quien entra tiene otro rol, se le
  // redirige sin haber visto el nombre de la pantalla ajena.
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-3xl px-4 py-10">
          <CargandoPagina etiqueta="Verificando tu acceso" />
        </main>
      }
    >
      <Contenido {...props} />
    </Suspense>
  );
}

async function Contenido({ rol, perfil }: Props) {
  const usuario = await exigirRol(rol);
  return (
    <PaginaProvisional perfil={perfil} ruta={RUTA_DE_ROL[rol]}>
      <p className="text-sm">
        Ingresaste como <b>{usuario.nombre}</b>{" "}
        <span className="font-mono text-xs text-muted">({usuario.correo})</span>
      </p>
      <BotonCerrarSesion />
    </PaginaProvisional>
  );
}
