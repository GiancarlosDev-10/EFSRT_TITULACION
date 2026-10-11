import { beforeAll, describe, expect, test } from "bun:test";
import { crearDependenciasDePrueba } from "../application/ayudas-prueba";
import { crearObtenerSeguimientoDelEstudiante, type SeguimientoModulo } from "../application";
import { ESTUDIANTE_DE_PRUEBA, EXPEDIENTES_DE_PRUEBA } from "../infrastructure/datos-prueba";
import {
  avisosDeObservacion,
  etapasDe,
  etiquetaDeModulo,
  moduloInicial,
  momento,
  progresoDeExpediente,
  resumenDeEtapa,
  textoSubsanado,
  tonoDeEvento,
  ubicacionDeModulo,
  ultimosMovimientos,
} from "./presentacion";

const lima = (fecha: string) => new Date(`${fecha}-05:00`);
// La observación del Módulo II se registró el 10 oct. a las 09:40.
const MISMO_DIA = lima("2026-10-10T12:00");
const TRES_DIAS_DESPUES = lima("2026-10-13T12:00");

let moduloI: SeguimientoModulo;
let moduloII: SeguimientoModulo;
let moduloIII: SeguimientoModulo;
let seguimiento: SeguimientoModulo[];

beforeAll(async () => {
  const { dependencias } = crearDependenciasDePrueba(EXPEDIENTES_DE_PRUEBA);
  seguimiento = await crearObtenerSeguimientoDelEstudiante(dependencias)(ESTUDIANTE_DE_PRUEBA.id);
  [moduloI, moduloII, moduloIII] = seguimiento;
});

describe("aviso de observación", () => {
  test("el mismo día: sin contador", () => {
    expect(avisosDeObservacion(seguimiento, MISMO_DIA)).toEqual([
      {
        modulo: "II",
        expedienteId: "exp-lucia-II",
        motivo: "Anexo 4: falta la firma y el sello del jefe inmediato en la página 3.",
        entrega: "Entrega tu corrección al Docente Supervisor",
        observado: "Observado hoy, 09:40",
      },
    ]);
  });

  test("días después: fecha y contador", () => {
    const [aviso] = avisosDeObservacion(seguimiento, TRES_DIAS_DESPUES);
    expect(aviso.observado).toBe("Observado el 10 oct., 09:40 · hace 3 días");
  });

  test("sin observaciones vigentes no hay avisos", () => {
    expect(avisosDeObservacion([moduloI, moduloIII], MISMO_DIA)).toEqual([]);
  });
});

describe("tarjeta de ubicación", () => {
  test("observado", () => {
    expect(ubicacionDeModulo(moduloII, MISMO_DIA)).toEqual({
      rotulo: "Tu expediente está en",
      lugar: "Docente Supervisor",
      pildora: "08 · Supervisión observada",
      desde: "Desde hoy, 09:40",
      tono: "observado",
    });
  });

  test("constancia lista", () => {
    expect(ubicacionDeModulo(moduloI, MISMO_DIA)).toMatchObject({
      rotulo: "Recoge tu constancia en",
      lugar: "Bienestar y Empleabilidad",
      desde: "Desde el 28 ago., 16:05",
      tono: "listo",
    });
  });

  test("sin expediente", () => {
    expect(ubicacionDeModulo(moduloIII, MISMO_DIA)).toMatchObject({
      lugar: "Aún sin expediente",
      tono: "sin-expediente",
    });
  });
});

describe("tracker", () => {
  test("resúmenes por etapa como en el mockup", () => {
    expect(moduloI.expediente!.etapas.map((e) => resumenDeEtapa(e, MISMO_DIA))).toEqual([
      "Conforme · 11 jun.",
      "Docente asignado · 17 jun.",
      "Aprobado · 20 ago.",
      "Constancia lista · 28 ago.",
    ]);
    expect(moduloII.expediente!.etapas.map((e) => resumenDeEtapa(e, MISMO_DIA))).toEqual([
      "Conforme · 04 ago.",
      "Docente asignado · 12 set.",
      "Observado · hoy, 09:40",
      "Pendiente",
    ]);
  });

  test("tonos de los eventos y observación subsanada", () => {
    const [mesaPartes, , docente] = moduloII.expediente!.etapas;
    expect(mesaPartes.eventos.map(tonoDeEvento)).toEqual(["proceso", "subsanado", "conforme"]);
    expect(docente.eventos.map(tonoDeEvento)).toEqual(["proceso", "observado"]);
    expect(textoSubsanado(mesaPartes.eventos[1], MISMO_DIA)).toBe("Subsanado el 04 ago.");
    expect(textoSubsanado(docente.eventos[1], MISMO_DIA)).toBeNull();
  });

  test("momento del evento", () => {
    expect(momento(lima("2026-10-10T09:40"), MISMO_DIA)).toBe("Hoy · 09:40");
    expect(momento(lima("2026-09-15T14:30"), MISMO_DIA)).toBe("15 set. · 14:30");
  });

  test("un módulo sin expediente muestra cuatro etapas pendientes", () => {
    const etapas = etapasDe(moduloIII.expediente);
    expect(etapas.map((e) => e.situacion)).toEqual(["pendiente", "pendiente", "pendiente", "pendiente"]);
  });
});

describe("tarjetas de módulo (celular)", () => {
  test("progreso en curso", () => {
    expect(progresoDeExpediente(moduloII.expediente!, MISMO_DIA)).toEqual({
      segmentos: ["completada", "completada", "observada", "pendiente"],
      ubicacion: { prefijo: "Está en", lugar: "Docente Supervisor" },
      texto: "Dependencia 3 de 4 · actualizado hoy",
    });
  });

  test("recorrido completo", () => {
    expect(progresoDeExpediente(moduloI.expediente!, MISMO_DIA)).toMatchObject({
      ubicacion: { prefijo: "Recógela en", lugar: "Bienestar y Empleabilidad" },
      texto: "Recorrido completo · 28 ago.",
    });
  });

  test("etiqueta del módulo", () => {
    expect(seguimiento.map(etiquetaDeModulo)).toEqual(["Constancia lista", "Observado", "Sin expediente"]);
  });
});

describe("últimos movimientos y módulo inicial", () => {
  test("los tres más recientes de todos los módulos", () => {
    expect(ultimosMovimientos(seguimiento, MISMO_DIA).map(({ titulo, detalle }) => [titulo, detalle])).toEqual([
      ["Supervisión observada · Módulo II", "Hoy, 09:40 · Docente Supervisor"],
      ["En supervisión · Módulo II", "15 set. · Docente Supervisor"],
      ["Docente supervisor asignado · Módulo II", "12 set. · Coordinación de Carrera"],
    ]);
  });

  test("se abre primero el módulo observado; si no hay, el más reciente", () => {
    expect(moduloInicial(seguimiento)).toBe("II");
    expect(moduloInicial([moduloI, moduloIII])).toBe("I");
    expect(moduloInicial([moduloIII])).toBe("I");
  });
});
