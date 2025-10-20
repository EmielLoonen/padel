import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface AdminPageProps {
  onBack: () => void;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsResetting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/reset-user-password`,
        {
          userId: selectedUser.id,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        }
      );

      setSuccess(response.data.message);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 sm:p-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="animate-spin text-6xl mb-4">↻</div>
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-4xl">🛡️</span>
                Admin Panel
              </h1>
              <p className="text-gray-400">Manage users and reset passwords</p>
            </div>
            <button
              onClick={onBack}
              className="bg-dark-elevated hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors font-medium"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-xl">
            {success}
          </div>
        )}

        {/* Users List */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            All Users ({users.length})
          </h2>
          
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-dark-elevated p-4 rounded-xl border border-gray-700 hover:border-padel-green transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={u.avatarUrl} name={u.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {u.name}
                        </h3>
                        {u.isAdmin && (
                          <span className="text-yellow-500 text-sm" title="Admin">
                            🛡️
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{u.email}</p>
                      {u.phone && (
                        <p className="text-xs text-gray-500">{u.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setNewPassword('');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Password Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Resetting password for:</p>
                <div className="flex items-center gap-3 p-3 bg-dark-elevated rounded-lg">
                  <Avatar src={selectedUser.avatarUrl} name={selectedUser.name} size="sm" />
                  <div>
                    <p className="font-semibold text-white">{selectedUser.name}</p>
                    <p className="text-xs text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-transparent"
                  disabled={isResetting}
                  minLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetPassword}
                  disabled={isResetting || !newPassword}
                  className="flex-1 bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setNewPassword('');
                    setError(null);
                  }}
                  disabled={isResetting}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

