// API pública del módulo auth. Otros módulos solo importan desde aquí.
export { RUTA_DE_ROL, type Rol } from "./roles";
export { completarIngreso } from "./retorno";
export {
  RUTAS_AUTH,
  exigirRol,
  obtenerSesion,
  obtenerUsuarioActual,
  type Sesion,
  type UsuarioActual,
} from "./sesion";
export { BotonCerrarSesion } from "./ui/BotonCerrarSesion";
export {
  AvisoCuentaNoHabilitada,
  AvisoEnlaceVencido,
  DOMINIO_INSTITUCIONAL,
  PantallaIngreso,
} from "./ui/PantallaIngreso";
