'use client';

import { useState, useEffect } from 'react';
import InspirationalQuote from './InspirationalQuote';
import DancingBear from './DancingBear';

// DEVELOPMENT CONFIGURATION - Change this for testing!
// Set to a smaller number for testing (e.g., 0.1 for 6 minutes, 0.5 for 30 minutes)
const TIMER_DURATION_HOURS = 24; // 24 hours for all challenges

// Calculate durations in milliseconds
const TIMER_DURATION_MS = TIMER_DURATION_HOURS * 60 * 60 * 1000;
const MILESTONE_HOURS = TIMER_DURATION_HOURS > 1 
  ? [TIMER_DURATION_HOURS * 0.75, TIMER_DURATION_HOURS * 0.5, TIMER_DURATION_HOURS * 0.25] // 75%, 50%, 25% of duration
  : [TIMER_DURATION_HOURS * 0.8, TIMER_DURATION_HOURS * 0.5, TIMER_DURATION_HOURS * 0.2]; // Adjusted for very short durations

interface CountdownTimerProps {
  goal: string;
  onComplete: () => void;
  onMilestone: (milestone: number) => void;
  onFocusModeChange?: (focusMode: boolean) => void;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function CountdownTimer({ goal, onComplete, onMilestone, onFocusModeChange }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ 
    hours: Math.floor(TIMER_DURATION_HOURS), 
    minutes: Math.floor((TIMER_DURATION_HOURS % 1) * 60), 
    seconds: 0, 
    total: TIMER_DURATION_MS 
  });
  const [focusMode, setFocusMode] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [milestonesHit, setMilestonesHit] = useState<Set<number>>(new Set());
  const [challengesCompleted, setChallengesCompleted] = useState<number>(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Notify parent when focus mode changes
  useEffect(() => {
    onFocusModeChange?.(focusMode);
  }, [focusMode, onFocusModeChange]);

  // Load challenges completed and milestone state on mount
  useEffect(() => {
    const loadChallengesCompleted = () => {
      const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
      setChallengesCompleted(completions.length);
    };
    
    // Load milestone state
    const savedMilestones = localStorage.getItem('make24matter_milestones_hit');
    if (savedMilestones) {
      setMilestonesHit(new Set(JSON.parse(savedMilestones)));
    }
    
    loadChallengesCompleted();
  }, []);

  // Add browser warning for navigation/close attempts
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have an active 24-hour challenge! Are you sure you want to leave? Your progress will be lost.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    const startTime = localStorage.getItem('make24matter_start_time');
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const start = parseInt(startTime);
      const elapsed = now - start;
      const remaining = Math.max(0, TIMER_DURATION_MS - elapsed);

      if (remaining === 0) {
        onComplete();
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, total: remaining });

      // Check for milestones
      const hoursRemaining = remaining / (1000 * 60 * 60);
      MILESTONE_HOURS.forEach(milestone => {
        if (hoursRemaining <= milestone && hoursRemaining > milestone - 0.01 && !milestonesHit.has(milestone)) {
          setMilestonesHit(prev => {
            const newSet = new Set([...prev, milestone]);
            // Save milestone state to localStorage
            localStorage.setItem('make24matter_milestones_hit', JSON.stringify([...newSet]));
            return newSet;
          });
          onMilestone(milestone);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete, onMilestone, milestonesHit]);

  const progress = ((TIMER_DURATION_MS - timeLeft.total) / TIMER_DURATION_MS) * 100;

  if (focusMode) {
    return (
      <div 
        className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 animate-fade-in cursor-pointer"
        onClick={() => setShowControls(!showControls)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFocusMode(false);
          }}
          className={`absolute top-4 right-4 text-gray-400 hover:text-white text-sm transition-all duration-500 hover:scale-110 z-50 bg-black/20 px-3 py-2 rounded-lg backdrop-blur-sm ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ✕ Exit Focus Mode
        </button>
        
        <div className="text-center animate-slide-up">
          <div className="text-8xl md:text-9xl font-mono font-bold mb-8 animate-pulse-gentle">
            <span className="inline-block animate-flip-number">{String(timeLeft.hours).padStart(2, '0')}</span>:
            <span className="inline-block animate-flip-number" style={{animationDelay: '0.1s'}}>{String(timeLeft.minutes).padStart(2, '0')}</span>:
            <span className="inline-block animate-flip-number" style={{animationDelay: '0.2s'}}>{String(timeLeft.seconds).padStart(2, '0')}</span>
          </div>
          <p className="text-xl text-gray-300 max-w-md animate-fade-in-delayed">
            {goal}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 animate-gradient-x">
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 pt-8 animate-slide-down">
          <h1 className="text-4xl font-bold text-white mb-2 animate-glow">Make24Matter</h1>
          <p className="text-blue-200 animate-fade-in-delayed">Your 24-hour challenge is active</p>
        </div>

        {/* Main Timer Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 transform hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Your Goal</h2>
            <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
              {goal}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-4 rounded-full transition-all duration-1000 relative shadow-lg animate-pulse"
                style={{ width: `${Math.max(progress, 5)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className="text-6xl md:text-7xl font-mono font-bold text-gray-800 mb-4 animate-pulse-gentle">
              <span className="inline-block transition-transform duration-300 hover:scale-110 animate-flip-number">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="animate-blink">:</span>
              <span className="inline-block transition-transform duration-300 hover:scale-110 animate-flip-number" style={{animationDelay: '0.1s'}}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="animate-blink" style={{animationDelay: '0.5s'}}>:</span>
              <span className="inline-block transition-transform duration-300 hover:scale-110 animate-flip-number" style={{animationDelay: '0.2s'}}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
            <p className="text-gray-500">
              {timeLeft.hours > 0 ? `${timeLeft.hours} hours` : ''} 
              {timeLeft.hours > 0 && timeLeft.minutes > 0 ? ', ' : ''}
              {timeLeft.minutes > 0 ? `${timeLeft.minutes} minutes` : ''} 
              {(timeLeft.hours > 0 || timeLeft.minutes > 0) && timeLeft.seconds > 0 ? ', ' : ''}
              {timeLeft.seconds > 0 ? `${timeLeft.seconds} seconds` : ''} remaining
            </p>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setFocusMode(true)}
              className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 group"
            >
              <span className="group-hover:animate-pulse">🎯</span> Focus Mode
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-105 hover:shadow-lg active:scale-95 group"
            >
              <span className="group-hover:animate-pulse">🛑</span> End Challenge
            </button>
          </div>
        </div>

        {/* Dancing Bear */}
        <div className="mb-6">
          <DancingBear bearsCount={challengesCompleted + 1} />
        </div>

        {/* Inspirational Quote */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <InspirationalQuote className="text-white" autoRotate={true} rotateInterval={20000} />
        </div>

        {/* Milestones */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-white text-lg font-semibold mb-2">Milestones</h3>
          <p className="text-white/60 text-xs mb-4">
            Remaining: {(timeLeft.total / (1000 * 60 * 60)).toFixed(2)}h | 
            Progress: {Math.round(progress)}% | 
            Targets: {MILESTONE_HOURS.map(h => h.toFixed(2)).join(', ')}h
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MILESTONE_HOURS.map(milestone => (
              <div 
                key={milestone}
                className={`p-4 rounded-lg text-center transition-all duration-300 ${
                  milestonesHit.has(milestone) 
                    ? 'bg-green-500/30 border-2 border-green-400 shadow-lg' 
                    : (timeLeft.total / (1000 * 60 * 60)) <= (milestone + 0.01) && !milestonesHit.has(milestone)
                    ? 'bg-orange-500/30 border-2 border-orange-400 shadow-lg'
                    : 'bg-white/20 border-2 border-white/30'
                }`}
              >
                <div className="text-2xl mb-2">
                  {milestonesHit.has(milestone) ? '✅' : (timeLeft.total / (1000 * 60 * 60)) <= (milestone + 0.01) && !milestonesHit.has(milestone) ? '⏰' : '⏳'}
                </div>
                <p className={`text-sm font-semibold ${
                  milestonesHit.has(milestone) 
                    ? 'text-green-100' 
                    : (timeLeft.total / (1000 * 60 * 60)) <= (milestone + 0.01) && !milestonesHit.has(milestone)
                    ? 'text-orange-100'
                    : 'text-white'
                }`}>
                  {milestone < 1 ? `${Math.round(milestone * 60)}min` : `${milestone.toFixed(1)}h`} Mark
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* End Challenge Confirmation Dialog */}
        {showEndConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-bounce-in">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">End Challenge Early?</h2>
                <p className="text-gray-600 leading-relaxed">
                  You're doing great! If you end now, all your progress and milestone check-ins will be lost. 
                  Only completed 24-hour challenges are saved to your memory book.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">💪 You've got this!</h3>
                <p className="text-sm text-gray-600">
                  Every moment you've invested matters. The hardest part is often right before the breakthrough. 
                  Consider taking a short break instead of giving up completely.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🚀 Keep Going - I've Got This!
                </button>
                
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    setFocusMode(true);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  🎯 Continue in Focus Mode
                </button>

                <button
                  onClick={() => {
                    // Clear everything - no tracking of incomplete challenges
                    localStorage.removeItem('make24matter_goal');
                    localStorage.removeItem('make24matter_start_time');
                    localStorage.removeItem('make24matter_challenge_id');
                    localStorage.removeItem('make24matter_milestones_hit');
                    window.location.reload();
                  }}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200 transform hover:scale-105"
                >
                  😔 End Challenge (lose progress)
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                Remember: Every challenge completed makes you stronger! 💪
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 