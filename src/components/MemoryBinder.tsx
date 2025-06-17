'use client';

import { useState, useEffect } from 'react';
import { DatabaseService } from '@/lib/database';
import { Challenge, CheckIn, UserProfile } from '@/lib/supabase';

interface MemoryBinderProps {
  onClose: () => void;
}

export default function MemoryBinder({ onClose }: MemoryBinderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'insights'>('overview');

  useEffect(() => {
    loadMemoryBinder();
  }, []);

  const loadMemoryBinder = async () => {
    setLoading(true);
    try {
      const data = await DatabaseService.getMemoryBinder();
      setProfile(data.profile);
      setChallenges(data.challenges);
      setCheckIns(data.recentCheckIns);
    } catch (error) {
      console.error('Error loading memory binder:', error);
      // Set empty data on error so UI still works
      setProfile(null);
      setChallenges([]);
      setCheckIns([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSuccessRate = () => {
    if (challenges.length === 0) return 0;
    const completed = challenges.filter(c => c.completed).length;
    return Math.round((completed / challenges.length) * 100);
  };

  const getAverageRating = () => {
    const completedWithRating = challenges.filter(c => c.completed && c.rating);
    if (completedWithRating.length === 0) return '0.0';
    const sum = completedWithRating.reduce((acc, c) => acc + (c.rating || 0), 0);
    return (sum / completedWithRating.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your memory binder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col animate-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-3xl animate-bounce-gentle">📚</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Memory Binder</h2>
              <p className="text-gray-600 text-sm">Your 24-hour challenge journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors hover:scale-110 transform"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'challenges', label: 'Challenges', icon: '🎯' },
            { id: 'insights', label: 'Insights', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg transform hover:scale-105 transition-transform">
                  <div className="text-2xl font-bold">{profile?.streak || 0}</div>
                  <div className="text-sm opacity-90">Current Streak</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-4 rounded-lg transform hover:scale-105 transition-transform">
                  <div className="text-2xl font-bold">{profile?.total_challenges || 0}</div>
                  <div className="text-sm opacity-90">Total Challenges</div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg transform hover:scale-105 transition-transform">
                  <div className="text-2xl font-bold">{getSuccessRate()}%</div>
                  <div className="text-sm opacity-90">Success Rate</div>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-4 rounded-lg transform hover:scale-105 transition-transform">
                  <div className="text-2xl font-bold">{getAverageRating()}</div>
                  <div className="text-sm opacity-90">Avg Rating</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {challenges.slice(0, 5).map((challenge) => (
                    <div key={challenge.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 truncate">{challenge.goal}</p>
                        <p className="text-sm text-gray-500">{formatDate(challenge.created_at)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {challenge.completed ? (
                          <>
                            <span className="text-green-500">✅</span>
                            {challenge.rating && (
                              <div className="flex">
                                {Array.from({ length: challenge.rating }, (_, i) => (
                                  <span key={i} className="text-yellow-400 text-sm">⭐</span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">⏳</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {challenges.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No challenges yet. Start your first one!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'challenges' && (
            <div className="space-y-4 animate-fade-in-up">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{challenge.goal}</h4>
                      <p className="text-sm text-gray-500">
                        Started: {formatDate(challenge.start_time)}
                        {challenge.end_time && ` • Completed: ${formatDate(challenge.end_time)}`}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {challenge.completed ? (
                        <>
                          <span className="text-green-500 text-xl">✅</span>
                          {challenge.rating && (
                            <div className="flex">
                              {Array.from({ length: challenge.rating }, (_, i) => (
                                <span key={i} className="text-yellow-400">⭐</span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400 text-xl">⏳</span>
                      )}
                    </div>
                  </div>
                  
                  {challenge.outcome && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Outcome:</p>
                      <p className="text-sm text-gray-600">{challenge.outcome}</p>
                    </div>
                  )}
                  
                  {challenge.reflection && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reflection:</p>
                      <p className="text-sm text-gray-600">{challenge.reflection}</p>
                    </div>
                  )}
                </div>
              ))}
              {challenges.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500">No challenges yet. Start your first 24-hour challenge!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Mood Trends */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Mood Trends</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {['🚀', '💪', '😊', '😐', '😵‍💫', '😴'].map((mood) => {
                    const count = checkIns.filter(c => c.mood === mood).length;
                    return (
                      <div key={mood} className="text-center">
                        <div className="text-3xl mb-2">{mood}</div>
                        <div className="text-sm font-medium text-gray-600">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Success Patterns */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Success Patterns</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completion Rate</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${getSuccessRate()}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{getSuccessRate()}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Rating</span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span 
                          key={i} 
                          className={`text-lg ${i < Math.floor(parseFloat(getAverageRating())) ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ⭐
                        </span>
                      ))}
                      <span className="text-sm font-medium ml-2">{getAverageRating()}/5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">🌟</div>
                <h3 className="text-lg font-semibold mb-2">Keep Going!</h3>
                <p className="text-sm opacity-90">
                  {profile?.streak && profile.streak > 0 
                    ? `You're on a ${profile.streak} day streak! Every challenge makes you stronger.`
                    : "Start your first challenge and begin building momentum!"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 