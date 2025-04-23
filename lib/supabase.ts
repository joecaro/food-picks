import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string;
          name: string;
          status: 'nominating' | 'voting' | 'completed';
          creator_id: string;
          current_round: number;
          end_time: string;
          winner: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['tournaments']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['tournaments']['Insert']>;
      };
      restaurants: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          cuisine: string;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['restaurants']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>;
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          round: number;
          restaurant1_id: string;
          restaurant2_id: string | null;
          votes1: number;
          votes2: number;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['matches']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['matches']['Insert']>;
      };
      votes: {
        Row: {
          id: string;
          match_id: string;
          user_id: string;
          restaurant_id: string;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['votes']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['votes']['Insert']>;
      };
    };
  };
}; 