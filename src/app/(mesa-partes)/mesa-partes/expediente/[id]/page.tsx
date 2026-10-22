import { PaginaExpediente } from "../../../../_oficinas/PaginaExpediente";

export const metadata = { title: "Expediente · Mesa de Partes — EFSRT" };

export default function PaginaExpedienteMesaPartes({ params, searchParams }: PageProps<"/mesa-partes/expediente/[id]">) {
  return <PaginaExpediente dependencia="mesa-partes" params={params} searchParams={searchParams} />;
}
