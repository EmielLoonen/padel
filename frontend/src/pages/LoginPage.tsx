import { useState, useEffect, type FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';

interface LoginPageProps {
  onShowSignup?: () => void;
}

const loadingScreens = [
  {
    emoji: '🍌',
    title: 'Waking up the banana farm...',
    subtitle: 'The database is stretching 🥱',
    animation: 'dance',
    isCommercial: false
  },
  {
    emoji: '🍸',
    title: 'Campari Negroni',
    subtitle: 'Negroni Love!! ❤️',
    animation: 'wiggle',
    isCommercial: true
  },
  {
    emoji: '☕',
    title: 'Brewing fresh queries...',
    subtitle: 'The database needs its morning coffee',
    animation: 'steam',
    isCommercial: false
  },
  {
    emoji: '💋',
    title: 'Purol',
    subtitle: 'Keeping Mark\'s lips smooth & soft for the last 20 years',
    animation: 'bounce',
    isCommercial: true
  },
  {
    emoji: '🏃',
    title: 'Running to the server...',
    subtitle: 'It\'s quite far away, be patient',
    animation: 'run',
    isCommercial: false
  },
  {
    emoji: '🍺',
    title: 'Walhalla Craft Beer',
    subtitle: 'Where legends are brewed!',
    animation: 'steam',
    isCommercial: true
  },
  {
    emoji: '🎾',
    title: 'Warming up the padel courts...',
    subtitle: 'Making sure everything is ready for you',
    animation: 'bounce',
    isCommercial: false
  }
];

export default function LoginPage({ onShowSignup }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentScreen, setCurrentScreen] = useState(0);
  const { login, isLoading, error } = useAuthStore();

  // Rotate through loading screens every 10 seconds
  useEffect(() => {
    if (!isLoading) {
      setCurrentScreen(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % loadingScreens.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect handled by App.tsx
    } catch (err) {
      // Error handled by store
    }
  };

  // Show rotating loading screens while loading
  if (isLoading) {
    const screen = loadingScreens[currentScreen];
    
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-3 sm:p-4">
        <div className="text-center">
          <style>{`
            @keyframes wiggle {
              0%, 100% { transform: rotate(-15deg); }
              50% { transform: rotate(15deg); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes dance {
              animation: wiggle 0.5s ease-in-out infinite, spin 2s linear infinite;
            }
            @keyframes steam {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-20px); }
            }
            @keyframes run {
              0%, 100% { transform: translateX(-20px); }
              50% { transform: translateX(20px); }
            }
            @keyframes rocket {
              0% { transform: translateY(0px) rotate(0deg); }
              25% { transform: translateY(-10px) rotate(-5deg); }
              75% { transform: translateY(-10px) rotate(5deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }
            .dance {
              animation: wiggle 0.5s ease-in-out infinite, spin 2s linear infinite;
              display: inline-block;
            }
            .steam {
              animation: steam 1.5s ease-in-out infinite;
              display: inline-block;
            }
            .run {
              animation: run 1s ease-in-out infinite;
              display: inline-block;
            }
            .rocket {
              animation: rocket 1s ease-in-out infinite;
              display: inline-block;
            }
            .bounce {
              animation: bounce 1s infinite;
              display: inline-block;
            }
            .wiggle {
              animation: wiggle 0.5s ease-in-out infinite;
              display: inline-block;
            }
            .fade-in {
              animation: fadeIn 0.5s ease-in;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          {screen.isCommercial && (
            <p className="text-xs text-gray-500 mb-2 fade-in italic">
              ✨ A word from our sponsors ✨
            </p>
          )}
          <div className={`${screen.animation} text-8xl sm:text-9xl mb-6 fade-in`}>
            {screen.emoji}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-padel-green mb-2 fade-in">
            {screen.title}
          </p>
          <p className="text-sm sm:text-base text-gray-400 fade-in">
            {screen.subtitle}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            {loadingScreens.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentScreen
                    ? 'bg-padel-green w-6'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <div className="w-2 h-2 bg-padel-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-padel-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-padel-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-3 sm:p-4">
      <div className="bg-dark-card rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-md border border-gray-800">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-5xl sm:text-7xl mb-3 sm:mb-4 animate-bounce">🎾</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">
            Padel Coordinator
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Sign in to manage your matches
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all text-base"
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
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all text-base"
              placeholder="••••••••"
            />
          </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base sm:text-lg shadow-2xl hover:shadow-green-500/50 transition-all transform active:scale-95 sm:hover:scale-[1.02]"
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

