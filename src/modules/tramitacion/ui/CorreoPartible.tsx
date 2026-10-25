import { Fragment } from "react";

/**
 * Un correo largo pasa al siguiente renglón después de un punto o de la arroba
 * ("…@iestpgildaballivian." / "edu.pe"), no en cualquier letra. `<wbr>` solo
 * ofrece el punto de corte: si el correo cabe, se ve en una línea.
 */
export function CorreoPartible({ correo }: { correo: string }) {
  // Corte después del punto o la arroba: el signo queda al final del renglón de arriba.
  const partes = correo.split(/(?<=[.@])/);
  // Un solo `<span>`: dentro de un contenedor flex, cada trozo suelto sería un elemento aparte.
  return (
    <span className="min-w-0">
      {partes.map((parte, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {parte}
        </Fragment>
      ))}
    </span>
  );
}
