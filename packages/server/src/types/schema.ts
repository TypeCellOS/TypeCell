export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          data: string
          id: string
          is_public: boolean
          nano_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          is_public: boolean
          nano_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          is_public?: boolean
          nano_id?: string
          updated_at?: string
          user_id?: string
        }
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

