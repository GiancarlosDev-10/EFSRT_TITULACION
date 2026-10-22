import { PaginaExpediente } from "../../../../_oficinas/PaginaExpediente";

export const metadata = { title: "Expediente · Docente Supervisor — EFSRT" };

export default function PaginaExpedienteDocente({ params, searchParams }: PageProps<"/docente/expediente/[id]">) {
  return <PaginaExpediente dependencia="docente" params={params} searchParams={searchParams} />;
}
