import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      food_fights: {
        Row: {
          id: string;
          name: string;
          status: 'nominating' | 'voting' | 'completed';
          creator_id: string;
          end_time: string;
          winner: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['food_fights']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['food_fights']['Insert']>;
      };
      restaurants: {
        Row: {
          id: string;
          food_fight_id: string;
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
      scores: {
        Row: {
          id: string;
          food_fight_id: string;
          user_id: string;
          restaurant_id: string;
          score: number;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['scores']['Row'],
          'id' | 'created_at'
        >;
        Update: Partial<Database['public']['Tables']['scores']['Insert']>;
      };
    };
  };
}; 