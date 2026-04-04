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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          operator_id: string
          type: string
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          operator_id: string
          type: string
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          operator_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_metrics: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string
          date: string
          escalations: number | null
          failed_tool_calls: number | null
          id: string
          messages_sent_whatsapp: number | null
          operator_id: string
          promises_registered: number | null
          successful_tool_calls: number | null
          total_conversations: number | null
          total_messages: number | null
          total_tokens: number | null
          total_tool_calls: number | null
          updated_at: string
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          escalations?: number | null
          failed_tool_calls?: number | null
          id?: string
          messages_sent_whatsapp?: number | null
          operator_id: string
          promises_registered?: number | null
          successful_tool_calls?: number | null
          total_conversations?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          total_tool_calls?: number | null
          updated_at?: string
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          escalations?: number | null
          failed_tool_calls?: number | null
          id?: string
          messages_sent_whatsapp?: number | null
          operator_id?: string
          promises_registered?: number | null
          successful_tool_calls?: number | null
          total_conversations?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          total_tool_calls?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          operator_id: string
          status: string | null
          title: string | null
          total_messages: number | null
          total_tokens_used: number | null
          total_tool_calls: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          operator_id: string
          status?: string | null
          title?: string | null
          total_messages?: number | null
          total_tokens_used?: number | null
          total_tool_calls?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          operator_id?: string
          status?: string | null
          title?: string | null
          total_messages?: number | null
          total_tokens_used?: number | null
          total_tool_calls?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          response_time_ms: number | null
          role: string
          tokens_used: number | null
          tool_calls: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          response_time_ms?: number | null
          role: string
          tokens_used?: number | null
          tool_calls?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          response_time_ms?: number | null
          role?: string
          tokens_used?: number | null
          tool_calls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_reports: {
        Row: {
          content: string
          created_at: string
          id: string
          insights: Json | null
          operator_id: string
          period_end: string
          period_start: string
          report_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          insights?: Json | null
          operator_id: string
          period_end: string
          period_start: string
          report_type?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          insights?: Json | null
          operator_id?: string
          period_end?: string
          period_start?: string
          report_type?: string
          title?: string
        }
        Relationships: []
      }
      client_memory: {
        Row: {
          category: string
          client_id: string
          created_at: string
          id: string
          key: string
          operator_id: string
          updated_at: string
          value: string
        }
        Insert: {
          category?: string
          client_id: string
          created_at?: string
          id?: string
          key: string
          operator_id: string
          updated_at?: string
          value: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          id?: string
          key?: string
          operator_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_memory_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          cep: string | null
          city: string | null
          collector_id: string | null
          complement: string | null
          cpf: string
          created_at: string
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          number: string | null
          operator_id: string
          state: string | null
          status: string
          street: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          collector_id?: string | null
          complement?: string | null
          cpf: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          number?: string | null
          operator_id: string
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          cep?: string | null
          city?: string | null
          collector_id?: string | null
          complement?: string | null
          cpf?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          number?: string | null
          operator_id?: string
          state?: string | null
          status?: string
          street?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "collectors"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_logs: {
        Row: {
          channel: string
          client_id: string | null
          delivered_at: string | null
          id: string
          installment_id: string | null
          message_sent: string
          read_at: string | null
          rule_id: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          channel?: string
          client_id?: string | null
          delivered_at?: string | null
          id?: string
          installment_id?: string | null
          message_sent: string
          read_at?: string | null
          rule_id?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          client_id?: string | null
          delivered_at?: string | null
          id?: string
          installment_id?: string | null
          message_sent?: string
          read_at?: string | null
          rule_id?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_logs_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "collection_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message_template: string
          name: string
          tone: string
          trigger_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_template: string
          name: string
          tone?: string
          trigger_days: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message_template?: string
          name?: string
          tone?: string
          trigger_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collectors: {
        Row: {
          access_token: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          operator_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          operator_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          operator_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          ai_agent_active: boolean | null
          ai_agent_end_time: string | null
          ai_agent_start_time: string | null
          ai_agent_triggers: Json | null
          cnpj: string | null
          company_name: string | null
          created_at: string | null
          default_daily_interest: number | null
          default_fine_percentage: number | null
          default_frequency: string | null
          id: string
          logo_url: string | null
          n8n_active_events: Json | null
          n8n_webhook_url: string | null
          operator_id: string
          theme: string | null
          updated_at: string | null
          whatsapp_api_token: string | null
          whatsapp_display_phone: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          ai_agent_active?: boolean | null
          ai_agent_end_time?: string | null
          ai_agent_start_time?: string | null
          ai_agent_triggers?: Json | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          default_daily_interest?: number | null
          default_fine_percentage?: number | null
          default_frequency?: string | null
          id?: string
          logo_url?: string | null
          n8n_active_events?: Json | null
          n8n_webhook_url?: string | null
          operator_id: string
          theme?: string | null
          updated_at?: string | null
          whatsapp_api_token?: string | null
          whatsapp_display_phone?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          ai_agent_active?: boolean | null
          ai_agent_end_time?: string | null
          ai_agent_start_time?: string | null
          ai_agent_triggers?: Json | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string | null
          default_daily_interest?: number | null
          default_fine_percentage?: number | null
          default_frequency?: string | null
          id?: string
          logo_url?: string | null
          n8n_active_events?: Json | null
          n8n_webhook_url?: string | null
          operator_id?: string
          theme?: string | null
          updated_at?: string | null
          whatsapp_api_token?: string | null
          whatsapp_display_phone?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          capital: number
          client_id: string
          created_at: string
          daily_interest_rate: number | null
          daily_type: string | null
          fine_percentage: number | null
          first_due_date: string
          frequency: string
          id: string
          installment_value: number
          installments: number
          interest_rate: number
          operator_id: string
          renegotiated_from_id: string | null
          scheduled_days: Json | null
          start_date: string
          status: string
          total_amount: number
          total_profit: number
          updated_at: string
        }
        Insert: {
          capital: number
          client_id: string
          created_at?: string
          daily_interest_rate?: number | null
          daily_type?: string | null
          fine_percentage?: number | null
          first_due_date: string
          frequency?: string
          id?: string
          installment_value: number
          installments: number
          interest_rate: number
          operator_id: string
          renegotiated_from_id?: string | null
          scheduled_days?: Json | null
          start_date: string
          status?: string
          total_amount: number
          total_profit: number
          updated_at?: string
        }
        Update: {
          capital?: number
          client_id?: string
          created_at?: string
          daily_interest_rate?: number | null
          daily_type?: string | null
          fine_percentage?: number | null
          first_due_date?: string
          frequency?: string
          id?: string
          installment_value?: number
          installments?: number
          interest_rate?: number
          operator_id?: string
          renegotiated_from_id?: string | null
          scheduled_days?: Json | null
          start_date?: string
          status?: string
          total_amount?: number
          total_profit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_renegotiated_from_id_fkey"
            columns: ["renegotiated_from_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      document_files: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_files_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount_due: number
          amount_paid: number | null
          client_id: string
          contract_id: string
          created_at: string
          due_date: string
          fine: number | null
          id: string
          installment_number: number
          operator_id: string
          payment_date: string | null
          status: string
          total_installments: number
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          client_id: string
          contract_id: string
          created_at?: string
          due_date: string
          fine?: number | null
          id?: string
          installment_number: number
          operator_id: string
          payment_date?: string | null
          status?: string
          total_installments: number
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          client_id?: string
          contract_id?: string
          created_at?: string
          due_date?: string
          fine?: number | null
          id?: string
          installment_number?: number
          operator_id?: string
          payment_date?: string | null
          status?: string
          total_installments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cnpj: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cnpj?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cnpj?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treasury_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          operator_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          operator_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          operator_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          id: string
          instance_name: string
          operator_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_name: string
          operator_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_name?: string
          operator_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_overdue_installments: { Args: never; Returns: undefined }
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
