import type { Metadata } from "next";
import { Chivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Fuente variable: un solo archivo cubre todos los pesos (títulos y texto).
const chivo = Chivo({
  variable: "--font-chivo",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "EFSRT Seguimiento — IESTP Gilda Ballivián",
  description:
    "Seguimiento del expediente de Experiencias Formativas en Situaciones Reales de Trabajo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-PE"
      className={`${chivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
