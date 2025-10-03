export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          role: 'admin' | 'user' | 'viewer'
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          role?: 'admin' | 'user' | 'viewer'
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          role?: 'admin' | 'user' | 'viewer'
        }
      }
      database_1: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          created_at: string
          updated_at: string
          owner_id: string
          status: 'active' | 'inactive' | 'suspended'
          settings: {
            allow_member_invites: boolean
            require_approval: boolean
            max_members: number | null
          } | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
          owner_id: string
          status?: 'active' | 'inactive' | 'suspended'
          settings?: {
            allow_member_invites: boolean
            require_approval: boolean
            max_members: number | null
          } | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
          owner_id?: string
          status?: 'active' | 'inactive' | 'suspended'
          settings?: {
            allow_member_invites: boolean
            require_approval: boolean
            max_members: number | null
          } | null
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          status: 'active' | 'pending' | 'inactive'
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          status?: 'active' | 'pending' | 'inactive'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          status?: 'active' | 'pending' | 'inactive'
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add your three databases here
      database_2: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          updated_at: string
        }
      }
      database_3: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
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
      user_role: 'admin' | 'user' | 'viewer'
      organization_status: 'active' | 'inactive' | 'suspended'
      organization_member_role: 'owner' | 'admin' | 'member' | 'viewer'
      organization_member_status: 'active' | 'pending' | 'inactive'
    }
  }
}
