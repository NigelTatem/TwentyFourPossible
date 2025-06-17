import { supabase, isSupabaseConfigured, Challenge, CheckIn, UserProfile } from './supabase'

// Generate a simple user ID (in a real app, you'd use proper authentication)
const getUserId = () => {
  let userId = localStorage.getItem('make24matter_user_id')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('make24matter_user_id', userId)
  }
  return userId
}

export class DatabaseService {
  // Check if Supabase is configured
  private static isSupabaseConfigured(): boolean {
    return isSupabaseConfigured();
  }

  // User Profile Operations
  static async getUserProfile(): Promise<UserProfile | null> {
    if (!this.isSupabaseConfigured()) {
      // Fallback to localStorage
      const streak = parseInt(localStorage.getItem('make24matter_streak') || '0');
      const totalChallenges = parseInt(localStorage.getItem('make24matter_total_challenges') || '0');
      return {
        id: getUserId(),
        streak,
        total_challenges: totalChallenges,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const userId = getUserId()
    
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user profile:', error)
      return null
    }

    if (!data) {
      // Create new user profile
      const newProfile: Omit<UserProfile, 'created_at' | 'updated_at'> = {
        id: userId,
        streak: 0,
        total_challenges: 0
      }

      const { data: createdProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single()

      if (createError) {
        console.error('Error creating user profile:', createError)
        return null
      }

      return createdProfile
    }

    return data
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    if (!this.isSupabaseConfigured()) {
      // Fallback to localStorage
      if (updates.streak !== undefined) {
        localStorage.setItem('make24matter_streak', updates.streak.toString());
      }
      if (updates.total_challenges !== undefined) {
        localStorage.setItem('make24matter_total_challenges', updates.total_challenges.toString());
      }
      return true;
    }

    const userId = getUserId()
    
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }

    return true
  }

  // Challenge Operations
  static async createChallenge(goal: string): Promise<string | null> {
    const challengeId = 'challenge_' + Math.random().toString(36).substr(2, 9)
    
    if (!this.isSupabaseConfigured()) {
      // Fallback to localStorage - just return the ID
      return challengeId;
    }

    const userId = getUserId()
    
    const newChallenge: Omit<Challenge, 'created_at'> = {
      id: challengeId,
      user_id: userId,
      goal,
      start_time: new Date().toISOString(),
      completed: false
    }

    const { error } = await supabase
      .from('challenges')
      .insert([newChallenge])

    if (error) {
      console.error('Error creating challenge:', error)
      return null
    }

    return challengeId
  }

  static async completeChallenge(
    challengeId: string, 
    rating: number, 
    outcome: string, 
    reflection: string
  ): Promise<boolean> {
    if (!this.isSupabaseConfigured()) {
      // Fallback to localStorage - already handled in ProofScreen component
      // Just update the streak and total challenges
      const profile = await this.getUserProfile();
      if (profile) {
        await this.updateUserProfile({
          streak: profile.streak + 1,
          total_challenges: profile.total_challenges + 1
        });
      }
      return true;
    }

    const { error } = await supabase
      .from('challenges')
      .update({
        completed: true,
        end_time: new Date().toISOString(),
        rating,
        outcome,
        reflection
      })
      .eq('id', challengeId)

    if (error) {
      console.error('Error completing challenge:', error)
      return false
    }

    // Update user streak and total challenges
    const profile = await this.getUserProfile()
    if (profile) {
      await this.updateUserProfile({
        streak: profile.streak + 1,
        total_challenges: profile.total_challenges + 1
      })
    }

    return true
  }

  static async getUserChallenges(): Promise<Challenge[]> {
    if (!this.isSupabaseConfigured()) {
      // Fallback to localStorage
      const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
      return completions.map((comp: any) => ({
        id: 'local_' + comp.completedAt,
        user_id: getUserId(),
        goal: comp.goal,
        start_time: new Date(comp.completedAt - 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(comp.completedAt).toISOString(),
        completed: true,
        rating: comp.rating,
        outcome: comp.outcome,
        reflection: comp.reflection,
        created_at: new Date(comp.completedAt - 24 * 60 * 60 * 1000).toISOString()
      }));
    }

    const userId = getUserId()
    
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching challenges:', error)
      return []
    }

    return data || []
  }

  // Check-in Operations
  static async createCheckIn(
    challengeId: string, 
    milestone: number, 
    mood: string, 
    reflection?: string
  ): Promise<boolean> {
    if (!this.isSupabaseConfigured()) {
      // Fallback to localStorage - already handled in MilestoneNudge component
      return true;
    }

    const checkInId = 'checkin_' + Math.random().toString(36).substr(2, 9)
    
    const newCheckIn: CheckIn = {
      id: checkInId,
      challenge_id: challengeId,
      milestone,
      mood,
      reflection,
      timestamp: new Date().toISOString()
    }

    const { error } = await supabase
      .from('check_ins')
      .insert([newCheckIn])

    if (error) {
      console.error('Error creating check-in:', error)
      return false
    }

    return true
  }

  static async getChallengeCheckIns(challengeId: string): Promise<CheckIn[]> {
    const { data, error } = await supabase
      .from('check_ins')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching check-ins:', error)
      return []
    }

    return data || []
  }

  // Memory Binder - Get all user data
  static async getMemoryBinder(): Promise<{
    profile: UserProfile | null
    challenges: Challenge[]
    recentCheckIns: CheckIn[]
  }> {
    const [profile, challenges] = await Promise.all([
      this.getUserProfile(),
      this.getUserChallenges()
    ])

    // Get recent check-ins from last 5 challenges
    const recentChallengeIds = challenges.slice(0, 5).map(c => c.id)
    let recentCheckIns: CheckIn[] = []
    
    if (recentChallengeIds.length > 0) {
      const { data } = await supabase
        .from('check_ins')
        .select('*')
        .in('challenge_id', recentChallengeIds)
        .order('timestamp', { ascending: false })
        .limit(20)

      recentCheckIns = data || []
    }

    return {
      profile,
      challenges,
      recentCheckIns
    }
  }
} 