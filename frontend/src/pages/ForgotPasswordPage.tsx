import { useState, type FormEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null); // For development only

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetLink(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/password-reset/request`, {
        email: email.toLowerCase(),
      });

      setMessage(response.data.message);
      
      // DEVELOPMENT ONLY - Show reset link
      if (response.data.resetLink) {
        setResetLink(response.data.resetLink);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-[#0f1419] to-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-padel-green/10 rounded-full mb-4">
            <span className="text-5xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
          <p className="text-gray-400">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {message ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-xl text-sm">
              {message}
            </div>
            
            {/* Development only - show reset link */}
            {resetLink && (
              <div className="p-4 bg-yellow-500/20 border border-yellow-500 text-yellow-400 rounded-xl text-xs">
                <p className="font-semibold mb-2">⚠️ Development Mode</p>
                <p className="mb-2">Copy this link to reset your password:</p>
                <code className="block p-2 bg-black/30 rounded break-all">
                  {resetLink}
                </code>
              </div>
            )}

            <button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold shadow-lg"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-transparent transition-all"
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
        )}
      </div>
    </div>
  );
}

