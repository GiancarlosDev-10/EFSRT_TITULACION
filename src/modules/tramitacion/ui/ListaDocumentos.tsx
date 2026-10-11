"use client";

// Lista de documentos de la carpeta con casillas. Es solo una guía personal:
// lo marcado se guarda en el navegador del estudiante, no en el sistema.
import { useValorLocal } from "@/shared";

type Props = { documentos: readonly { id: string; nombre: string }[] };

export function ListaDocumentos({ documentos }: Props) {
  const [guardado, guardar] = useValorLocal("efsrt:documentos-listos");
  const listos = new Set(guardado ? guardado.split(",") : []);
  const cantidad = documentos.filter((d) => listos.has(d.id)).length;
  const completo = cantidad === documentos.length;

  const alternar = (id: string) => {
    const nuevos = new Set(listos);
    if (nuevos.has(id)) nuevos.delete(id);
    else nuevos.add(id);
    guardar([...nuevos].join(","));
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1">
        {documentos.map((documento) => {
          const marcado = listos.has(documento.id);
          return (
            <li key={documento.id}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 hover:bg-bg">
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(documento.id)}
                  className="size-[18px] shrink-0 accent-navy"
                />
                <span className={`text-[13px] ${marcado ? "text-muted line-through" : "text-ink"}`}>{documento.nombre}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-[width] ${completo ? "bg-ok" : "bg-navy"}`}
          style={{ width: `${(cantidad / documentos.length) * 100}%` }}
        />
      </div>
      <span aria-live="polite" className={`text-xs font-semibold ${completo ? "text-ok" : "text-text-soft"}`}>
        {completo ? "Listo para llevar a Mesa de Partes" : `${cantidad} de ${documentos.length} listos`}
      </span>
    </div>
  );
}
