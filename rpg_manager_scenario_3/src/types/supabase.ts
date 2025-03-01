export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          user_id: string
          image_url: string | null
          members: Json | null
          imported_scenarios: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          user_id: string
          image_url?: string | null
          members?: Json | null
          imported_scenarios?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          user_id?: string
          image_url?: string | null
          members?: Json | null
          imported_scenarios?: Json | null
        }
      }
      scenarios: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          content: Json
          campaign_id: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          content: Json
          campaign_id: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          content?: Json
          campaign_id?: string
          user_id?: string
        }
      }
      npcs: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          traits: Json
          campaign_id: string
          user_id: string
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          traits: Json
          campaign_id: string
          user_id: string
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          traits?: Json
          campaign_id?: string
          user_id?: string
          image_url?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          created_at: string
          title: string
          date: string
          notes: string
          campaign_id: string
          user_id: string
          scenario_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          date: string
          notes: string
          campaign_id: string
          user_id: string
          scenario_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          date?: string
          notes?: string
          campaign_id?: string
          user_id?: string
          scenario_id?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          avatar_url: string | null
          email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          avatar_url?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          avatar_url?: string | null
          email?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}