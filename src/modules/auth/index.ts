// API pública del módulo auth. Otros módulos solo importan desde aquí.
export { obtenerUsuarioActual, type Rol, type UsuarioActual } from "./sesion";
export { AvisoDominio, DOMINIO_INSTITUCIONAL, PantallaIngreso } from "./ui/PantallaIngreso";

export const RUTAS_AUTH = { ingreso: "/login" } as const;
