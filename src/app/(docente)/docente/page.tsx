import { PaginaBandeja } from "../../_oficinas/PaginaBandeja";

export const metadata = { title: "Bandeja · Docente Supervisor — EFSRT" };

export default function PaginaBandejaDocente({ searchParams }: PageProps<"/docente">) {
  return <PaginaBandeja dependencia="docente" searchParams={searchParams} />;
}
