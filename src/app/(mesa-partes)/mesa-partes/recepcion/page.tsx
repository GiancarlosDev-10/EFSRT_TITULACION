import { PaginaRecepcion } from "../../../_oficinas/PaginaRecepcion";

export const metadata = { title: "Registrar recepción · Mesa de Partes — EFSRT" };

export default function PaginaRecepcionMesaPartes({ searchParams }: PageProps<"/mesa-partes/recepcion">) {
  return <PaginaRecepcion searchParams={searchParams} />;
}
