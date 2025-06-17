'use client';

import { useState } from 'react';

interface MilestoneNudgeProps {
  milestone: number;
  onClose: () => void;
  onSubmit?: (milestone: number, mood: string, reflection?: string) => void;
  goal: string;
}

export default function MilestoneNudge({ milestone, onClose, onSubmit, goal }: MilestoneNudgeProps) {
  const [reflection, setReflection] = useState('');
  const [mood, setMood] = useState('');

  const getMilestoneMessage = (hours: number) => {
    switch (hours) {
      case 18:
        return {
          title: "🌅 6 Hours In!",
          message: "You've started strong! How are you feeling about your progress so far?",
          tips: ["Take a moment to celebrate what you've accomplished", "Adjust your approach if needed", "Stay hydrated and take breaks"]
        };
      case 12:
        return {
          title: "🔥 Halfway There!",
          message: "12 hours down, 12 to go! You're at the halfway point - this is where champions are made.",
          tips: ["Push through any mid-point fatigue", "Review your goal and refocus", "You've got this momentum - keep it going!"]
        };
      case 6:
        return {
          title: "⚡ Final Sprint!",
          message: "Only 6 hours left! This is your final push - make every moment count!",
          tips: ["Focus on the essentials", "Push through fatigue - you're almost there", "Visualize crossing the finish line"]
        };
      default:
        return {
          title: "🎯 Check-in Time",
          message: "How's your progress going?",
          tips: ["Keep pushing forward", "Stay focused on your goal"]
        };
    }
  };

  const milestoneData = getMilestoneMessage(milestone);
  const moodOptions = [
    { emoji: '🚀', label: 'Crushing it!' },
    { emoji: '💪', label: 'Strong' },
    { emoji: '😊', label: 'Good' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '😵‍💫', label: 'Struggling' },
    { emoji: '😴', label: 'Tired' }
  ];

  const handleSubmit = () => {
    // Call the onSubmit callback if provided
    if (onSubmit) {
      onSubmit(milestone, mood, reflection.trim());
    }
    
    // Save milestone check-in to localStorage for backup
    const checkIns = JSON.parse(localStorage.getItem('make24matter_checkins') || '[]');
    checkIns.push({
      milestone,
      timestamp: Date.now(),
      mood,
      reflection: reflection.trim(),
      goal
    });
    localStorage.setItem('make24matter_checkins', JSON.stringify(checkIns));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform animate-bounce-in hover:scale-[1.02] transition-transform duration-300">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2 animate-bounce-gentle">{milestone === 18 ? '🌅' : milestone === 12 ? '🔥' : '⚡'}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2 animate-slide-down">
            {milestoneData.title}
          </h2>
          <p className="text-gray-600 animate-fade-in-delayed">
            {milestoneData.message}
          </p>
        </div>

        {/* Goal Reminder */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Your Goal:</p>
          <p className="text-gray-700 font-medium">{goal}</p>
        </div>

        {/* Mood Check */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">How are you feeling?</p>
          <div className="grid grid-cols-3 gap-2">
            {moodOptions.map((option) => (
              <button
                key={option.emoji}
                onClick={() => setMood(option.emoji)}
                className={`p-3 rounded-lg text-center transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                  mood === option.emoji
                    ? 'bg-blue-500 text-white shadow-lg animate-pulse-gentle'
                    : 'bg-gray-100 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className="text-xs">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Reflection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick reflection (optional):
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What's working? What needs to change? Any breakthroughs?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20 text-sm"
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {reflection.length}/200
          </div>
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">💡 Tips for this stage:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {milestoneData.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!mood}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 