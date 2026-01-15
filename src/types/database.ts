export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      brokers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          is_active: boolean;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_active?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_active?: boolean;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      broker_servers: {
        Row: {
          id: string;
          broker_id: string;
          server: string | null;
          server_name?: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          broker_id: string;
          server?: string | null;
          server_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          broker_id?: string;
          server?: string | null;
          server_name?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      licenses: {
        Row: {
          id: string;
          client_name: string;
          mt5_login: number;
          status: 'active' | 'expiring' | 'blocked';
          expires_at: string;
          notes: string;
          license_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          mt5_login: number;
          status?: 'active' | 'expiring' | 'blocked';
          expires_at: string;
          notes?: string;
          license_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_name?: string;
          mt5_login?: number;
          status?: 'active' | 'expiring' | 'blocked';
          expires_at?: string;
          notes?: string;
          license_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      license_brokers: {
        Row: {
          license_id: string;
          broker_id: string;
          created_at: string;
        };
        Insert: {
          license_id: string;
          broker_id: string;
          created_at?: string;
        };
        Update: {
          license_id?: string;
          broker_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      audit_logs: {
        Row: {
          id: string;
          action: string;
          entity: string;
          entity_id: string | null;
          meta: Json;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          entity: string;
          entity_id?: string | null;
          meta?: Json;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          meta?: Json;
          user_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      validation_logs: {
        Row: {
          id: string;
          license_id: string | null;
          validation_time: string;
          status: string;
          server_name: string | null;
          mt5_login: number | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string | null;
          action: string | null;
          status_old: string | null;
        };
        Insert: {
          id?: string;
          license_id?: string | null;
          validation_time?: string;
          status?: string;
          server_name?: string | null;
          mt5_login?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
          action?: string | null;
          status_old?: string | null;
        };
        Update: {
          id?: string;
          license_id?: string | null;
          validation_time?: string;
          status?: string;
          server_name?: string | null;
          mt5_login?: number | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string | null;
          action?: string | null;
          status_old?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      v_licenses_with_brokers: {
        Row: {
          id: string;
          client_name: string;
          mt5_login: number;
          status: 'active' | 'expiring' | 'blocked';
          expires_at: string;
          notes: string;
          license_key: string | null;
          created_at: string;
          updated_at: string;
          brokers: Array<{
            id: string;
            name: string;
            slug: string;
            is_active: boolean;
          }>;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<PropertyKey, never>;
    CompositeTypes: Record<PropertyKey, never>;
  };
};

export type License = Database['public']['Tables']['licenses']['Row'];
