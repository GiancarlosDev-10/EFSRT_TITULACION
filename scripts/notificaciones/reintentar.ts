// Reenvía los avisos pendientes o fallidos de la bandeja de salida (D20, D55).
// Uso: bun run notificaciones:reintentar
// Envía por Gmail si NOTIFICACIONES_ENVIO=gmail en .env; si no, los imprime.
import { plugin } from "bun";

// Los módulos de la aplicación importan "server-only", que falla fuera de
// Next.js. Este comando corre en el servidor (tu máquina): se reemplaza por un
// módulo vacío solo aquí.
plugin({
  name: "server-only vacío",
  setup(build) {
    build.module("server-only", () => ({ exports: {}, loader: "object" }));
  },
});

const { crearEnvioDeAvisos } = await import("../../src/modules/notificaciones/infrastructure/composicion");

const modo = process.env.NOTIFICACIONES_ENVIO === "gmail" ? "Gmail" : "consola (no se envía nada)";
console.log(`Enviando avisos pendientes por ${modo}…`);
const { enviados, fallidos } = await crearEnvioDeAvisos()(100);
console.log(`Enviados: ${enviados} · Fallidos: ${fallidos}`);
process.exit(fallidos > 0 ? 1 : 0);
