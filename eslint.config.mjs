import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Arquitectura (CLAUDE.md), regla 2: entre módulos solo se usa su index.ts.
  // Dentro de un mismo módulo se usan imports relativos.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*"],
              message: "Importa el módulo por su index.ts (@/modules/<modulo>), no sus carpetas internas.",
            },
          ],
        },
      ],
    },
  },
  // Diseño (CLAUDE.md): colores solo como tokens del tema, nunca hex sueltos.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/], TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]",
          message: "No uses colores hex sueltos: usa un token del tema (src/app/globals.css).",
        },
      ],
    },
  },
  // Arquitectura, regla 1: domain/ es TypeScript puro.
  {
    files: ["src/modules/*/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*", "next", "next/*", "@supabase/*"],
              message: "domain/ no puede depender de React, Next.js ni Supabase.",
            },
            {
              group: ["@/*", "../../*"],
              message: "domain/ no importa otros módulos ni shared/; solo archivos de su propia carpeta.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
