import { PaginaBandeja } from "../../_oficinas/PaginaBandeja";

export const metadata = { title: "Bandeja · Bienestar — EFSRT" };

export default function PaginaBandejaBienestar({ searchParams }: PageProps<"/bienestar">) {
  return <PaginaBandeja dependencia="bienestar" searchParams={searchParams} />;
}
