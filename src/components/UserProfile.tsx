'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  onClose: () => void;
  onShowAuth?: () => void;
}

export default function UserProfile({ onClose, onShowAuth }: UserProfileProps) {
  const { user, signOut, migrateGuestData, isGuest } = useAuth();
  const [hasGuestData, setHasGuestData] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    // Check if there's guest data to migrate
    const completions = localStorage.getItem('make24matter_completions');
    const checkins = localStorage.getItem('make24matter_checkins');
    setHasGuestData(!!completions || !!checkins);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleMigrateData = async () => {
    setMigrating(true);
    try {
      await migrateGuestData();
      setHasGuestData(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  if (isGuest) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 text-center">
            <div className="text-4xl mb-2">🚀</div>
            <h2 className="text-2xl font-bold mb-2">Guest Mode</h2>
            <p className="text-green-100">
              You're using Make24Matter as a guest
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔒 Guest Mode Features</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Data saved locally on this device</li>
                <li>• Full access to all features</li>
                <li>• No account required</li>
                <li>• Perfect for trying out the app</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">✨ Want More?</h3>
              <p className="text-sm text-purple-800 mb-3">
                Create an account to sync your challenges across devices and never lose your progress!
              </p>
              <button
                onClick={() => {
                  onClose();
                  onShowAuth?.();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 text-center">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-xl font-bold mb-1">
            {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
          </h2>
          <p className="text-purple-100 text-sm">{user?.email}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Account Status</h3>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-gray-700">Signed in and syncing</span>
            </div>
          </div>

          {/* Data Migration */}
          {hasGuestData && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">🔄 Guest Data Found</h3>
              <p className="text-sm text-orange-800 mb-3">
                We found data from when you used guest mode. Would you like to transfer it to your account?
              </p>
              <button
                onClick={handleMigrateData}
                disabled={migrating}
                className="w-full bg-orange-600 text-white py-2 rounded-lg font-medium hover:bg-orange-700 transition-all duration-200 disabled:opacity-50"
              >
                {migrating ? 'Transferring...' : 'Transfer Guest Data'}
              </button>
            </div>
          )}

          {/* Account Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your challenges are automatically synced across all your devices.
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
} 