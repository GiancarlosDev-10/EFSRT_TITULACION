// Bandeja de entrada de la campana en Supabase (D58). Usa el cliente con la
// sesión de quien pide: el RLS solo deja ver los avisos propios y la función
// de la base solo marca esos. Los textos del catálogo salen de `tramitacion`
// (su API pública), como en el correo.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEPENDENCIAS,
  DESTINO_DE,
  ESTADO_INICIAL,
  ESTADOS,
  RUTAS_ALUMNO,
  RUTAS_OFICINA,
  esCodigoEstado,
  esModulo,
  pasaA,
  type Dependencia,
} from "@/modules/tramitacion";
import type { Database, Tables } from "@/shared/lib/supabase/tipos-db";
import type { AvisoRecibido, BandejaDeEntrada } from "../application/puertos";
import type { DestinatarioAviso } from "../domain/campana";

type FilaAviso = Tables<"avisos">;

const esDependencia = (valor: string): valor is Dependencia => valor in DEPENDENCIAS;

export function avisoRecibido(fila: FilaAviso): AvisoRecibido {
  const { estado_codigo: codigo, modulo } = fila;
  if (!esCodigoEstado(codigo) || !esModulo(modulo)) {
    throw new Error(`Aviso ${fila.id}: estado "${codigo}" o módulo "${modulo}" desconocido`);
  }
  const estado = ESTADOS[codigo];
  const pasa = pasaA(codigo);
  const cambio = fila.cambio_docente_id !== null;

  let para: DestinatarioAviso;
  let enlace: string;
  if (fila.estudiante_id !== null) {
    para = "estudiante";
    enlace = RUTAS_ALUMNO.seguimiento(modulo);
  } else if (fila.docente_id !== null) {
    para = "docente";
    enlace = RUTAS_OFICINA.expediente("docente", fila.expediente_id);
  } else if (fila.oficina !== null && esDependencia(fila.oficina)) {
    para = "oficina";
    enlace = RUTAS_OFICINA.expediente(fila.oficina, fila.expediente_id);
  } else {
    throw new Error(`Aviso ${fila.id}: sin destinatario válido`);
  }

  return {
    id: fila.id,
    datos: {
      para,
      estudiante: fila.estudiante_nombre,
      modulo,
      estado: { codigo, nombre: estado.nombre, tipo: estado.tipo },
      // El estado inicial solo se registra al abrir el expediente.
      apertura: !cambio && codigo === ESTADO_INICIAL,
      pasaA: pasa && !cambio ? DESTINO_DE[pasa] : null,
      docenteAsignado: cambio ? null : fila.docente_nombre,
      cambioDeDocente:
        cambio && fila.docente_nombre && fila.docente_anterior_nombre
          ? { nuevo: fila.docente_nombre, anterior: fila.docente_anterior_nombre }
          : null,
    },
    fecha: new Date(fila.fecha),
    leido: fila.leido_en !== null,
    enlace,
  };
}

export function crearBandejaEntradaSupabase(cliente: SupabaseClient<Database>): BandejaDeEntrada {
  return {
    async recientes(limite) {
      const { data, error } = await cliente.from("avisos").select("*").order("id", { ascending: false }).limit(limite);
      if (error) throw new Error(`avisos: ${error.message}`);
      return (data ?? []).map(avisoRecibido);
    },
    async contarSinLeer() {
      const { count, error } = await cliente.from("avisos").select("id", { count: "exact", head: true }).is("leido_en", null);
      if (error) throw new Error(`avisos sin leer: ${error.message}`);
      return count ?? 0;
    },
    async marcarLeidos(hastaId) {
      const { error } = await cliente.rpc("marcar_avisos_leidos", { p_hasta_id: hastaId });
      if (error) throw new Error(`marcar_avisos_leidos: ${error.message}`);
    },
  };
}
