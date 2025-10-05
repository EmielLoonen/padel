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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initializeAuth();
  }, [refreshKey]);

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
    return <SettingsPage onBack={() => {
      setShowSettings(false);
      // Trigger user data refresh by updating the key
      setRefreshKey(prev => prev + 1);
      // Also refresh sessions to update avatars in session cards
      fetchSessions('upcoming');
    }} />;
  }

  if (selectedSessionId) {
    return (
      <SessionDetailPage
        key={refreshKey}
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
      <div className="min-h-screen bg-dark-bg p-3 sm:p-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowCreateForm(false)}
            className="mb-4 sm:mb-6 bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all text-sm sm:text-base"
          >
            ← Back to Dashboard
          </button>
          <CreateSessionPage onSuccess={() => setShowCreateForm(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-3 sm:p-4 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-8 border border-gray-800">
          <div className="flex justify-between items-start sm:items-center flex-wrap gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-5xl">🎾</span>
                <span className="truncate">Padel Coordinator</span>
              </h1>
              <p className="text-sm sm:text-lg text-gray-400">
                Welcome, <span className="font-semibold text-padel-green">{user?.name}</span>! 👋
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={() => setShowSettings(true)}
                className="hover:opacity-80 transition-opacity"
                title="Settings"
              >
                <Avatar src={user?.avatarUrl} name={user?.name || ''} size="md" />
              </button>
              <NotificationBell onNotificationClick={(sessionId) => sessionId && setSelectedSessionId(sessionId)} />
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 sm:py-2.5 px-3 sm:px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Create Session Button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-gradient-to-r from-padel-orange to-orange-500 text-white py-3 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-orange-600 transition-all font-bold text-base sm:text-xl mb-4 sm:mb-8 shadow-2xl hover:shadow-orange-500/50 active:scale-95 sm:hover:scale-[1.02] transform"
        >
          <span className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">+</span>
            Create New Session
          </span>
        </button>

        {/* Sessions List */}
        <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
          <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
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
            <div className="grid gap-2 sm:gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="group bg-dark-elevated border border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-padel-green transition-all cursor-pointer active:opacity-80"
                >
                  {/* Header - Venue and Date/Time in one line for mobile */}
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <h3 className="text-base sm:text-2xl font-bold text-white group-hover:text-padel-green transition-colors truncate">
                      {session.venueName}
                    </h3>
                    <span className="text-xs sm:text-sm text-padel-green font-bold whitespace-nowrap">
                      {session.time}
                    </span>
                  </div>
                  
                  {/* Date - Compact for mobile */}
                  <p className="text-xs sm:text-base text-gray-400 mb-2 sm:mb-3">
                    {new Date(session.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                    {session.totalCost && <span className="ml-2">• €{session.totalCost}</span>}
                  </p>

                  {session.notes && (
                    <p className="text-xs text-gray-400 italic mb-2 truncate sm:mb-3">
                      "{session.notes}"
                    </p>
                  )}

                  {/* Court Assignments - Compact */}
                  {session.courts && session.courts.length > 0 && (
                    <div className="space-y-1.5 sm:space-y-2">
                      {session.courts.map((court) => {
                        const courtRSVPs = court.rsvps?.filter(r => r.status === 'yes') || [];
                        const courtGuests = court.guests || [];
                        const totalPlayers = courtRSVPs.length + courtGuests.length;
                        const spotsLeft = court.maxPlayers - totalPlayers;
                        
                        return (
                          <div key={court.id} className="bg-[#1a1a1a] rounded p-2 sm:p-3 border border-gray-800">
                            {/* Court header - single compact line */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold text-padel-green">
                                  Court {court.courtNumber}
                                </span>
                                <span className="text-[10px] sm:text-xs text-gray-500">
                                  {court.startTime} • {court.duration}min
                                </span>
                              </div>
                              <span className={`text-[10px] sm:text-xs font-semibold ${
                                spotsLeft === 0 ? 'text-red-400' : 'text-padel-green'
                              }`}>
                                {totalPlayers}/4
                              </span>
                            </div>
                            
                            {/* Players - avatars only on mobile */}
                            {totalPlayers > 0 && (
                              <div className="flex flex-wrap gap-1 sm:gap-2">
                                {courtRSVPs.map(rsvp => (
                                  <div key={rsvp.id} title={rsvp.user.name}>
                                    <Avatar 
                                      src={rsvp.user.avatarUrl} 
                                      name={rsvp.user.name} 
                                      size="sm"
                                      className="ring-2 ring-green-500/30"
                                    />
                                  </div>
                                ))}
                                {courtGuests.map(guest => (
                                  <div key={guest.id} title={`${guest.name} (Guest)`}>
                                    <Avatar 
                                      src={null} 
                                      name={guest.name} 
                                      size="sm"
                                      className="ring-2 ring-blue-500/30"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Waitlist - Compact */}
                      {session.rsvps && session.rsvps.filter(r => r.status === 'yes' && !r.courtId).length > 0 && (
                        <div className="bg-[#1a1a1a] rounded p-2 border border-yellow-500/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-yellow-400">⏳ Waitlist</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {session.rsvps
                              .filter(r => r.status === 'yes' && !r.courtId)
                              .map(rsvp => (
                                <div key={rsvp.id} title={rsvp.user.name}>
                                  <Avatar 
                                    src={rsvp.user.avatarUrl} 
                                    name={rsvp.user.name} 
                                    size="sm"
                                    className="ring-2 ring-yellow-500/30"
                                  />
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                      
                      {/* Maybes - Compact */}
                      {session.rsvps && session.rsvps.filter(r => r.status === 'maybe').length > 0 && (
                        <div className="bg-[#1a1a1a] rounded p-2 border border-gray-700">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-gray-400">🤔 Maybe</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {session.rsvps
                              .filter(r => r.status === 'maybe')
                              .map(rsvp => (
                                <div key={rsvp.id} title={rsvp.user.name}>
                                  <Avatar 
                                    src={rsvp.user.avatarUrl} 
                                    name={rsvp.user.name} 
                                    size="sm"
                                    className="opacity-60"
                                  />
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Footer - Creator */}
                  <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      By {session.creator.name}
                    </span>
                    <span className="text-xs text-padel-green">
                      {session.numberOfCourts} {session.numberOfCourts === 1 ? 'court' : 'courts'}
                    </span>
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
