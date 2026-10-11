type Manejador<E> = (evento: E) => void | Promise<void>;

/**
 * Bus de eventos mínimo en memoria: un módulo publica y otros se suscriben.
 * Al separar un módulo como servicio, se reemplaza por una cola sin cambiar
 * a quien publica.
 */
export function crearBusEnMemoria<E>() {
  const manejadores = new Set<Manejador<E>>();

  return {
    /** Devuelve una función para cancelar la suscripción. */
    suscribir(manejador: Manejador<E>): () => void {
      manejadores.add(manejador);
      return () => manejadores.delete(manejador);
    },
    async publicar(evento: E): Promise<void> {
      await Promise.all([...manejadores].map((manejador) => manejador(evento)));
    },
  };
}
