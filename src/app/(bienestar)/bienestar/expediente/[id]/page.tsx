import { PaginaExpediente } from "../../../../_oficinas/PaginaExpediente";

export const metadata = { title: "Expediente · Bienestar — EFSRT" };

export default function PaginaExpedienteBienestar({ params, searchParams }: PageProps<"/bienestar/expediente/[id]">) {
  return <PaginaExpediente dependencia="bienestar" params={params} searchParams={searchParams} />;
}
