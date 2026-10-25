import nodemailer from "nodemailer";
import type { Notificador } from "../application/puertos";

/** Gmail por SMTP con una contraseña de aplicación (D48). Provisional hasta tener proveedor definitivo. */
export function crearNotificadorGmail({ remitente, clave }: { remitente: string; clave: string }): Notificador {
  const transporte = nodemailer.createTransport({ service: "gmail", auth: { user: remitente, pass: clave } });
  return {
    async enviar({ para, asunto, texto, html }) {
      await transporte.sendMail({
        from: { name: "EFSRT Seguimiento", address: remitente },
        to: para,
        subject: asunto,
        text: texto,
        html,
      });
    },
  };
}

/** Solo imprime el correo: para desarrollo sin enviar nada. */
export function crearNotificadorConsola(): Notificador {
  return {
    async enviar({ para, asunto, texto }) {
      console.log(`[notificaciones] Correo (no enviado) para ${para.join(", ")}\nAsunto: ${asunto}\n\n${texto}\n`);
    },
  };
}
