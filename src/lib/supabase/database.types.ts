// Generated from the Supabase schema. Do not edit by hand: regenerate after
// every migration (Supabase MCP `generate_typescript_types`, or
// `npx supabase gen types typescript --project-id qwvnhdghwycqlvsnlvlt`).

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
      account_settings: {
        Row: {
          adult_confirmed_at: string
          created_at: string
          logs_public_default: boolean
          privacy_notice_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adult_confirmed_at?: string
          created_at?: string
          logs_public_default?: boolean
          privacy_notice_version: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adult_confirmed_at?: string
          created_at?: string
          logs_public_default?: boolean
          privacy_notice_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          display_name: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      cocktail_ingredients: {
        Row: {
          amount: number
          cocktail_id: string
          icon: Database["public"]["Enums"]["ingredient_icon"]
          id: string
          ingredient_id: string | null
          name: string
          position: number
          unit: string
        }
        Insert: {
          amount: number
          cocktail_id: string
          icon: Database["public"]["Enums"]["ingredient_icon"]
          id?: string
          ingredient_id?: string | null
          name: string
          position: number
          unit: string
        }
        Update: {
          amount?: number
          cocktail_id?: string
          icon?: Database["public"]["Enums"]["ingredient_icon"]
          id?: string
          ingredient_id?: string | null
          name?: string
          position?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "cocktail_ingredients_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "cocktail_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      cocktails: {
        Row: {
          author_id: string | null
          base_alcohol: string
          color: string
          created_at: string
          flavor: string
          garnish: string
          glass: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          image_path: string | null
          instructions: string[]
          is_published: boolean
          name: string
          note: string | null
          slug: string
          sort_order: number
          subtitle: string
          tags: string[]
          updated_at: string
          vegan: boolean
        }
        Insert: {
          author_id?: string | null
          base_alcohol: string
          color: string
          created_at?: string
          flavor: string
          garnish?: string
          glass?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          image_path?: string | null
          instructions?: string[]
          is_published?: boolean
          name: string
          note?: string | null
          slug: string
          sort_order?: number
          subtitle?: string
          tags?: string[]
          updated_at?: string
          vegan?: boolean
        }
        Update: {
          author_id?: string | null
          base_alcohol?: string
          color?: string
          created_at?: string
          flavor?: string
          garnish?: string
          glass?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          image_path?: string | null
          instructions?: string[]
          is_published?: boolean
          name?: string
          note?: string | null
          slug?: string
          sort_order?: number
          subtitle?: string
          tags?: string[]
          updated_at?: string
          vegan?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cocktails_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_logs: {
        Row: {
          cocktail_id: string | null
          created_at: string
          drunk_on: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_public: boolean
          note: string | null
          rating: number | null
          recipe: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          cocktail_id?: string | null
          created_at?: string
          drunk_on?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_public?: boolean
          note?: string | null
          rating?: number | null
          recipe: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          cocktail_id?: string | null
          created_at?: string
          drunk_on?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_public?: boolean
          note?: string | null
          rating?: number | null
          recipe?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_logs_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_logs_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "drink_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          cocktail_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          cocktail_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          cocktail_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          always_at_hand: boolean
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at: string
          id: string
          name: string
        }
        Insert: {
          always_at_hand?: boolean
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          always_at_hand?: boolean
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      log_comments: {
        Row: {
          body: string
          created_at: string
          edited_at: string | null
          hidden_at: string | null
          hidden_by: string | null
          id: string
          log_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          edited_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          log_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          edited_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          log_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_comments_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "drink_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          cocktail_id: string | null
          comment_id: string | null
          created_at: string
          entry_id: string | null
          id: string
          log_id: string | null
          read_at: string | null
          review_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          cocktail_id?: string | null
          comment_id?: string | null
          created_at?: string
          entry_id?: string | null
          id?: string
          log_id?: string | null
          read_at?: string | null
          review_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          cocktail_id?: string | null
          comment_id?: string | null
          created_at?: string
          entry_id?: string | null
          id?: string
          log_id?: string | null
          read_at?: string | null
          review_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "log_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "showcase_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "drink_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          hidden_at?: string | null
          hidden_by?: string | null
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          cocktail_id: string
          created_at: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          cocktail_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          cocktail_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_entries: {
        Row: {
          cocktail_id: string
          created_at: string
          hidden_at: string | null
          hidden_by: string | null
          id: string
          period_id: string
          pitch: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["showcase_status"]
          user_id: string
          vote_count: number
        }
        Insert: {
          cocktail_id: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          period_id: string
          pitch: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["showcase_status"]
          user_id: string
          vote_count?: number
        }
        Update: {
          cocktail_id?: string
          created_at?: string
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          period_id?: string
          pitch?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["showcase_status"]
          user_id?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "showcase_entries_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_entries_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
          {
            foreignKeyName: "showcase_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "showcase_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      showcase_periods: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
        }
        Relationships: []
      }
      showcase_votes: {
        Row: {
          created_at: string
          entry_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "showcase_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "showcase_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cocktail_ratings: {
        Row: {
          average_rating: number | null
          cocktail_id: string | null
          half_star_counts: number[] | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "cocktails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cocktail_id_fkey"
            columns: ["cocktail_id"]
            isOneToOne: false
            referencedRelation: "recipe_popularity"
            referencedColumns: ["cocktail_id"]
          },
        ]
      }
      recipe_popularity: {
        Row: {
          cocktail_id: string | null
          recent_favorites: number | null
          recent_reviews: number | null
          score: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_my_account: { Args: never; Returns: undefined }
      orphan_photos: {
        Args: { max_rows?: number; min_age?: unknown }
        Returns: {
          bucket_id: string
          name: string
        }[]
      }
      save_cocktail: {
        Args: { cocktail: Json; ingredients: Json }
        Returns: string
      }
      save_recipe: {
        Args: { ingredients: Json; recipe: Json }
        Returns: string
      }
    }
    Enums: {
      admin_role: "owner" | "editor"
      ingredient_category:
        | "spirit"
        | "liqueur"
        | "juice"
        | "sweetener"
        | "mixer"
        | "fresh"
        | "other"
      ingredient_icon: "shot" | "dash" | "drop" | "slice" | "spoon" | "topup"
      notification_type:
        | "follow"
        | "log_comment"
        | "comment_thread"
        | "recipe_review"
        | "showcase_approved"
        | "showcase_rejected"
        | "content_hidden"
      report_target:
        | "profile"
        | "cocktail"
        | "review"
        | "drink_log"
        | "showcase_entry"
        | "log_comment"
      showcase_status: "pending" | "approved" | "rejected"
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
    Enums: {
      admin_role: ["owner", "editor"],
      ingredient_category: [
        "spirit",
        "liqueur",
        "juice",
        "sweetener",
        "mixer",
        "fresh",
        "other",
      ],
      ingredient_icon: ["shot", "dash", "drop", "slice", "spoon", "topup"],
      notification_type: [
        "follow",
        "log_comment",
        "comment_thread",
        "recipe_review",
        "showcase_approved",
        "showcase_rejected",
        "content_hidden",
      ],
      report_target: [
        "profile",
        "cocktail",
        "review",
        "drink_log",
        "showcase_entry",
        "log_comment",
      ],
      showcase_status: ["pending", "approved", "rejected"],
    },
  },
} as const
