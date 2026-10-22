import Link from "next/link";

export const metadata = { title: "No encontrado — EFSRT" };

// También se muestra cuando la sesión no puede ver un expediente (RLS): no
// revela si existe o no.
export default function NoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-start gap-3 px-5 py-16">
      <p className="font-mono text-sm font-medium text-muted">404</p>
      <h1 className="font-display text-2xl font-extrabold">No encontramos lo que buscas</h1>
      <p className="text-sm text-muted">Puede que el enlace esté mal escrito o que no tengas acceso a esta página.</p>
      <Link href="/login" className="flex min-h-11 items-center rounded-xl bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-hover">
        Ir al inicio
      </Link>
    </main>
  );
}
