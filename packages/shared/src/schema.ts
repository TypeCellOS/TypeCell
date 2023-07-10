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
          document_id: string
          user_id: string
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          document_id: string
          user_id: string
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          document_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_document_id_fkey"
            columns: ["document_id"]
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_permissions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      document_relations: {
        Row: {
          child_id: string
          parent_id: string
        }
        Insert: {
          child_id: string
          parent_id: string
        }
        Update: {
          child_id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_child_id_fkey"
            columns: ["child_id"]
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relations_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "documents"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          document_nano_id: string
          id: string
          is_username: boolean
          name: string
          owner_user_id: string
        }
        Insert: {
          created_at?: string
          document_nano_id: string
          id?: string
          is_username: boolean
          name: string
          owner_user_id: string
        }
        Update: {
          created_at?: string
          document_nano_id?: string
          id?: string
          is_username?: boolean
          name?: string
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_document_nano_id_fkey"
            columns: ["document_nano_id"]
            referencedRelation: "documents"
            referencedColumns: ["nano_id"]
          },
          {
            foreignKeyName: "workspaces_owner_user_id_fkey"
            columns: ["owner_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

