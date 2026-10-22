// Retorno de Google y del enlace al correo. Ver modules/auth/retorno.ts.
import type { NextRequest } from "next/server";
import { completarIngreso } from "@/modules/auth";

export async function GET(peticion: NextRequest) {
  return completarIngreso(peticion);
}
