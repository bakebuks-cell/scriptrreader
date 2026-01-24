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
      admin_whitelist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      coin_audit_log: {
        Row: {
          action: string
          coins_after: number
          coins_before: number
          created_at: string
          id: string
          performed_by: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          coins_after: number
          coins_before: number
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          coins_after?: number
          coins_before?: number
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coin_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          reason: string | null
          requested_coins: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_coins?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          reason?: string | null
          requested_coins?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_keys: {
        Row: {
          api_key_encrypted: string
          api_secret_encrypted: string
          created_at: string
          exchange: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_secret_encrypted: string
          created_at?: string
          exchange?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_secret_encrypted?: string
          created_at?: string
          exchange?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pine_scripts: {
        Row: {
          admin_tag: string | null
          allowed_timeframes: string[]
          candle_type: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          leverage: number | null
          market_type: string | null
          max_capital: number | null
          max_trades_per_day: number | null
          multi_pair_mode: boolean | null
          name: string
          position_size_type: string | null
          position_size_value: number | null
          script_content: string
          symbol: string
          trading_pairs: string[] | null
          updated_at: string
          webhook_secret: string
        }
        Insert: {
          admin_tag?: string | null
          allowed_timeframes?: string[]
          candle_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leverage?: number | null
          market_type?: string | null
          max_capital?: number | null
          max_trades_per_day?: number | null
          multi_pair_mode?: boolean | null
          name: string
          position_size_type?: string | null
          position_size_value?: number | null
          script_content: string
          symbol: string
          trading_pairs?: string[] | null
          updated_at?: string
          webhook_secret?: string
        }
        Update: {
          admin_tag?: string | null
          allowed_timeframes?: string[]
          candle_type?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leverage?: number | null
          market_type?: string | null
          max_capital?: number | null
          max_trades_per_day?: number | null
          multi_pair_mode?: boolean | null
          name?: string
          position_size_type?: string | null
          position_size_value?: number | null
          script_content?: string
          symbol?: string
          trading_pairs?: string[] | null
          updated_at?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bot_enabled: boolean
          coins: number
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          selected_timeframes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_enabled?: boolean
          coins?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          selected_timeframes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_enabled?: boolean
          coins?: number
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          selected_timeframes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      script_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          script_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          script_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          script_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_reports_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "pine_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          candle_timestamp: string
          id: string
          price: number | null
          processed: boolean
          received_at: string
          script_id: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
        }
        Insert: {
          candle_timestamp: string
          id?: string
          price?: number | null
          processed?: boolean
          received_at?: string
          script_id: string
          signal_type: Database["public"]["Enums"]["signal_type"]
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe: string
        }
        Update: {
          candle_timestamp?: string
          id?: string
          price?: number | null
          processed?: boolean
          received_at?: string
          script_id?: string
          signal_type?: Database["public"]["Enums"]["signal_type"]
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "pine_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          closed_at: string | null
          coin_consumed: boolean
          coin_locked: boolean
          created_at: string
          entry_price: number | null
          error_message: string | null
          exit_price: number | null
          id: string
          opened_at: string | null
          script_id: string | null
          signal_id: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          status: Database["public"]["Enums"]["trade_status"]
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          coin_consumed?: boolean
          coin_locked?: boolean
          created_at?: string
          entry_price?: number | null
          error_message?: string | null
          exit_price?: number | null
          id?: string
          opened_at?: string | null
          script_id?: string | null
          signal_id?: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["trade_status"]
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          coin_consumed?: boolean
          coin_locked?: boolean
          created_at?: string
          entry_price?: number | null
          error_message?: string | null
          exit_price?: number | null
          id?: string
          opened_at?: string | null
          script_id?: string | null
          signal_id?: string | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["trade_status"]
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "pine_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
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
        Relationships: []
      }
      user_scripts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          script_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_scripts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "pine_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          created_at: string
          exchange: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          name: string
          role: Database["public"]["Enums"]["wallet_role"]
          total_balance_usdt: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          exchange?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          role?: Database["public"]["Enums"]["wallet_role"]
          total_balance_usdt?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          exchange?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          name?: string
          role?: Database["public"]["Enums"]["wallet_role"]
          total_balance_usdt?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_email: { Args: { check_email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      report_reason: "SPAM" | "SCAM" | "FAKE_STRATEGY" | "OFFENSIVE" | "OTHER"
      report_status: "PENDING" | "REVIEWED" | "RESOLVED"
      signal_type: "BUY" | "SELL"
      trade_status: "PENDING" | "OPEN" | "CLOSED" | "FAILED" | "CANCELLED"
      wallet_role: "ADMIN" | "USER"
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
      report_reason: ["SPAM", "SCAM", "FAKE_STRATEGY", "OFFENSIVE", "OTHER"],
      report_status: ["PENDING", "REVIEWED", "RESOLVED"],
      signal_type: ["BUY", "SELL"],
      trade_status: ["PENDING", "OPEN", "CLOSED", "FAILED", "CANCELLED"],
      wallet_role: ["ADMIN", "USER"],
    },
  },
} as const
