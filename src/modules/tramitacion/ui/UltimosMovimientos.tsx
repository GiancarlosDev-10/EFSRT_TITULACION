import { ChipCodigo } from "./ChipCodigo";
import type { Movimiento } from "./presentacion";

export function UltimosMovimientos({ movimientos }: { movimientos: Movimiento[] }) {
  if (movimientos.length === 0) return null;
  return (
    <section className="flex flex-col">
      <h2 className="mb-1.5 font-display text-[17px] font-extrabold">Últimos movimientos</h2>
      <ul>
        {movimientos.map((movimiento) => (
          <li key={movimiento.clave} className="flex gap-3 border-b border-line py-2.5 last:border-b-0">
            <ChipCodigo codigo={movimiento.codigo} tono={movimiento.tono} />
            <div className="flex flex-col gap-px">
              <span className="text-[13px] font-semibold">{movimiento.titulo}</span>
              <span className="font-mono text-[11px] text-muted">{movimiento.detalle}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
