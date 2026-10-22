import type { ReactNode } from "react";
import { LayoutOficina } from "../_oficinas/LayoutOficina";

export default function LayoutCoordinacion({ children }: { children: ReactNode }) {
  return <LayoutOficina dependencia="coordinacion">{children}</LayoutOficina>;
}
