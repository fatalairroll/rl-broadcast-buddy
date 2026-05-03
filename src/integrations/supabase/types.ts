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
      active_camera: {
        Row: {
          id: number
          target_name: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          target_name?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          target_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          mmr_match_id: string | null
          mmr_team_a_id: string | null
          mmr_team_b_id: string | null
          mmr_tournament_id: string | null
          name: string
          overlay_v2_preset_id: string | null
          player_pairings: Json
          series_type: string | null
          team_a_color: string | null
          team_a_game_score: number | null
          team_a_id: string | null
          team_a_logo: string | null
          team_a_name: string | null
          team_a_series_score: number | null
          team_b_color: string | null
          team_b_game_score: number | null
          team_b_id: string | null
          team_b_logo: string | null
          team_b_name: string | null
          team_b_series_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          mmr_match_id?: string | null
          mmr_team_a_id?: string | null
          mmr_team_b_id?: string | null
          mmr_tournament_id?: string | null
          name?: string
          overlay_v2_preset_id?: string | null
          player_pairings?: Json
          series_type?: string | null
          team_a_color?: string | null
          team_a_game_score?: number | null
          team_a_id?: string | null
          team_a_logo?: string | null
          team_a_name?: string | null
          team_a_series_score?: number | null
          team_b_color?: string | null
          team_b_game_score?: number | null
          team_b_id?: string | null
          team_b_logo?: string | null
          team_b_name?: string | null
          team_b_series_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          mmr_match_id?: string | null
          mmr_team_a_id?: string | null
          mmr_team_b_id?: string | null
          mmr_tournament_id?: string | null
          name?: string
          overlay_v2_preset_id?: string | null
          player_pairings?: Json
          series_type?: string | null
          team_a_color?: string | null
          team_a_game_score?: number | null
          team_a_id?: string | null
          team_a_logo?: string | null
          team_a_name?: string | null
          team_a_series_score?: number | null
          team_b_color?: string | null
          team_b_game_score?: number | null
          team_b_id?: string | null
          team_b_logo?: string | null
          team_b_name?: string | null
          team_b_series_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_sessions_overlay_v2_preset_id_fkey"
            columns: ["overlay_v2_preset_id"]
            isOneToOne: false
            referencedRelation: "overlay_presets_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_sessions_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_sessions_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_state: {
        Row: {
          id: number
          score_a: string
          score_b: string
          timer: string
        }
        Insert: {
          id: number
          score_a?: string
          score_b?: string
          timer?: string
        }
        Update: {
          id?: number
          score_a?: string
          score_b?: string
          timer?: string
        }
        Relationships: []
      }
      match_metadata: {
        Row: {
          blue_score: number
          id: number
          is_active: boolean
          is_overtime: boolean
          match_guid: string | null
          orange_score: number
          time_seconds: number
          timer: string
          updated_at: string
        }
        Insert: {
          blue_score?: number
          id?: number
          is_active?: boolean
          is_overtime?: boolean
          match_guid?: string | null
          orange_score?: number
          time_seconds?: number
          timer?: string
          updated_at?: string
        }
        Update: {
          blue_score?: number
          id?: number
          is_active?: boolean
          is_overtime?: boolean
          match_guid?: string | null
          orange_score?: number
          time_seconds?: number
          timer?: string
          updated_at?: string
        }
        Relationships: []
      }
      overlay_presets_v2: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      overlay_presets_v2_backup_20260430: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string | null
          is_default: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_default?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_default?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      players_live: {
        Row: {
          assists: number
          boost: number
          demos: number
          goals: number
          is_demolished: boolean
          is_on_ground: boolean
          is_supersonic: boolean
          last_goal_speed: number
          mmr: number | null
          player_name: string
          saves: number
          shots: number
          speed: number
          team_num: number
          updated_at: string
        }
        Insert: {
          assists?: number
          boost?: number
          demos?: number
          goals?: number
          is_demolished?: boolean
          is_on_ground?: boolean
          is_supersonic?: boolean
          last_goal_speed?: number
          mmr?: number | null
          player_name: string
          saves?: number
          shots?: number
          speed?: number
          team_num?: number
          updated_at?: string
        }
        Update: {
          assists?: number
          boost?: number
          demos?: number
          goals?: number
          is_demolished?: boolean
          is_on_ground?: boolean
          is_supersonic?: boolean
          last_goal_speed?: number
          mmr?: number | null
          player_name?: string
          saves?: number
          shots?: number
          speed?: number
          team_num?: number
          updated_at?: string
        }
        Relationships: []
      }
      players_registry: {
        Row: {
          country_code: string | null
          created_at: string
          display_name: string | null
          mmr: number | null
          notes: string | null
          photo_url: string | null
          player_name: string
          rank_name: string | null
          team_color: string | null
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          mmr?: number | null
          notes?: string | null
          photo_url?: string | null
          player_name: string
          rank_name?: string | null
          team_color?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          display_name?: string | null
          mmr?: number | null
          notes?: string | null
          photo_url?: string | null
          player_name?: string
          rank_name?: string | null
          team_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          short_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          short_name?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator"
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
      app_role: ["admin", "moderator"],
    },
  },
} as const
