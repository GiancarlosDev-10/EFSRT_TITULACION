/** "Giancarlos Ormeño" → "GO" */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

type Props = {
  nombre: string;
  /** "oscuro": círculo tinta con letras blancas · "claro": al revés (sobre la barra lateral). */
  variante?: "oscuro" | "claro";
  className?: string;
};

export function Avatar({ nombre, variante = "oscuro", className = "" }: Props) {
  const colores = variante === "oscuro" ? "bg-ink text-white" : "bg-white text-ink";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${colores} ${className}`}
    >
      {iniciales(nombre)}
    </span>
  );
}
