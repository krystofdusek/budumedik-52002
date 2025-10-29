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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subject_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          allows_multiple_correct: boolean
          code: Database["public"]["Enums"]["faculty_type"]
          created_at: string
          has_option_e: boolean
          id: string
          name: string
        }
        Insert: {
          allows_multiple_correct?: boolean
          code: Database["public"]["Enums"]["faculty_type"]
          created_at?: string
          has_option_e?: boolean
          id?: string
          name: string
        }
        Update: {
          allows_multiple_correct?: boolean
          code?: Database["public"]["Enums"]["faculty_type"]
          created_at?: string
          has_option_e?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      favorite_questions: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      fun_facts: {
        Row: {
          created_at: string | null
          fact_text: string
          id: string
        }
        Insert: {
          created_at?: string | null
          fact_text: string
          id?: string
        }
        Update: {
          created_at?: string | null
          fact_text?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          favorite_faculty_id: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          favorite_faculty_id?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          favorite_faculty_id?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_favorite_faculty_id_fkey"
            columns: ["favorite_faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      question_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          question_id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          question_id: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          question_id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category_id: string
          correct_answers: string[]
          created_at: string
          explanation: string | null
          faculty_id: string
          id: string
          is_active: boolean
          is_ai_generated: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string | null
          question_text: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          correct_answers: string[]
          created_at?: string
          explanation?: string | null
          faculty_id: string
          id?: string
          is_active?: boolean
          is_ai_generated?: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e?: string | null
          question_text: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          correct_answers?: string[]
          created_at?: string
          explanation?: string | null
          faculty_id?: string
          id?: string
          is_active?: boolean
          is_ai_generated?: boolean
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          option_e?: string | null
          question_text?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["subject_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["subject_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["subject_type"]
        }
        Relationships: []
      }
      test_results: {
        Row: {
          category_id: string | null
          created_at: string
          faculty_id: string | null
          id: string
          score: number
          subject_id: string | null
          test_type: string
          total_questions: number
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          faculty_id?: string | null
          id?: string
          score: number
          subject_id?: string | null
          test_type: string
          total_questions: number
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          faculty_id?: string | null
          id?: string
          score?: number
          subject_id?: string | null
          test_type?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_results_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answers: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_answers: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answers?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statistics: {
        Row: {
          activity_score: number
          created_at: string
          id: string
          total_correct_answers: number
          total_questions_answered: number
          total_tests_completed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_score?: number
          created_at?: string
          id?: string
          total_correct_answers?: number
          total_questions_answered?: number
          total_tests_completed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_score?: number
          created_at?: string
          id?: string
          total_correct_answers?: number
          total_questions_answered?: number
          total_tests_completed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          reset_date: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          tests_remaining: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reset_date?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          tests_remaining?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reset_date?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          tests_remaining?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_faculty_comparison: {
        Args: { p_faculty_id: string; p_user_id: string }
        Returns: {
          faculty_average: number
          subject_comparisons: Json
          your_success_rate: number
        }[]
      }
      get_leaderboard: {
        Args: never
        Returns: {
          activity_score: number
          is_current_user: boolean
          rank: number
          total_correct_answers: number
          total_questions_answered: number
          total_tests_completed: number
          user_id: string
        }[]
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      recalculate_user_statistics: { Args: never; Returns: undefined }
      reset_monthly_test_limit: { Args: never; Returns: undefined }
      resolve_question_report: {
        Args: { notes?: string; report_id: string; resolution_status: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      faculty_type:
        | "2LF"
        | "LF_BRNO"
        | "3LF"
        | "LFHK"
        | "1LF"
        | "LFPLZEN"
        | "LFOL"
        | "LFOSTRAVA"
      subject_type: "PHYSICS" | "CHEMISTRY" | "BIOLOGY"
      subscription_type: "free" | "premium"
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
    Enums: {
      app_role: ["admin", "user"],
      faculty_type: [
        "2LF",
        "LF_BRNO",
        "3LF",
        "LFHK",
        "1LF",
        "LFPLZEN",
        "LFOL",
        "LFOSTRAVA",
      ],
      subject_type: ["PHYSICS", "CHEMISTRY", "BIOLOGY"],
      subscription_type: ["free", "premium"],
    },
  },
} as const
