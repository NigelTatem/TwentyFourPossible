'use client';

import { useState, useEffect } from 'react';
import InspirationalQuote from './InspirationalQuote';
import DancingBear from './DancingBear';

interface GoalInputProps {
  onGoalStart: (goal: string) => void;
}

export default function GoalInput({ onGoalStart }: GoalInputProps) {
  const [goal, setGoal] = useState('');
  const [challengesCompleted, setChallengesCompleted] = useState(0);

  // Load challenges completed on mount
  useEffect(() => {
    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    setChallengesCompleted(completions.length);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (goal.trim().length > 0) {
      // Save goal and start time to localStorage
      const startTime = Date.now();
      localStorage.setItem('make24matter_goal', goal.trim());
      localStorage.setItem('make24matter_start_time', startTime.toString());
      
      // Notify parent component
      onGoalStart(goal.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 animate-gradient-x">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform hover:scale-[1.02] transition-all duration-300 animate-fade-in-up overflow-hidden">
        
                 {/* Header Section */}
         <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white text-center">
           <h1 className="text-4xl font-bold mb-2 animate-glow">
             Make24Matter
           </h1>
           <p className="text-blue-100 text-lg mb-2">
             Transform your next 24 hours into something extraordinary
           </p>
           <p className="text-blue-200 text-sm">
             🐻 Complete challenges to collect adorable pet bears! Start with one free bear! 🐻
           </p>
          {challengesCompleted > 0 && (
            <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-2 animate-pulse-slow">
              <p className="text-white font-medium animate-bounce-subtle">
                🏆 {challengesCompleted} challenge{challengesCompleted !== 1 ? 's' : ''} completed! Ready for another?
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8 p-8">
          
          {/* Left Section - Goal Input */}
          <div className="space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                🎯 Set Your Challenge
              </h2>
              <p className="text-gray-600">
                What ambitious goal will you tackle in the next 24 hours?
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-3">
                  Describe your 24-hour mission
                </label>
                <textarea
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Complete my portfolio website, Write 10,000 words of my novel, Learn to solve a Rubik's cube, Build a mobile app prototype, Create a business plan..."
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-40 text-gray-800 transition-all duration-200 hover:border-blue-400 focus:scale-[1.02] text-base leading-relaxed"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {goal.length} characters
                  </div>
                  <div className="text-xs text-gray-400">
                    Be specific and ambitious! 🚀
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={goal.trim().length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-xl active:scale-95 group text-lg"
              >
                <span className="group-hover:animate-pulse mr-2">🚀</span> 
                Launch My 24-Hour Challenge
                <span className="group-hover:animate-pulse ml-2">⏰</span>
              </button>
              
              {goal.trim().length === 0 && goal.length > 0 && (
                <p className="text-red-500 text-sm text-center animate-fade-in">
                  Please enter a goal to start your challenge
                </p>
              )}
            </form>
          </div>

          {/* Right Section - Motivation & Bear */}
          <div className="space-y-6">
            <div className="text-center">
                             <h2 className="text-2xl font-bold text-gray-800 mb-2">
                 🌟 Get Motivated
               </h2>
               <p className="text-sm text-gray-600 mb-4">
                 Complete challenges to unlock more pet bears! 🐻✨
               </p>
              
                             {/* Dancing Bear */}
               <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                 <DancingBear bearsCount={challengesCompleted + 1} />
               </div>
              
              {/* Inspirational Quote */}
              <div className="bg-gray-50 rounded-xl p-6">
                <InspirationalQuote className="text-gray-700" />
              </div>
              
              {/* Tips Section */}
              <div className="mt-6 space-y-3">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left rounded-r-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Pro Tip:</strong> Break your goal into smaller milestones for better success rates!
                  </p>
                </div>
                <div className="bg-green-50 border-l-4 border-green-400 p-4 text-left rounded-r-lg">
                  <p className="text-sm text-green-800">
                    <strong>⚡ Energy Boost:</strong> You'll get check-ins at 6, 12, and 18-hour marks to keep you motivated!
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        
      </div>
    </div>
  );
}
