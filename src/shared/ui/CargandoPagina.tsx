/** Esqueleto mientras carga una página interna (encabezado y dos bloques). */
export function CargandoPagina({ etiqueta }: { etiqueta: string }) {
  return (
    <div aria-busy="true" aria-label={etiqueta} className="flex animate-pulse flex-col gap-4">
      <div className="h-11 w-44 rounded-xl bg-line" />
      <div className="h-40 rounded-[22px] bg-line" />
      <div className="h-28 rounded-[20px] bg-line" />
    </div>
  );
}
