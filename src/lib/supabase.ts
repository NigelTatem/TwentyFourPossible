import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Always create a client, but we'll check validity in the database service
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' && 
         supabaseAnonKey !== 'placeholder-key' &&
         supabaseUrl.startsWith('https://') &&
         supabaseUrl.includes('.supabase.co')
}

// Database types
export interface Challenge {
  id: string
  user_id: string
  goal: string
  start_time: string
  end_time?: string
  completed: boolean
  rating?: number
  outcome?: string
  reflection?: string
  created_at: string
}

export interface CheckIn {
  id: string
  challenge_id: string
  milestone: number
  mood: string
  reflection?: string
  timestamp: string
}

export interface UserProfile {
  id: string
  streak: number
  total_challenges: number
  created_at: string
  updated_at: string
} 