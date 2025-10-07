import { useState, type FormEvent, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import Avatar from '../components/Avatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, setUser, logout } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarMessage(null);
    setIsUploadingAvatar(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(`${API_URL}/api/users/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local user state
      if (setUser && response.data.user) {
        setUser(response.data.user);
      }

      setAvatarMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to upload avatar';
      setAvatarMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    // If email changed, require password
    const emailChanged = email !== user?.email;
    if (emailChanged && !emailPassword) {
      setProfileMessage({ type: 'error', text: 'Password is required to change email' });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/api/users/profile`,
        { 
          email: emailChanged ? email : undefined,
          phone,
          currentPassword: emailChanged ? emailPassword : undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local user state
      if (setUser && response.data.user) {
        setUser(response.data.user);
      }

      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEmailPassword(''); // Clear password after successful update
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      setProfileMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/users/change-password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to change password';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all"
        >
          ← Back to Dashboard
        </button>

        {/* Profile Info Card */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 mb-6 border border-gray-800">
          <h1 className="text-3xl font-bold text-white mb-6">⚙️ Settings</h1>
          
          {/* Avatar Section */}
          <div className="mb-8 pb-8 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Profile Picture</h2>
            
            {avatarMessage && (
              <div
                className={`mb-4 p-3 rounded-xl border ${
                  avatarMessage.type === 'success'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                }`}
              >
                {avatarMessage.text}
              </div>
            )}

            <div className="flex items-center gap-4 sm:gap-6">
              <Avatar src={user?.avatarUrl} name={user?.name || ''} size="xl" />
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className={`inline-block bg-gradient-to-r from-padel-green to-emerald-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold shadow-lg hover:shadow-green-500/50 active:scale-95 sm:hover:scale-[1.02] transform cursor-pointer text-sm sm:text-base ${
                    isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploadingAvatar ? 'Uploading...' : (
                    <>
                      <span className="hidden sm:inline">Upload New Picture</span>
                      <span className="sm:hidden">Upload Photo</span>
                    </>
                  )}
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  Max 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div>
              <label className="text-sm font-semibold text-gray-400">Name</label>
              <p className="text-white text-lg">{user?.name}</p>
            </div>
          </div>

          {/* Update Email & Phone */}
          <div className="border-t border-gray-700 pt-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">Update Contact Information</h2>

            {profileMessage && (
              <div
                className={`mb-4 p-3 rounded-xl border ${
                  profileMessage.type === 'success'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
                  placeholder="+31612345678"
                />
              </div>

              {/* Show password field if email changed */}
              {email !== user?.email && (
                <div>
                  <label htmlFor="emailPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                    Confirm Password (required to change email)
                  </label>
                  <input
                    id="emailPassword"
                    type="password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-dark-elevated border-2 border-yellow-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
                    placeholder="Enter your current password"
                    required
                  />
                  <p className="text-xs text-yellow-400 mt-1">⚠️ Password required to change email address</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full bg-gradient-to-r from-padel-blue to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-padel-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] transform"
              >
                {isUpdatingProfile ? 'Updating...' : 'Update Contact Information'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>

            {message && (
              <div
                className={`mb-4 p-3 rounded-xl border ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-red-500/20 border-red-500 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  Current Password *
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  New Password * (min 6 characters)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-2xl hover:shadow-green-500/50 hover:scale-[1.02] transform"
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Logout Button */}
          <div className="border-t border-gray-700 pt-6">
            <button
              onClick={logout}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all font-bold text-lg shadow-2xl hover:shadow-red-500/50 hover:scale-[1.02] transform"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

