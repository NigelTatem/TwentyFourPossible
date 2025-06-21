'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  migrateGuestData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if user chose guest mode
      const guestMode = localStorage.getItem('make24matter_guest_mode');
      setIsGuest(guestMode === 'true' && !session);
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          setIsGuest(false);
          localStorage.removeItem('make24matter_guest_mode');
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } };
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Authentication not configured' } };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setIsGuest(false);
    localStorage.removeItem('make24matter_guest_mode');
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('make24matter_guest_mode', 'true');
  };

  const migrateGuestData = async () => {
    if (!user || !isSupabaseConfigured()) return;

    try {
      // Get guest data from localStorage
      const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
      const checkins = JSON.parse(localStorage.getItem('make24matter_checkins') || '[]');

      // Migrate completions to database
      for (const completion of completions) {
        const { data: challenge } = await supabase
          .from('challenges')
          .insert({
            user_id: user.id,
            goal: completion.goal,
            start_time: new Date(completion.completedAt - 24 * 60 * 60 * 1000).toISOString(), // Approximate start time
            end_time: new Date(completion.completedAt).toISOString(),
            completed: true,
            rating: completion.rating,
            outcome: completion.outcome,
            reflection: completion.reflection
          })
          .select()
          .single();

        // Migrate related check-ins
        const relatedCheckins = checkins.filter((c: any) => c.goal === completion.goal);
        for (const checkin of relatedCheckins) {
          if (challenge) {
            await supabase
              .from('checkins')
              .insert({
                challenge_id: challenge.id,
                milestone: checkin.milestone,
                mood: checkin.mood,
                reflection: checkin.reflection,
                timestamp: new Date(checkin.timestamp).toISOString()
              });
          }
        }
      }

      // Clear guest data after successful migration
      localStorage.removeItem('make24matter_completions');
      localStorage.removeItem('make24matter_checkins');
      
    } catch (error) {
      console.error('Error migrating guest data:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    isGuest,
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    migrateGuestData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 