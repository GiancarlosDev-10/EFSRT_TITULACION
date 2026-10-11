import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // El indicador de desarrollo tapaba la tarjeta del usuario en la barra lateral.
  devIndicators: { position: "bottom-right" },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // La raíz no tiene pantalla propia: todo empieza en el ingreso.
    return [{ source: "/", destination: "/login", permanent: false }];
  },
};

export default nextConfig;
