// Simplified database service using localStorage only
// Account features coming soon!

export interface Challenge {
  id: string;
  user_id: string;
  goal: string;
  start_time: string;
  end_time?: string;
  completed: boolean;
  rating?: number;
  outcome?: string;
  reflection?: string;
  created_at: string;
}

export interface CheckIn {
  id: string;
  challenge_id: string;
  milestone: number;
  mood: string;
  reflection?: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  total_challenges: number;
  created_at: string;
  updated_at: string;
}

// Generate a simple user ID for local storage
const getLocalUserId = () => {
  let userId = localStorage.getItem('make24matter_user_id')
  if (!userId) {
    userId = 'local_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('make24matter_user_id', userId)
  }
  return userId
}

export class DatabaseService {
  // User Profile Operations
  static async getUserProfile(): Promise<UserProfile | null> {
    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    return {
      id: getLocalUserId(),
      total_challenges: completions.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
    // For localStorage, profile is calculated from completions
    return true;
  }

  // Challenge Operations
  static async createChallenge(goal: string): Promise<string | null> {
    const challengeId = 'challenge_' + Math.random().toString(36).substr(2, 9)
    
    // Store in localStorage for persistence
    localStorage.setItem('make24matter_goal', goal);
    localStorage.setItem('make24matter_start_time', Date.now().toString());
    localStorage.setItem('make24matter_challenge_id', challengeId);
    
    return challengeId;
  }

  static async completeChallenge(
    challengeId: string, 
    rating: number, 
    outcome: string, 
    reflection: string
  ): Promise<boolean> {
    // Completion data is already handled in ProofScreen component
    return true;
  }

  static async getUserChallenges(): Promise<Challenge[]> {
    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    return completions.map((comp: any) => ({
      id: 'local_' + comp.completedAt,
      user_id: getLocalUserId(),
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

  // Check-in Operations
  static async createCheckIn(
    challengeId: string, 
    milestone: number, 
    mood: string, 
    reflection?: string
  ): Promise<boolean> {
    // Check-in data is already handled in MilestoneNudge component
    return true;
  }

  static async getChallengeCheckIns(challengeId: string): Promise<CheckIn[]> {
    // Return empty array since check-ins are stored differently locally
    return [];
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

    return {
      profile,
      challenges,
      recentCheckIns: [] // Local check-ins handled differently
    }
  }
} 