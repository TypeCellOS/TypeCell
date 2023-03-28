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
      document_permissions: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          document_id: string | null
          user_id: string | null
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          document_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          document_id?: string | null
          user_id?: string | null
        }
      }
      document_relations: {
        Row: {
          child_id: string | null
          parent_id: string | null
        }
        Insert: {
          child_id?: string | null
          parent_id?: string | null
        }
        Update: {
          child_id?: string | null
          parent_id?: string | null
        }
      }
      documents: {
        Row: {
          created_at: string
          data: string
          id: string
          nano_id: string
          public_access_level: Database["public"]["Enums"]["access_level"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          nano_id: string
          public_access_level: Database["public"]["Enums"]["access_level"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          nano_id?: string
          public_access_level?: Database["public"]["Enums"]["access_level"]
          updated_at?: string
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_document_access: {
        Args: {
          uid: string
          doc_id: string
        }
        Returns: Database["public"]["Enums"]["access_level"]
      }
    }
    Enums: {
      access_level: "no-access" | "read" | "write"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

