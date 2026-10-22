import type { ReactNode } from "react";
import { LayoutOficina } from "../_oficinas/LayoutOficina";

export default function LayoutBienestar({ children }: { children: ReactNode }) {
  return <LayoutOficina dependencia="bienestar">{children}</LayoutOficina>;
}
