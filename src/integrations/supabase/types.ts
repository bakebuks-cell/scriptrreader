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
      bot_configurations: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          module_type: string
          settings_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          module_type: string
          settings_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          module_type?: string
          settings_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_configurations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "market_maker_bots"
            referencedColumns: ["id"]
          },
        ]
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
      engine_logs: {
        Row: {
          category: string
          created_at: string
          details: Json | null
          id: string
          log_type: string
          message: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          script_id: string | null
          symbol: string | null
          timeframe: string | null
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          details?: Json | null
          id?: string
          log_type?: string
          message: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          script_id?: string | null
          symbol?: string | null
          timeframe?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json | null
          id?: string
          log_type?: string
          message?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          script_id?: string | null
          symbol?: string | null
          timeframe?: string | null
          user_id?: string | null
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
      lifetime_free_emails: {
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
      market_data_cache: {
        Row: {
          cache_expiry_time: string | null
          candle_count: number | null
          created_at: string | null
          current_price: number | null
          data_payload: Json | null
          fetch_duration_ms: number | null
          fetch_status: string | null
          fetched_at: string | null
          id: string
          latest_candle_time: number | null
          symbol: string
          timeframe: string
        }
        Insert: {
          cache_expiry_time?: string | null
          candle_count?: number | null
          created_at?: string | null
          current_price?: number | null
          data_payload?: Json | null
          fetch_duration_ms?: number | null
          fetch_status?: string | null
          fetched_at?: string | null
          id?: string
          latest_candle_time?: number | null
          symbol: string
          timeframe: string
        }
        Update: {
          cache_expiry_time?: string | null
          candle_count?: number | null
          created_at?: string | null
          current_price?: number | null
          data_payload?: Json | null
          fetch_duration_ms?: number | null
          fetch_status?: string | null
          fetched_at?: string | null
          id?: string
          latest_candle_time?: number | null
          symbol?: string
          timeframe?: string
        }
        Relationships: []
      }
      market_maker_bots: {
        Row: {
          auto_stop_at: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_stop_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_stop_at?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          crypto_symbol: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subscription_ends_at: string | null
          subscription_starts_at: string | null
          tx_hash: string
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          crypto_symbol?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          tx_hash: string
          updated_at?: string
          user_id: string
          wallet_address?: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          crypto_symbol?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          tx_hash?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
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
          deleted_at: string | null
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
          timezone: string
          trading_pairs: string[] | null
          updated_at: string
          validation_errors: string[]
          validation_status: string
          webhook_secret: string
        }
        Insert: {
          admin_tag?: string | null
          allowed_timeframes?: string[]
          candle_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
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
          timezone?: string
          trading_pairs?: string[] | null
          updated_at?: string
          validation_errors?: string[]
          validation_status?: string
          webhook_secret?: string
        }
        Update: {
          admin_tag?: string | null
          allowed_timeframes?: string[]
          candle_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
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
          timezone?: string
          trading_pairs?: string[] | null
          updated_at?: string
          validation_errors?: string[]
          validation_status?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bot_enabled: boolean
          coins: number
          created_at: string
          daily_profit_target: number | null
          daily_target_reset_at: string | null
          display_name: string | null
          email: string | null
          feature_access: boolean
          free_trades_remaining: number
          id: string
          login_access: boolean
          selected_timeframes: string[] | null
          strategy_opposite_policy: string
          subscription_active: boolean
          trade_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_enabled?: boolean
          coins?: number
          created_at?: string
          daily_profit_target?: number | null
          daily_target_reset_at?: string | null
          display_name?: string | null
          email?: string | null
          feature_access?: boolean
          free_trades_remaining?: number
          id?: string
          login_access?: boolean
          selected_timeframes?: string[] | null
          strategy_opposite_policy?: string
          subscription_active?: boolean
          trade_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_enabled?: boolean
          coins?: number
          created_at?: string
          daily_profit_target?: number | null
          daily_target_reset_at?: string | null
          display_name?: string | null
          email?: string | null
          feature_access?: boolean
          free_trades_remaining?: number
          id?: string
          login_access?: boolean
          selected_timeframes?: string[] | null
          strategy_opposite_policy?: string
          subscription_active?: boolean
          trade_mode?: string
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
      session_config: {
        Row: {
          id: string
          max_sessions_per_user: number
          multi_device_enabled: boolean
          session_timeout_hours: number
          updated_at: string
        }
        Insert: {
          id?: string
          max_sessions_per_user?: number
          multi_device_enabled?: boolean
          session_timeout_hours?: number
          updated_at?: string
        }
        Update: {
          id?: string
          max_sessions_per_user?: number
          multi_device_enabled?: boolean
          session_timeout_hours?: number
          updated_at?: string
        }
        Relationships: []
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
      strategy_state: {
        Row: {
          consecutive_errors: number | null
          created_at: string | null
          error_count: number | null
          execution_count: number | null
          id: string
          last_checked_time: string | null
          last_data_update_time: string | null
          last_error: string | null
          last_execution_candle_time: number | null
          last_failed_api_fetch_time: string | null
          last_order_time: string | null
          last_processed_candle_time: number | null
          last_signal_side: string | null
          last_signal_time: string | null
          last_successful_api_fetch_time: string | null
          next_check_time: string | null
          script_id: string
          signal_lock_status: string | null
          status: string
          symbol: string
          timeframe: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consecutive_errors?: number | null
          created_at?: string | null
          error_count?: number | null
          execution_count?: number | null
          id?: string
          last_checked_time?: string | null
          last_data_update_time?: string | null
          last_error?: string | null
          last_execution_candle_time?: number | null
          last_failed_api_fetch_time?: string | null
          last_order_time?: string | null
          last_processed_candle_time?: number | null
          last_signal_side?: string | null
          last_signal_time?: string | null
          last_successful_api_fetch_time?: string | null
          next_check_time?: string | null
          script_id: string
          signal_lock_status?: string | null
          status?: string
          symbol: string
          timeframe: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consecutive_errors?: number | null
          created_at?: string | null
          error_count?: number | null
          execution_count?: number | null
          id?: string
          last_checked_time?: string | null
          last_data_update_time?: string | null
          last_error?: string | null
          last_execution_candle_time?: number | null
          last_failed_api_fetch_time?: string | null
          last_order_time?: string | null
          last_processed_candle_time?: number | null
          last_signal_side?: string | null
          last_signal_time?: string | null
          last_successful_api_fetch_time?: string | null
          next_check_time?: string | null
          script_id?: string
          signal_lock_status?: string | null
          status?: string
          symbol?: string
          timeframe?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_settings: {
        Row: {
          created_at: string
          crypto_decimals: number
          crypto_name: string
          crypto_symbol: string
          id: string
          monthly_amount: number
          receiver_wallet_address: string
          subscription_mode_enabled: boolean
          trial_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          crypto_decimals?: number
          crypto_name?: string
          crypto_symbol?: string
          id?: string
          monthly_amount?: number
          receiver_wallet_address?: string
          subscription_mode_enabled?: boolean
          trial_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          crypto_decimals?: number
          crypto_name?: string
          crypto_symbol?: string
          id?: string
          monthly_amount?: number
          receiver_wallet_address?: string
          subscription_mode_enabled?: boolean
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
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
          leverage: number | null
          margin_amount: number | null
          opened_at: string | null
          pnl: number | null
          quantity: number | null
          script_id: string | null
          signal_id: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          status: Database["public"]["Enums"]["trade_status"]
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          timeframe: string
          trade_amount_used: number | null
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
          leverage?: number | null
          margin_amount?: number | null
          opened_at?: string | null
          pnl?: number | null
          quantity?: number | null
          script_id?: string | null
          signal_id?: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["trade_status"]
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          timeframe: string
          trade_amount_used?: number | null
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
          leverage?: number | null
          margin_amount?: number | null
          opened_at?: string | null
          pnl?: number | null
          quantity?: number | null
          script_id?: string | null
          signal_id?: string | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          status?: Database["public"]["Enums"]["trade_status"]
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          timeframe?: string
          trade_amount_used?: number | null
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
      tradingview_ohlc_collection: {
        Row: {
          candle_time: string
          candle_type: string
          close: number
          high: number
          id: string
          low: number
          open: number
          raw_payload: Json | null
          received_at: string
          source: string
          symbol: string
          timeframe: string
          volume: number | null
        }
        Insert: {
          candle_time: string
          candle_type?: string
          close: number
          high: number
          id?: string
          low: number
          open: number
          raw_payload?: Json | null
          received_at?: string
          source?: string
          symbol: string
          timeframe: string
          volume?: number | null
        }
        Update: {
          candle_time?: string
          candle_type?: string
          close?: number
          high?: number
          id?: string
          low?: number
          open?: number
          raw_payload?: Json | null
          received_at?: string
          source?: string
          symbol?: string
          timeframe?: string
          volume?: number | null
        }
        Relationships: []
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
          settings_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_id: string
          settings_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          script_id?: string
          settings_json?: Json
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
      user_sessions: {
        Row: {
          created_at: string
          device_info: string | null
          expiry_time: string
          id: string
          ip_address: string | null
          last_activity_time: string
          login_time: string
          session_id: string
          session_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          expiry_time?: string
          id?: string
          ip_address?: string | null
          last_activity_time?: string
          login_time?: string
          session_id: string
          session_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          expiry_time?: string
          id?: string
          ip_address?: string | null
          last_activity_time?: string
          login_time?: string
          session_id?: string
          session_status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_trading_settings: {
        Row: {
          created_at: string
          default_leverage: number
          default_margin: number
          default_stop_loss: number | null
          default_take_profit: number | null
          default_trade_amount: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_leverage?: number
          default_margin?: number
          default_stop_loss?: number | null
          default_take_profit?: number | null
          default_trade_amount?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_leverage?: number
          default_margin?: number
          default_stop_loss?: number | null
          default_take_profit?: number | null
          default_trade_amount?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      create_user_session: {
        Args: { _device_info?: string; _ip_address?: string; _user_id: string }
        Returns: Json
      }
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
      validate_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: Json
      }
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
