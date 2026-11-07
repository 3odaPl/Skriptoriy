// Generated from the Supabase schema (project Scriptoriya). Regenerate after schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }

export type Database = {
  __InternalSupabase: { PostgrestVersion: '14.18' }
  public: {
    Tables: {
      categories: {
        Row: { id: number; name: string; slug: string; sort: number }
        Insert: { id?: never; name: string; slug: string; sort?: number }
        Update: { id?: never; name?: string; slug?: string; sort?: number }
        Relationships: []
      }
      games: {
        Row: { channel: string | null; cover_path: string | null; created_at: string; description: string | null; id: string; name: string; platform: string; slug: string; url: string | null }
        Insert: { channel?: string | null; cover_path?: string | null; created_at?: string; description?: string | null; id?: string; name: string; platform: string; slug: string; url?: string | null }
        Update: { channel?: string | null; cover_path?: string | null; created_at?: string; description?: string | null; id?: string; name?: string; platform?: string; slug?: string; url?: string | null }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; bio: string | null; created_at: string; display_name: string | null; id: string; role: Database['public']['Enums']['user_role']; twitch_id: string | null; username: string | null }
        Insert: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string | null; id: string; role?: Database['public']['Enums']['user_role']; twitch_id?: string | null; username?: string | null }
        Update: { avatar_url?: string | null; bio?: string | null; created_at?: string; display_name?: string | null; id?: string; role?: Database['public']['Enums']['user_role']; twitch_id?: string | null; username?: string | null }
        Relationships: []
      }
      reports: {
        Row: { created_at: string; id: string; reason: string; resolved_at: string | null; resolved_by: string | null; script_id: string; status: string; user_id: string }
        Insert: { created_at?: string; id?: string; reason: string; resolved_at?: string | null; resolved_by?: string | null; script_id: string; status?: string; user_id?: string }
        Update: { created_at?: string; id?: string; reason?: string; resolved_at?: string | null; resolved_by?: string | null; script_id?: string; status?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'reports_resolved_by_fkey'; columns: ['resolved_by']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'reports_script_id_fkey'; columns: ['script_id']; isOneToOne: false; referencedRelation: 'scripts'; referencedColumns: ['id'] },
          { foreignKeyName: 'reports_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      reviews: {
        Row: { body: string; created_at: string; id: string; rating: number; script_id: string; updated_at: string; user_id: string }
        Insert: { body?: string; created_at?: string; id?: string; rating: number; script_id: string; updated_at?: string; user_id?: string }
        Update: { body?: string; created_at?: string; id?: string; rating?: number; script_id?: string; updated_at?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: 'reviews_script_id_fkey'; columns: ['script_id']; isOneToOne: false; referencedRelation: 'scripts'; referencedColumns: ['id'] },
          { foreignKeyName: 'reviews_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
        ]
      }
      screenshots: {
        Row: { created_at: string; id: string; path: string; position: number; script_id: string }
        Insert: { created_at?: string; id?: string; path: string; position?: number; script_id: string }
        Update: { created_at?: string; id?: string; path?: string; position?: number; script_id?: string }
        Relationships: [
          { foreignKeyName: 'screenshots_script_id_fkey'; columns: ['script_id']; isOneToOne: false; referencedRelation: 'scripts'; referencedColumns: ['id'] },
        ]
      }
      script_versions: {
        Row: { autocheck: Json | null; changelog: string; code: string | null; created_at: string; file_path: string | null; id: string; review_note: string | null; reviewed_at: string | null; reviewer_id: string | null; script_id: string; status: Database['public']['Enums']['version_status']; version: string }
        Insert: { autocheck?: Json | null; changelog?: string; code?: string | null; created_at?: string; file_path?: string | null; id?: string; review_note?: string | null; reviewed_at?: string | null; reviewer_id?: string | null; script_id: string; status?: Database['public']['Enums']['version_status']; version: string }
        Update: { autocheck?: Json | null; changelog?: string; code?: string | null; created_at?: string; file_path?: string | null; id?: string; review_note?: string | null; reviewed_at?: string | null; reviewer_id?: string | null; script_id?: string; status?: Database['public']['Enums']['version_status']; version?: string }
        Relationships: [
          { foreignKeyName: 'script_versions_reviewer_id_fkey'; columns: ['reviewer_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'script_versions_script_id_fkey'; columns: ['script_id']; isOneToOne: false; referencedRelation: 'scripts'; referencedColumns: ['id'] },
        ]
      }
      scripts: {
        Row: { author_id: string; category_id: number | null; created_at: string; current_version_id: string | null; description: string; game_id: string; id: string; installs_count: number; kind: Database['public']['Enums']['script_kind']; open_reports: number; published_at: string | null; rating_avg: number; rating_count: number; short_desc: string; slug: string; status: Database['public']['Enums']['script_status']; store_url: string | null; title: string; updated_at: string }
        Insert: { author_id?: string; category_id?: number | null; created_at?: string; current_version_id?: string | null; description?: string; game_id: string; id?: string; installs_count?: number; kind?: Database['public']['Enums']['script_kind']; open_reports?: number; published_at?: string | null; rating_avg?: number; rating_count?: number; short_desc?: string; slug: string; status?: Database['public']['Enums']['script_status']; store_url?: string | null; title: string; updated_at?: string }
        Update: { author_id?: string; category_id?: number | null; created_at?: string; current_version_id?: string | null; description?: string; game_id?: string; id?: string; installs_count?: number; kind?: Database['public']['Enums']['script_kind']; open_reports?: number; published_at?: string | null; rating_avg?: number; rating_count?: number; short_desc?: string; slug?: string; status?: Database['public']['Enums']['script_status']; store_url?: string | null; title?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: 'scripts_author_id_fkey'; columns: ['author_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] },
          { foreignKeyName: 'scripts_category_id_fkey'; columns: ['category_id']; isOneToOne: false; referencedRelation: 'categories'; referencedColumns: ['id'] },
          { foreignKeyName: 'scripts_current_version_fk'; columns: ['current_version_id']; isOneToOne: false; referencedRelation: 'script_versions'; referencedColumns: ['id'] },
          { foreignKeyName: 'scripts_game_id_fkey'; columns: ['game_id']; isOneToOne: false; referencedRelation: 'games'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_install: {
        Args: { p_count?: boolean; p_game: string; p_slug: string }
        Returns: { author: string; code: string; file_path: string; kind: Database['public']['Enums']['script_kind']; script_id: string; title: string; version: string }[]
      }
      moderate_version: { Args: { p_approve: boolean; p_note?: string; p_version_id: string }; Returns: undefined }
      resolve_report: { Args: { p_dismiss: boolean; p_report: string }; Returns: undefined }
      set_script_status: { Args: { p_script: string; p_status: Database['public']['Enums']['script_status'] }; Returns: undefined }
      set_user_role: { Args: { p_role: Database['public']['Enums']['user_role']; p_user: string }; Returns: undefined }
      submit_version: { Args: { p_version_id: string }; Returns: string }
    }
    Enums: {
      script_kind: 'userscript' | 'extension'
      script_status: 'draft' | 'pending' | 'published' | 'rejected' | 'hidden'
      user_role: 'user' | 'trusted' | 'moderator' | 'admin'
      version_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type _Rel = Rel
