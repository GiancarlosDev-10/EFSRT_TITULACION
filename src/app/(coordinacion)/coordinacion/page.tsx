import { PaginaBandeja } from "../../_oficinas/PaginaBandeja";

export const metadata = { title: "Bandeja · Coordinación — EFSRT" };

export default function PaginaBandejaCoordinacion({ searchParams }: PageProps<"/coordinacion">) {
  return <PaginaBandeja dependencia="coordinacion" searchParams={searchParams} />;
}
