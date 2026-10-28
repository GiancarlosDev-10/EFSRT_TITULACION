import { describe, expect, test } from "bun:test";
import { redactarAviso, type DatosAviso } from "./aviso";
import { PALETA_CORREO } from "./paleta-correo";

// 25 oct. 2026, 14:39 en Lima (UTC−5).
const FECHA = new Date("2026-10-25T19:39:00Z");

const base: DatosAviso = {
  nombres: "Giancarlos",
  modulo: "II",
  nombreModulo: "Implementación de sistemas de información",
  estado: { codigo: "03", nombre: "Pago conforme (derivado a Coordinación)", tipo: "conforme" },
  apertura: false,
  ahora: "pasa a Coordinación de Carrera",
  motivo: null,
  subsanar: null,
  constancia: null,
  docenteAsignado: null,
  cambioDeDocente: null,
  fecha: FECHA,
  enlace: "http://localhost:3000/alumno/seguimiento/II",
};

const observacion: DatosAviso = {
  ...base,
  estado: { codigo: "08", nombre: "Supervisión observada", tipo: "observacion" },
  ahora: "está con el Docente Supervisor",
  motivo: "Anexo 4: falta la firma del jefe inmediato.",
  subsanar: { indicacion: "Corrige el documento de supervisión indicado.", entregarA: "al Docente Supervisor" },
};

describe("redactarAviso", () => {
  test("cambio normal: dice el nuevo estado y dónde está ahora", () => {
    const { asunto, texto } = redactarAviso(base);
    expect(asunto).toBe("Tu expediente del Módulo II: Pago conforme (derivado a Coordinación)");
    expect(texto).toContain("Hola, Giancarlos:");
    expect(texto).toContain(
      "avanzó: 03 · Pago conforme (derivado a Coordinación). Ahora pasa a Coordinación de Carrera.",
    );
    expect(texto).toContain("Módulo II (Implementación de sistemas de información)");
    expect(texto).toContain("Ver mi seguimiento: http://localhost:3000/alumno/seguimiento/II");
  });

  test("la fecha va en hora de Perú", () => {
    expect(redactarAviso(base).texto).toMatch(/Registrado el 25 oct\.? 2026,? 14:39/);
  });

  test("apertura: Mesa de Partes recibió la carpeta", () => {
    const { asunto, texto } = redactarAviso({
      ...base,
      apertura: true,
      estado: { codigo: "01", nombre: "Expediente recibido", tipo: "proceso" },
    });
    expect(asunto).toBe("Recibimos tu expediente del Módulo II");
    expect(texto).toContain("Mesa de Partes recibió la carpeta de tu Módulo II");
  });

  test("observación: motivo tal cual, qué hacer y a quién entregar la corrección", () => {
    const { asunto, texto, html } = redactarAviso(observacion);
    expect(asunto).toBe("Tu expediente del Módulo II tiene una observación");
    expect(texto).toContain('Motivo: "Anexo 4: falta la firma del jefe inmediato."');
    expect(texto).toContain("Luego entrega tu corrección al Docente Supervisor.");
    expect(html).toContain("Anexo 4: falta la firma del jefe inmediato.");
  });

  test("una nota opcional aparece como nota de la oficina", () => {
    const { texto } = redactarAviso({ ...base, motivo: "Recuerda traer tu DNI." });
    expect(texto).toContain('Nota de la oficina: "Recuerda traer tu DNI."');
  });

  test("final: dónde, cuándo y qué llevar para recoger la constancia", () => {
    const { asunto, texto } = redactarAviso({
      ...base,
      estado: { codigo: "10", nombre: "Constancia lista para recoger", tipo: "final" },
      ahora: "está en Bienestar y Empleabilidad",
      constancia: {
        lugar: "Unidad de Bienestar y Empleabilidad",
        ubicacion: "Primer piso",
        horario: "Lun. a vie.",
        queLlevar: "Solo tu DNI",
      },
    });
    expect(asunto).toBe("Tu constancia del Módulo II está lista para recoger");
    expect(texto).toContain("Dónde: Unidad de Bienestar y Empleabilidad (Primer piso).");
    expect(texto).toContain("Qué llevar: Solo tu DNI.");
  });

  test("asignación (06): dice quién será su Docente Supervisor", () => {
    const { texto } = redactarAviso({
      ...base,
      estado: { codigo: "06", nombre: "Docente supervisor asignado", tipo: "conforme" },
      ahora: "pasa al Docente Supervisor",
      docenteAsignado: "Mg. R. Paredes",
    });
    expect(texto).toContain("Ahora pasa al Docente Supervisor. Tu Docente Supervisor es Mg. R. Paredes.");
  });

  test("cambio de docente: quién es ahora, quién era antes y que el estado no cambió", () => {
    const { asunto, texto } = redactarAviso({
      ...base,
      estado: { codigo: "07", nombre: "En supervisión", tipo: "proceso" },
      cambioDeDocente: { nuevo: "Ing. M. Vargas", anterior: "Mg. R. Paredes" },
    });
    expect(asunto).toBe("Cambió tu Docente Supervisor del Módulo II");
    expect(texto).toContain("ahora es Ing. M. Vargas (antes, Mg. R. Paredes)");
    expect(texto).toContain("sigue en el mismo estado: 07 · En supervisión.");
  });

  test("cambio de docente con el expediente observado: no repite la observación", () => {
    const { asunto, html } = redactarAviso({
      ...observacion,
      motivo: null,
      subsanar: null,
      cambioDeDocente: { nuevo: "Ing. M. Vargas", anterior: "Mg. R. Paredes" },
    });
    expect(asunto).toBe("Cambió tu Docente Supervisor del Módulo II");
    expect(html).not.toContain(PALETA_CORREO.warnBg);
  });

  test("sin nombre del módulo, solo el número", () => {
    expect(redactarAviso({ ...base, nombreModulo: null }).texto).toContain("Tu expediente del Módulo II avanzó");
  });

  test("lo que escribe una oficina no puede inyectar HTML", () => {
    const { html } = redactarAviso({ ...observacion, motivo: '<script>alert("x")</script><a href="http://malo">clic</a>' });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('<a href="http://malo">');
    expect(html).toContain("&lt;script&gt;");
  });

  test("el HTML lleva el botón al seguimiento", () => {
    expect(redactarAviso(base).html).toContain('href="http://localhost:3000/alumno/seguimiento/II"');
  });
});
