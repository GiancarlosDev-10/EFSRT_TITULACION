import type { ReactNode } from "react";
import { LayoutOficina } from "../_oficinas/LayoutOficina";

export default function LayoutMesaPartes({ children }: { children: ReactNode }) {
  return <LayoutOficina dependencia="mesa-partes">{children}</LayoutOficina>;
}
