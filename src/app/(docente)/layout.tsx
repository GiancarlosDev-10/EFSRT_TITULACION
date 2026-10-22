import type { ReactNode } from "react";
import { LayoutOficina } from "../_oficinas/LayoutOficina";

export default function LayoutDocente({ children }: { children: ReactNode }) {
  return <LayoutOficina dependencia="docente">{children}</LayoutOficina>;
}
