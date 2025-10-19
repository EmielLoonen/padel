import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ResetPasswordPageProps {
  token: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function ResetPasswordPage({ token, onSuccess, onBack }: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      await axios.get(`${API_URL}/api/password-reset/verify/${token}`);
      setIsValidToken(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired reset link');
      setIsValidToken(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API_URL}/api/password-reset/reset`, {
        token,
        newPassword,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-[#0f1419] to-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800 text-center">
          <div className="animate-spin text-5xl mb-4">↻</div>
          <p className="text-gray-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-bg via-[#0f1419] to-dark-bg flex items-center justify-center p-4">
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-red-500/10 rounded-full mb-4">
              <span className="text-5xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
            <p className="text-gray-400 mb-4">{error}</p>
          </div>

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold shadow-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-[#0f1419] to-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-padel-green/10 rounded-full mb-4">
            <span className="text-5xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-transparent transition-all"
              placeholder="Enter new password"
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-transparent transition-all"
              placeholder="Confirm new password"
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

