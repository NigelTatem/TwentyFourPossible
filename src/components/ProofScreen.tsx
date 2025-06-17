'use client';

import { useState } from 'react';
import InspirationalQuote from './InspirationalQuote';

interface ProofScreenProps {
  goal: string;
  onComplete: (rating: number, outcome: string, reflection: string) => void;
}

export default function ProofScreen({ goal, onComplete }: ProofScreenProps) {
  const [reflection, setReflection] = useState('');
  const [outcome, setOutcome] = useState('');
  const [proofFiles, setProofFiles] = useState<FileList | null>(null);
  const [rating, setRating] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofFiles(e.target.files);
  };

  const handleSubmit = () => {
    // Save completion data to localStorage
    const completionData = {
      goal,
      completedAt: Date.now(),
      reflection: reflection.trim(),
      outcome: outcome.trim(),
      rating,
      hasProof: proofFiles && proofFiles.length > 0
    };

    const completions = JSON.parse(localStorage.getItem('make24matter_completions') || '[]');
    completions.push(completionData);
    localStorage.setItem('make24matter_completions', JSON.stringify(completions));

    // Update streak counter
    const currentStreak = parseInt(localStorage.getItem('make24matter_streak') || '0');
    localStorage.setItem('make24matter_streak', (currentStreak + 1).toString());

    // Clear current challenge data
    localStorage.removeItem('make24matter_goal');
    localStorage.removeItem('make24matter_start_time');
    localStorage.removeItem('make24matter_checkins');

    onComplete(rating, outcome.trim() || 'Challenge completed', reflection.trim());
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-blue-900 p-4 animate-gradient-x">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 pt-8 animate-slide-down">
          <div className="text-6xl mb-4 animate-bounce-celebration">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2 animate-glow">Challenge Complete!</h1>
          <p className="text-green-200 animate-fade-in-delayed">24 hours of focused action - you did it!</p>
        </div>

        {/* Completion Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 transform hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          {/* Goal Reminder */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Your Goal:</p>
            <p className="text-gray-700 font-medium text-lg">{goal}</p>
          </div>

          {/* Success Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How successful were you? ⭐
            </label>
            <div className="flex space-x-2">
              {stars.map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all duration-200 transform hover:scale-125 active:scale-110 ${
                    star <= rating ? 'text-yellow-400 animate-pulse-gentle' : 'text-gray-300 hover:text-yellow-200'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 0 ? 'Click to rate your success' : 
               rating === 1 ? 'Started but struggled' :
               rating === 2 ? 'Some progress made' :
               rating === 3 ? 'Good progress' :
               rating === 4 ? 'Great success!' :
               'Absolutely crushed it! 🚀'}
            </p>
          </div>

          {/* Outcome Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What did you accomplish? 🎯
            </label>
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="Describe what you achieved, completed, or learned during your 24-hour challenge..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {outcome.length}/500
            </div>
          </div>

          {/* Reflection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What changed after 24 hours of action? 🤔
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="How do you feel? What did you learn about yourself? What would you do differently?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {reflection.length}/500
            </div>
          </div>

          {/* Proof Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload proof (optional) 📸
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="proof-upload"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="text-gray-600 mb-1">
                  {proofFiles && proofFiles.length > 0 
                    ? `${proofFiles.length} file(s) selected` 
                    : 'Click to upload photos, videos, or documents'
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Screenshots, photos, videos, PDFs, etc.
                </p>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!rating}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg active:scale-95 group"
          >
            <span className="group-hover:animate-pulse">🏆</span> Complete Challenge & Start New One
          </button>

          {!rating && (
            <p className="text-red-500 text-sm text-center mt-2">
              Please rate your success to complete the challenge
            </p>
          )}
        </div>

        {/* Inspirational Quote */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <InspirationalQuote className="text-white" autoRotate={false} />
        </div>

        {/* Motivation for Next Challenge */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <h3 className="text-white text-lg font-semibold mb-2">🔥 Keep the Momentum!</h3>
          <p className="text-green-200 text-sm">
            Ready for your next 24-hour challenge? The magic happens when you make this a habit.
          </p>
        </div>
      </div>
    </div>
  );
} 