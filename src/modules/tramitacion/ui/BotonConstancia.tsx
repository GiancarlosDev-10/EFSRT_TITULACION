import Link from "next/link";
import type { Modulo } from "../domain";
import { RUTAS_ALUMNO } from "./rutas";

/** Acceso a la constancia cuando está lista para recoger (celular y PC). */
export function BotonConstancia({ modulo }: { modulo: Modulo }) {
  return (
    <Link
      href={RUTAS_ALUMNO.constancia(modulo)}
      className="flex min-h-[50px] items-center justify-center rounded-2xl bg-ok text-sm font-semibold text-white hover:bg-ok-on-soft"
    >
      Dónde y cómo recoger mi constancia
    </Link>
  );
}
