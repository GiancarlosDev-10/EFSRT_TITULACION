"use client";

// Valor guardado en el navegador del usuario (localStorage). Solo para
// preferencias personales: no viaja al servidor ni a otros dispositivos.
import { useCallback, useSyncExternalStore } from "react";

const EVENTO = "efsrt:valor-local";

function suscribir(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null; // sin almacenamiento (p. ej. modo privado)
  }
}

/**
 * Lee y guarda un texto en el navegador. En el servidor siempre es `null`;
 * en el navegador se aplica el valor guardado tras la carga.
 */
export function useValorLocal(clave: string): [string | null, (valor: string) => void] {
  const valor = useSyncExternalStore(suscribir, () => leer(clave), () => null);
  const guardar = useCallback(
    (nuevo: string) => {
      try {
        localStorage.setItem(clave, nuevo);
      } catch {
        // Sin almacenamiento: el valor dura solo esta visita.
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [clave],
  );
  return [valor, guardar];
}
