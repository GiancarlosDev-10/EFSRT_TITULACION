import { PaginaExpediente } from "../../../../_oficinas/PaginaExpediente";

export const metadata = { title: "Expediente · Coordinación — EFSRT" };

export default function PaginaExpedienteCoordinacion({ params, searchParams }: PageProps<"/coordinacion/expediente/[id]">) {
  return <PaginaExpediente dependencia="coordinacion" params={params} searchParams={searchParams} />;
}
