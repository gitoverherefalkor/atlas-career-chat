export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_codes: {
        Row: {
          code: string
          created_at: string
          currency: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          max_usage: number | null
          price_paid: number | null
          survey_type: string | null
          usage_count: number | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          max_usage?: number | null
          price_paid?: number | null
          survey_type?: string | null
          usage_count?: number | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          max_usage?: number | null
          price_paid?: number | null
          survey_type?: string | null
          usage_count?: number | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      answers: {
        Row: {
          access_code_id: string | null
          id: string
          payload: Json
          submitted_at: string | null
          survey_id: string | null
        }
        Insert: {
          access_code_id?: string | null
          id?: string
          payload: Json
          submitted_at?: string | null
          survey_id?: string | null
        }
        Update: {
          access_code_id?: string | null
          id?: string
          payload?: Json
          submitted_at?: string | null
          survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          pronouns: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          pronouns?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          pronouns?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          access_code_id: string | null
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          stripe_session_id: string | null
        }
        Insert: {
          access_code_id?: string | null
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          stripe_session_id?: string | null
        }
        Update: {
          access_code_id?: string | null
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          allow_multiple: boolean | null
          allow_other: boolean | null
          config: Json | null
          created_at: string | null
          id: string
          label: string
          max_selections: number | null
          min_selections: number | null
          order_num: number | null
          required: boolean | null
          section_id: string | null
          type: string
        }
        Insert: {
          allow_multiple?: boolean | null
          allow_other?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string
          label: string
          max_selections?: number | null
          min_selections?: number | null
          order_num?: number | null
          required?: boolean | null
          section_id?: string | null
          type: string
        }
        Update: {
          allow_multiple?: boolean | null
          allow_other?: boolean | null
          config?: Json | null
          created_at?: string | null
          id?: string
          label?: string
          max_selections?: number | null
          min_selections?: number | null
          order_num?: number | null
          required?: boolean | null
          section_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "survey_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      report_sections: {
        Row: {
          content: string
          created_at: string
          id: string
          report_id: string
          section_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          report_id: string
          section_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          report_id?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_report_sections_report_id"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_sections_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          access_code_id: string | null
          created_at: string
          id: string
          payload: Json
          relevance_user_id: string | null
          status: string
          survey_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_code_id?: string | null
          created_at?: string
          id?: string
          payload: Json
          relevance_user_id?: string | null
          status?: string
          survey_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_code_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          relevance_user_id?: string | null
          status?: string
          survey_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reports_access_code_id"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_reports_survey_id"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_access_code_id_fkey"
            columns: ["access_code_id"]
            isOneToOne: false
            referencedRelation: "access_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_sections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          order_num: number | null
          survey_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_num?: number | null
          survey_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          order_num?: number | null
          survey_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sections_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
