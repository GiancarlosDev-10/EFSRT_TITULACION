export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      dependencias: {
        Row: {
          codigo: string
          nombre: string
          orden: number
        }
        Insert: {
          codigo: string
          nombre: string
          orden: number
        }
        Update: {
          codigo?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      estados: {
        Row: {
          codigo: string
          dependencia: string
          es_inicial: boolean
          nombre: string
          tipo: string
        }
        Insert: {
          codigo: string
          dependencia: string
          es_inicial?: boolean
          nombre: string
          tipo: string
        }
        Update: {
          codigo?: string
          dependencia?: string
          es_inicial?: boolean
          nombre?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "estados_dependencia_fkey"
            columns: ["dependencia"]
            isOneToOne: false
            referencedRelation: "dependencias"
            referencedColumns: ["codigo"]
          },
        ]
      }
      estudiantes: {
        Row: {
          apellidos: string
          carrera: string
          correo_institucional: string | null
          correo_personal: string | null
          creado_en: string
          id: string
          nombre_busqueda: string | null
          nombres: string
          numero_documento: string
          tipo_documento: string
          usuario_id: string | null
        }
        Insert: {
          apellidos: string
          carrera: string
          correo_institucional?: string | null
          correo_personal?: string | null
          creado_en?: string
          id?: string
          nombre_busqueda?: string | null
          nombres: string
          numero_documento: string
          tipo_documento: string
          usuario_id?: string | null
        }
        Update: {
          apellidos?: string
          carrera?: string
          correo_institucional?: string | null
          correo_personal?: string | null
          creado_en?: string
          id?: string
          nombre_busqueda?: string | null
          nombres?: string
          numero_documento?: string
          tipo_documento?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      expedientes: {
        Row: {
          actualizado_en: string
          creado_en: string
          docente_id: string | null
          estado: string
          estudiante_id: string
          id: string
          modulo: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          docente_id?: string | null
          estado: string
          estudiante_id: string
          id: string
          modulo: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          docente_id?: string | null
          estado?: string
          estudiante_id?: string
          id?: string
          modulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_docente_id_fkey"
            columns: ["docente_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_estado_fkey"
            columns: ["estado"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "expedientes_estudiante_id_fkey"
            columns: ["estudiante_id"]
            isOneToOne: false
            referencedRelation: "estudiantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_modulo_fkey"
            columns: ["modulo"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["codigo"]
          },
        ]
      }
      historial: {
        Row: {
          actor_dependencia: string
          actor_id: string
          actor_nombre: string
          estado_anterior: string | null
          estado_nuevo: string
          expediente_id: string
          fecha: string
          id: number
          motivo: string | null
        }
        Insert: {
          actor_dependencia: string
          actor_id: string
          actor_nombre: string
          estado_anterior?: string | null
          estado_nuevo: string
          expediente_id: string
          fecha?: string
          id?: never
          motivo?: string | null
        }
        Update: {
          actor_dependencia?: string
          actor_id?: string
          actor_nombre?: string
          estado_anterior?: string | null
          estado_nuevo?: string
          expediente_id?: string
          fecha?: string
          id?: never
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_actor_dependencia_fkey"
            columns: ["actor_dependencia"]
            isOneToOne: false
            referencedRelation: "dependencias"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "historial_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_estado_anterior_fkey"
            columns: ["estado_anterior"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "historial_estado_nuevo_fkey"
            columns: ["estado_nuevo"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "historial_expediente_id_fkey"
            columns: ["expediente_id"]
            isOneToOne: false
            referencedRelation: "expedientes"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          codigo: string
          orden: number
        }
        Insert: {
          codigo: string
          orden: number
        }
        Update: {
          codigo?: string
          orden?: number
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          creado_en: string
          id: string
          nombre: string
          rol: string
        }
        Insert: {
          creado_en?: string
          id: string
          nombre: string
          rol: string
        }
        Update: {
          creado_en?: string
          id?: string
          nombre?: string
          rol?: string
        }
        Relationships: []
      }
      transiciones: {
        Row: {
          desde: string
          hacia: string
        }
        Insert: {
          desde: string
          hacia: string
        }
        Update: {
          desde?: string
          hacia?: string
        }
        Relationships: [
          {
            foreignKeyName: "transiciones_desde_fkey"
            columns: ["desde"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "transiciones_hacia_fkey"
            columns: ["hacia"]
            isOneToOne: false
            referencedRelation: "estados"
            referencedColumns: ["codigo"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abrir_expediente: {
        Args: {
          p_estudiante_id: string
          p_id: string
          p_modulo: string
          p_nota?: string
        }
        Returns: undefined
      }
      buscar_estudiantes: {
        Args: { p_consulta: string }
        Returns: {
          apellidos: string
          carrera: string
          correo_institucional: string | null
          correo_personal: string | null
          creado_en: string
          id: string
          nombre_busqueda: string | null
          nombres: string
          numero_documento: string
          tipo_documento: string
          usuario_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "estudiantes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      registrar_cambio: {
        Args: {
          p_estado_anterior: string
          p_estado_nuevo: string
          p_expediente_id: string
          p_motivo?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
