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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      aa_dead_letter_log: {
        Row: {
          created_at: string
          error_message: string
          failed_node: string
          id: string
          timestamp: string
          workflow_name: string
        }
        Insert: {
          created_at?: string
          error_message: string
          failed_node: string
          id?: string
          timestamp: string
          workflow_name: string
        }
        Update: {
          created_at?: string
          error_message?: string
          failed_node?: string
          id?: string
          timestamp?: string
          workflow_name?: string
        }
        Relationships: []
      }
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
      enriched_jobs: {
        Row: {
          ai_impact_rating: string | null
          alternate_titles: string | null
          autonomy_vs_collaboration: string | null
          career_progression: string[] | null
          career_title: string
          certifications_requirements: string | null
          client_interaction_description: string | null
          client_interaction_level: string | null
          colleague_interaction_description: string | null
          colleague_interaction_level: string | null
          company_size_type: string | null
          core_values: string[] | null
          created_at: string | null
          education_requirements: string | null
          enriched_data: Json | null
          enrichment_version: number | null
          id: number
          leadership_caveat: string | null
          motivational_factors: string[] | null
          overview: string | null
          pace_of_work: string | null
          personality_traits: string | null
          physical_setting: string | null
          salary_australia: string | null
          salary_canada: string | null
          salary_europe_north_west: string | null
          salary_europe_south_east: string | null
          salary_switzerland: string | null
          salary_uk_london: string | null
          salary_uk_other: string | null
          salary_us_average_cost: string | null
          salary_us_high_cost: string | null
          salary_us_low_cost: string | null
          soft_skills: string[] | null
          technical_skills: string[] | null
          typical_tasks: string[] | null
          updated_at: string | null
          work_schedule: string | null
        }
        Insert: {
          ai_impact_rating?: string | null
          alternate_titles?: string | null
          autonomy_vs_collaboration?: string | null
          career_progression?: string[] | null
          career_title: string
          certifications_requirements?: string | null
          client_interaction_description?: string | null
          client_interaction_level?: string | null
          colleague_interaction_description?: string | null
          colleague_interaction_level?: string | null
          company_size_type?: string | null
          core_values?: string[] | null
          created_at?: string | null
          education_requirements?: string | null
          enriched_data?: Json | null
          enrichment_version?: number | null
          id?: number
          leadership_caveat?: string | null
          motivational_factors?: string[] | null
          overview?: string | null
          pace_of_work?: string | null
          personality_traits?: string | null
          physical_setting?: string | null
          salary_australia?: string | null
          salary_canada?: string | null
          salary_europe_north_west?: string | null
          salary_europe_south_east?: string | null
          salary_switzerland?: string | null
          salary_uk_london?: string | null
          salary_uk_other?: string | null
          salary_us_average_cost?: string | null
          salary_us_high_cost?: string | null
          salary_us_low_cost?: string | null
          soft_skills?: string[] | null
          technical_skills?: string[] | null
          typical_tasks?: string[] | null
          updated_at?: string | null
          work_schedule?: string | null
        }
        Update: {
          ai_impact_rating?: string | null
          alternate_titles?: string | null
          autonomy_vs_collaboration?: string | null
          career_progression?: string[] | null
          career_title?: string
          certifications_requirements?: string | null
          client_interaction_description?: string | null
          client_interaction_level?: string | null
          colleague_interaction_description?: string | null
          colleague_interaction_level?: string | null
          company_size_type?: string | null
          core_values?: string[] | null
          created_at?: string | null
          education_requirements?: string | null
          enriched_data?: Json | null
          enrichment_version?: number | null
          id?: number
          leadership_caveat?: string | null
          motivational_factors?: string[] | null
          overview?: string | null
          pace_of_work?: string | null
          personality_traits?: string | null
          physical_setting?: string | null
          salary_australia?: string | null
          salary_canada?: string | null
          salary_europe_north_west?: string | null
          salary_europe_south_east?: string | null
          salary_switzerland?: string | null
          salary_uk_london?: string | null
          salary_uk_other?: string | null
          salary_us_average_cost?: string | null
          salary_us_high_cost?: string | null
          salary_us_low_cost?: string | null
          soft_skills?: string[] | null
          technical_skills?: string[] | null
          typical_tasks?: string[] | null
          updated_at?: string | null
          work_schedule?: string | null
        }
        Relationships: []
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
          resume_data: Json | null
          resume_parsed_data: Json | null
          resume_uploaded_at: string | null
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
          resume_data?: Json | null
          resume_parsed_data?: Json | null
          resume_uploaded_at?: string | null
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
          resume_data?: Json | null
          resume_parsed_data?: Json | null
          resume_uploaded_at?: string | null
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
          chapter_id: string | null
          content: string
          created_at: string
          id: string
          order_number: number | null
          report_id: string
          section_id: string | null
          section_type: string
          subsection_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          chapter_id?: string | null
          content: string
          created_at?: string
          id?: string
          order_number?: number | null
          report_id: string
          section_id?: string | null
          section_type: string
          subsection_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          chapter_id?: string | null
          content?: string
          created_at?: string
          id?: string
          order_number?: number | null
          report_id?: string
          section_id?: string | null
          section_type?: string
          subsection_id?: string | null
          title?: string | null
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
          n8n_user_id: string | null
          payload: Json
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
          n8n_user_id?: string | null
          payload: Json
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
          n8n_user_id?: string | null
          payload?: Json
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
