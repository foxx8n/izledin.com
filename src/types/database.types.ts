export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      custom_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          items: Json | null
          likes_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          items?: Json | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          items?: Json | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      movie_mate_matches: {
        Row: {
          compatibility_score: number | null
          created_at: string | null
          id: string
          initiator_id: string | null
          shared_genres: string[] | null
          shared_titles: Json | null
          status: string
          updated_at: string | null
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          initiator_id?: string | null
          shared_genres?: string[] | null
          shared_titles?: Json | null
          status?: string
          updated_at?: string | null
          user_id_1: string
          user_id_2: string
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          initiator_id?: string | null
          shared_genres?: string[] | null
          shared_titles?: Json | null
          status?: string
          updated_at?: string | null
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_mate_matches_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_mate_matches_user_id_1_fkey"
            columns: ["user_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movie_mate_matches_user_id_2_fkey"
            columns: ["user_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          favorite_genres: string[] | null
          full_name: string | null
          id: string
          is_premium: boolean | null
          location: string | null
          match_enabled: boolean | null
          streaming_services: string[] | null
          top_4_favorites: Json | null
          total_watch_hours: number | null
          total_watched_count: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          favorite_genres?: string[] | null
          full_name?: string | null
          id: string
          is_premium?: boolean | null
          location?: string | null
          match_enabled?: boolean | null
          streaming_services?: string[] | null
          top_4_favorites?: Json | null
          total_watch_hours?: number | null
          total_watched_count?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          favorite_genres?: string[] | null
          full_name?: string | null
          id?: string
          is_premium?: boolean | null
          location?: string | null
          match_enabled?: boolean | null
          streaming_services?: string[] | null
          top_4_favorites?: Json | null
          total_watch_hours?: number | null
          total_watched_count?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      title_swipes: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          media_id: string
          media_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          media_id: string
          media_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          media_id?: string
          media_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "title_swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_logs: {
        Row: {
          backdrop_url: string | null
          created_at: string | null
          genres: string[] | null
          id: string
          is_favorite: boolean | null
          is_rewatch: boolean | null
          likes_count: number | null
          media_id: string
          media_type: string
          poster_url: string | null
          rating: number | null
          review: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
          watched_date: string | null
          year: number | null
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_rewatch?: boolean | null
          likes_count?: number | null
          media_id: string
          media_type: string
          poster_url?: string | null
          rating?: number | null
          review?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
          watched_date?: string | null
          year?: number | null
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string | null
          genres?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_rewatch?: boolean | null
          likes_count?: number | null
          media_id?: string
          media_type?: string
          poster_url?: string | null
          rating?: number | null
          review?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          watched_date?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_together_items: {
        Row: {
          added_by: string
          created_at: string | null
          id: string
          match_id: string
          media_id: string
          media_type: string
          poster_url: string | null
          status: string
          title: string
        }
        Insert: {
          added_by: string
          created_at?: string | null
          id?: string
          match_id: string
          media_id: string
          media_type: string
          poster_url?: string | null
          status?: string
          title: string
        }
        Update: {
          added_by?: string
          created_at?: string | null
          id?: string
          match_id?: string
          media_id?: string
          media_type?: string
          poster_url?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_together_items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_together_items_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "movie_mate_matches"
            referencedColumns: ["id"]
          },
        ]
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
