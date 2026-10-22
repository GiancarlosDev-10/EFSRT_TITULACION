import { PaginaBandeja } from "../../_oficinas/PaginaBandeja";

export const metadata = { title: "Bandeja · Mesa de Partes — EFSRT" };

export default function PaginaBandejaMesaPartes({ searchParams }: PageProps<"/mesa-partes">) {
  return <PaginaBandeja dependencia="mesa-partes" searchParams={searchParams} />;
}
