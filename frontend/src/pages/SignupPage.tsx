import { useState, FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

interface SignupPageProps {
  onBackToLogin: () => void;
}

export default function SignupPage({ onBackToLogin }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validation
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await signup(email, password, name, phone || undefined);
      // Redirect handled by App.tsx
    } catch (err) {
      // Error handled by store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce">🎾</div>
          <h1 className="text-4xl font-bold mb-2 text-white">
            Join Padel Coordinator
          </h1>
          <p className="text-gray-400 text-lg">
            Create your account
          </p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-300 mb-2">
              Phone (optional)
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

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
              Password *
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="••••••••"
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
              Confirm Password *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-[1.02]"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up 🎾'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-padel-green hover:text-emerald-400 font-medium transition-colors"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

