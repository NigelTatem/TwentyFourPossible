'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface UserStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalChallenges: number;
  completionRate: number;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  email_confirmed_at: string;
  total_challenges: number;
}

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalChallenges: 0,
    completionRate: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'challenges'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      // Get user stats
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*, auth.users(email, created_at, last_sign_in_at, email_confirmed_at)');

      if (usersError) throw usersError;

      // Get challenge stats
      const { data: challengesData, error: challengesError } = await supabase
        .from('challenges')
        .select('*');

      if (challengesError) throw challengesError;

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const newUsersThisWeek = usersData?.filter(user => 
        new Date(user.created_at) > oneWeekAgo
      ).length || 0;

      const totalChallenges = challengesData?.length || 0;
      const completedChallenges = challengesData?.filter(c => c.completed).length || 0;
      const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0;

      setStats({
        totalUsers,
        newUsersThisWeek,
        totalChallenges,
        completionRate
      });

      // Format users data
      const formattedUsers = usersData?.map(profile => ({
        id: profile.id,
        email: profile.email || 'Unknown',
        created_at: profile.created_at,
        last_sign_in_at: profile.last_sign_in_at || '',
        email_confirmed_at: profile.email_confirmed_at || '',
        total_challenges: profile.total_challenges || 0
      })) || [];

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const exportUserData = async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const { data, error } = await supabase.rpc('export_user_data');
      if (error) throw error;

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `make24matter-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Admin Dashboard</h2>
          <p className="text-gray-600 mb-4">
            Admin dashboard requires Supabase configuration. Please set up your database first.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🔧</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
              <p className="text-gray-600 text-sm">Manage your Make24Matter community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'challenges', label: 'Challenges', icon: '🎯' }
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">👥</div>
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">📈</div>
                        <div>
                          <p className="text-sm text-green-600 font-medium">New This Week</p>
                          <p className="text-2xl font-bold text-green-900">{stats.newUsersThisWeek}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">🎯</div>
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Total Challenges</p>
                          <p className="text-2xl font-bold text-purple-900">{stats.totalChallenges}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">✅</div>
                        <div>
                          <p className="text-sm text-orange-600 font-medium">Completion Rate</p>
                          <p className="text-2xl font-bold text-orange-900">{stats.completionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={exportUserData}
                        className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        📥 Export User Data
                      </button>
                      <button
                        onClick={() => window.open('https://app.supabase.com', '_blank')}
                        className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        🔗 Open Supabase
                      </button>
                      <button
                        onClick={loadDashboardData}
                        className="bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        🔄 Refresh Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
                    <div className="text-sm text-gray-500">
                      {users.length} total users
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Last Active
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Challenges
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {user.id.substring(0, 8)}...
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(user.last_sign_in_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {user.total_challenges}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.email_confirmed_at 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {user.email_confirmed_at ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'challenges' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Challenge Analytics</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-600">
                      Challenge analytics and detailed reporting coming soon! 
                      For now, use the Supabase dashboard to query challenge data directly.
                    </p>
                    <button
                      onClick={() => window.open('https://app.supabase.com', '_blank')}
                      className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open Supabase Dashboard
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 