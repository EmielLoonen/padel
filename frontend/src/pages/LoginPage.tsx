import { useState, type FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

interface LoginPageProps {
  onShowSignup?: () => void;
}

export default function LoginPage({ onShowSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect handled by App.tsx
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce">🎾</div>
          <h1 className="text-4xl font-bold mb-2 text-white">
            Padel Coordinator
          </h1>
          <p className="text-gray-400 text-lg">
            Sign in to manage your matches
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="john@test.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="••••••••"
            />
          </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-[1.02]"
                >
                  {isLoading ? 'Signing in...' : 'Sign In 🎾'}
                </button>
              </form>

              {onShowSignup && (
                <div className="mt-6 text-center">
                  <button
                    onClick={onShowSignup}
                    className="text-padel-green hover:text-emerald-400 font-medium transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      }

