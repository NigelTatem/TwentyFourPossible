'use client';

import { useState, useEffect } from 'react';
import GoalInput from '@/components/GoalInput';
import CountdownTimer from '@/components/CountdownTimer';
import MilestoneNudge from '@/components/MilestoneNudge';
import ProofScreen from '@/components/ProofScreen';
import MemoryBinder from '@/components/MemoryBinder';
import { DatabaseService } from '@/lib/database';

type AppState = 'goal-input' | 'timer-active' | 'challenge-complete';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('goal-input');
  const [currentGoal, setCurrentGoal] = useState<string>('');
  const [currentChallengeId, setCurrentChallengeId] = useState<string>('');
  const [showMilestone, setShowMilestone] = useState<number | null>(null);
  const [showMemoryBinder, setShowMemoryBinder] = useState<boolean>(false);
  const [challengesCompleted, setChallengesCompleted] = useState<number>(0);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Check for existing challenge on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Load user profile for challenges completed
      const profile = await DatabaseService.getUserProfile();
      if (profile) {
        setChallengesCompleted(profile.streak);
      }

      // Check for active challenge in localStorage (for persistence)
      const savedGoal = localStorage.getItem('make24matter_goal');
      const savedStartTime = localStorage.getItem('make24matter_start_time');
      const savedChallengeId = localStorage.getItem('make24matter_challenge_id');

      if (savedGoal && savedStartTime && savedChallengeId) {
        const startTime = parseInt(savedStartTime);
        const now = Date.now();
        const elapsed = now - startTime;
        const duration = 24 * 60 * 60 * 1000; // 24 hours

        setCurrentGoal(savedGoal);
        setCurrentChallengeId(savedChallengeId);

        if (elapsed >= duration) {
          // Challenge is complete
          setAppState('challenge-complete');
        } else {
          // Challenge is still active
          setAppState('timer-active');
        }
      }
    };

    initializeApp();
  }, []);

  const handleGoalStart = async (goal: string) => {
    // Create challenge in database
    const challengeId = await DatabaseService.createChallenge(goal);
    if (challengeId) {
      setCurrentGoal(goal);
      setCurrentChallengeId(challengeId);
      setAppState('timer-active');
      
      // Also save to localStorage for persistence
      localStorage.setItem('make24matter_challenge_id', challengeId);
    }
  };

  const handleTimerComplete = () => {
    setAppState('challenge-complete');
  };

  const handleMilestone = async (milestone: number) => {
    setShowMilestone(milestone);
  };

  const handleMilestoneSubmit = async (milestone: number, mood: string, reflection?: string) => {
    if (currentChallengeId) {
      await DatabaseService.createCheckIn(currentChallengeId, milestone, mood, reflection);
    }
  };

  const handleChallengeComplete = async (rating: number, outcome: string, reflection: string) => {
    // Complete challenge in database
    if (currentChallengeId) {
      await DatabaseService.completeChallenge(currentChallengeId, rating, outcome, reflection);
    }

    // Clear localStorage
    localStorage.removeItem('make24matter_goal');
    localStorage.removeItem('make24matter_start_time');
    localStorage.removeItem('make24matter_challenge_id');

    // Reset to start a new challenge
    setAppState('goal-input');
    setCurrentGoal('');
    setCurrentChallengeId('');
    setShowMilestone(null);
    
    // Update challenges completed display
    const profile = await DatabaseService.getUserProfile();
    if (profile) {
      setChallengesCompleted(profile.streak);
    }
  };

  return (
    <div>
      {/* Challenge Counter - Always visible when challenges > 0 and not in focus mode */}
      {challengesCompleted > 0 && appState !== 'challenge-complete' && !isFocusMode && (
        <div className="fixed top-4 left-4 bg-gradient-to-r from-green-400 to-blue-400 text-green-900 px-4 py-2 rounded-full text-sm font-medium z-40 shadow-lg animate-pulse-slow transform hover:scale-110 transition-transform duration-200">
          <span className="animate-bounce-subtle">🏆</span> {challengesCompleted} challenge{challengesCompleted !== 1 ? 's' : ''} completed!
        </div>
      )}

      {/* Memory Binder Button - Only show when not in timer or focus mode */}
      {appState !== 'timer-active' && !isFocusMode && (
        <button
          onClick={() => setShowMemoryBinder(true)}
          className="fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium z-40 shadow-lg transform hover:scale-110 transition-all duration-200 group"
        >
          <span className="group-hover:animate-pulse">📚</span> Memory Binder
        </button>
      )}

      {/* Memory Binder Button for Timer Screen - Different position, hidden in focus mode */}
      {appState === 'timer-active' && !isFocusMode && (
        <button
          onClick={() => setShowMemoryBinder(true)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium z-40 shadow-lg transform hover:scale-110 transition-all duration-200 group"
        >
          <span className="group-hover:animate-pulse">📚</span> Memory
        </button>
      )}

      {/* Main App States */}
      {appState === 'goal-input' && (
        <GoalInput onGoalStart={handleGoalStart} />
      )}

      {appState === 'timer-active' && (
        <CountdownTimer 
          goal={currentGoal}
          onComplete={handleTimerComplete}
          onMilestone={handleMilestone}
          onFocusModeChange={setIsFocusMode}
        />
      )}

      {appState === 'challenge-complete' && (
        <ProofScreen 
          goal={currentGoal}
          onComplete={handleChallengeComplete}
        />
      )}

      {/* Milestone Nudge Overlay */}
      {showMilestone && (
        <MilestoneNudge
          milestone={showMilestone}
          goal={currentGoal}
          onClose={() => setShowMilestone(null)}
          onSubmit={handleMilestoneSubmit}
        />
      )}

      {/* Memory Binder Overlay */}
      {showMemoryBinder && (
        <MemoryBinder onClose={() => setShowMemoryBinder(false)} />
      )}
    </div>
  );
}
