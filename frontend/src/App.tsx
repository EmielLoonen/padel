import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useSessionStore } from './store/sessionStore';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateSessionPage from './pages/CreateSessionPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SettingsPage from './pages/SettingsPage';
import NotificationBell from './components/NotificationBell';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import './App.css';

function App() {
  const { isAuthenticated, user, logout, initializeAuth } = useAuthStore();
  const { sessions, fetchSessions, isLoading } = useSessionStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions('upcoming');
      setShowSignup(false); // Reset to login page when authenticated
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    if (showSignup) {
      return <SignupPage onBackToLogin={() => setShowSignup(false)} />;
    }
    return <LoginPage onShowSignup={() => setShowSignup(true)} />;
  }

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  if (selectedSessionId) {
    return (
      <SessionDetailPage
        sessionId={selectedSessionId}
        onBack={() => {
          setSelectedSessionId(null);
          fetchSessions('upcoming');
        }}
      />
    );
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowCreateForm(false)}
            className="mb-6 bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all"
          >
            ← Back to Dashboard
          </button>
          <CreateSessionPage onSuccess={() => setShowCreateForm(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 mb-8 border border-gray-800">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-5xl">🎾</span>
                Padel Coordinator
              </h1>
              <p className="text-lg text-gray-400">
                Welcome back, <span className="font-semibold text-padel-green">{user?.name}</span>! 👋
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell onNotificationClick={(sessionId) => sessionId && setSelectedSessionId(sessionId)} />
              <button
                onClick={() => setShowSettings(true)}
                className="bg-dark-elevated text-gray-300 hover:text-white py-2.5 px-6 rounded-lg hover:bg-gray-700 transition-all shadow-lg border border-gray-700 font-medium"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Create Session Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-gradient-to-r from-padel-orange to-orange-500 text-white py-5 px-8 rounded-2xl hover:from-orange-600 hover:to-orange-600 transition-all font-bold text-xl mb-8 shadow-2xl hover:shadow-orange-500/50 hover:scale-[1.02] transform"
        >
          <span className="flex items-center justify-center gap-3">
            <span className="text-2xl">+</span>
            Create New Session
          </span>
        </button>

        {/* Sessions List */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-padel-green">📅</span>
            Upcoming Sessions
          </h2>

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner text="Loading sessions..." />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-6xl mb-4">🎾</p>
              <p className="text-xl font-semibold mb-2 text-white">No sessions yet!</p>
              <p className="text-sm">Create your first padel session above</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="group relative bg-dark-elevated border-2 border-gray-800 rounded-xl p-6 hover:shadow-2xl hover:border-padel-green hover:bg-[#2a2a2a] transition-all cursor-pointer hover:scale-[1.02] transform"
                >
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-padel-green/20 to-transparent rounded-bl-full"></div>
                  
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-padel-green transition-colors">
                        {session.venueName}
                      </h3>
                      
                      <div className="space-y-2">
                        <p className="text-gray-300 font-medium flex items-center gap-2">
                          <span className="text-lg">📅</span>
                          {new Date(session.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                          <span className="text-padel-green font-bold">at {session.time}</span>
                        </p>
                        
                        {session.totalCost && (
                          <p className="text-gray-400 flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <span className="font-semibold">€{session.totalCost}</span>
                          </p>
                        )}
                      </div>

                      {session.notes && (
                        <div className="mt-4 p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded">
                          <p className="text-gray-300 italic text-sm">
                            "{session.notes}"
                          </p>
                        </div>
                      )}

                      {/* Court Assignments */}
                      {session.courts && session.courts.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {session.courts.map((court) => {
                            const courtRSVPs = court.rsvps?.filter(r => r.status === 'yes') || [];
                            const courtGuests = court.guests || [];
                            const totalPlayers = courtRSVPs.length + courtGuests.length;
                            const spotsLeft = court.maxPlayers - totalPlayers;
                            
                            return (
                              <div key={court.id} className="p-3 bg-[#2a2a2a] rounded-lg border border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-padel-green">
                                      Court {court.courtNumber}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      🕐 {court.startTime} ({court.duration} min)
                                    </span>
                                  </div>
                                  <span className={`text-xs font-semibold ${
                                    spotsLeft === 0 ? 'text-red-400' : 'text-padel-green'
                                  }`}>
                                    {spotsLeft}/{court.maxPlayers} spots
                                  </span>
                                </div>
                                
                                {totalPlayers > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {/* Registered players */}
                                    {courtRSVPs.map(rsvp => (
                                      <div 
                                        key={rsvp.id} 
                                        className="flex items-center gap-2 bg-green-500/20 px-2 py-1.5 rounded-lg border border-green-500/30"
                                        title={rsvp.user.name}
                                      >
                                        <Avatar 
                                          src={rsvp.user.avatarUrl} 
                                          name={rsvp.user.name} 
                                          size="sm"
                                        />
                                        <span className="text-xs font-medium text-green-400">
                                          {rsvp.user.name}
                                        </span>
                                      </div>
                                    ))}
                                    {/* Guest players */}
                                    {courtGuests.map(guest => (
                                      <div 
                                        key={guest.id} 
                                        className="flex items-center gap-2 bg-blue-500/20 px-2 py-1.5 rounded-lg border border-blue-500/30"
                                        title={`${guest.name} (Guest)`}
                                      >
                                        <Avatar 
                                          src={null} 
                                          name={guest.name} 
                                          size="sm"
                                        />
                                        <span className="text-xs font-medium text-blue-400">
                                          {guest.name}
                                        </span>
                                        <span className="text-[10px] text-gray-500">Guest</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">No players yet</p>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Waitlist */}
                          {session.rsvps && session.rsvps.filter(r => r.status === 'yes' && !r.courtId).length > 0 && (
                            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-yellow-400">⏳ Waitlist</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {session.rsvps
                                  .filter(r => r.status === 'yes' && !r.courtId)
                                  .map(rsvp => (
                                    <div 
                                      key={rsvp.id} 
                                      className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1.5 rounded-lg border border-yellow-500/30"
                                      title={rsvp.user.name}
                                    >
                                      <Avatar 
                                        src={rsvp.user.avatarUrl} 
                                        name={rsvp.user.name} 
                                        size="sm"
                                      />
                                      <span className="text-xs font-medium text-yellow-400">
                                        {rsvp.user.name}
                                      </span>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                          
                          {/* Maybes */}
                          {session.rsvps && session.rsvps.filter(r => r.status === 'maybe').length > 0 && (
                            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-yellow-400">🤔 Maybe</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {session.rsvps
                                  .filter(r => r.status === 'maybe')
                                  .map(rsvp => (
                                    <div 
                                      key={rsvp.id} 
                                      className="flex items-center gap-2 bg-yellow-500/20 px-2 py-1.5 rounded-lg border border-yellow-500/30"
                                      title={rsvp.user.name}
                                    >
                                      <Avatar 
                                        src={rsvp.user.avatarUrl} 
                                        name={rsvp.user.name} 
                                        size="sm"
                                      />
                                      <span className="text-xs font-medium text-yellow-400">
                                        {rsvp.user.name}
                                      </span>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Court Info */}
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 bg-padel-green/20 text-padel-green px-3 py-1.5 rounded-lg text-sm font-medium border border-padel-green/30">
                          <span>🎾</span>
                          <span>{session.numberOfCourts} {session.numberOfCourts === 1 ? 'Court' : 'Courts'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className="bg-gradient-to-r from-padel-green to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        By {session.creator.name}
                      </span>
                      <span className="text-gray-400 group-hover:text-padel-green transition-colors">
                        →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
