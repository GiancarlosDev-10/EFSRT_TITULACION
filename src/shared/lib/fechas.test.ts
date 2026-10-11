import { describe, expect, test } from "bun:test";
import { capitalizar, diaRelativo, diasEntre, fechaCorta, haceDias, hora } from "./fechas";

const lima = (fecha: string) => new Date(`${fecha}-05:00`);
const AHORA = lima("2026-10-10T12:00");

describe("fechas en hora de Lima", () => {
  test("fecha corta y hora", () => {
    expect(fechaCorta(lima("2026-09-15T14:30"))).toBe("15 set.");
    expect(hora(lima("2026-09-15T09:05"))).toBe("09:05");
  });

  test("usa la hora de Lima aunque en UTC ya sea otro día", () => {
    const nocheEnLima = lima("2026-10-09T22:00"); // 03:00 del 10 en UTC
    expect(fechaCorta(nocheEnLima)).toBe("09 oct.");
    expect(diaRelativo(nocheEnLima, AHORA)).toBe("ayer");
  });

  test("día relativo", () => {
    expect(diaRelativo(lima("2026-10-10T09:40"), AHORA)).toBe("hoy");
    expect(diaRelativo(lima("2026-10-09T09:40"), AHORA)).toBe("ayer");
    expect(diaRelativo(lima("2026-08-28T16:05"), AHORA)).toBe("28 ago.");
    expect(diaRelativo(lima("2025-08-28T16:05"), AHORA)).toBe("28 ago. 2025");
  });

  test("días transcurridos", () => {
    expect(diasEntre(lima("2026-10-07T23:59"), AHORA)).toBe(3);
    expect(haceDias(lima("2026-10-10T08:00"), AHORA)).toBe("hoy");
    expect(haceDias(lima("2026-10-09T08:00"), AHORA)).toBe("hace 1 día");
    expect(haceDias(lima("2026-10-07T08:00"), AHORA)).toBe("hace 3 días");
  });

  test("capitalizar", () => {
    expect(capitalizar("hoy")).toBe("Hoy");
  });
});
