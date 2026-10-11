import { VistaRequisitos } from "@/modules/tramitacion";
import { MarcoPagina } from "@/shared";

export const metadata = { title: "Cómo iniciar mi trámite — EFSRT" };

export default function PaginaRequisitos() {
  return (
    <MarcoPagina ancho="amplio">
      <VistaRequisitos />
    </MarcoPagina>
  );
}
