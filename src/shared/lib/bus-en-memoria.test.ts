import { expect, test } from "bun:test";
import { crearBusEnMemoria } from "./bus-en-memoria";

test("entrega cada evento a todos los suscriptores y permite cancelar", async () => {
  const bus = crearBusEnMemoria<string>();
  const recibidosA: string[] = [];
  const recibidosB: string[] = [];

  bus.suscribir((evento) => void recibidosA.push(evento));
  const cancelarB = bus.suscribir((evento) => void recibidosB.push(evento));

  await bus.publicar("primero");
  cancelarB();
  await bus.publicar("segundo");

  expect(recibidosA).toEqual(["primero", "segundo"]);
  expect(recibidosB).toEqual(["primero"]);
});
