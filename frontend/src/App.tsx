import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useSessionStore } from './store/sessionStore';
import { useNotificationStore } from './store/notificationStore';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateSessionPage from './pages/CreateSessionPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SettingsPage from './pages/SettingsPage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import AdminPage from './pages/AdminPage';
import NotificationBell from './components/NotificationBell';
import LoadingSpinner from './components/LoadingSpinner';
import Avatar from './components/Avatar';
import './App.css';

function App() {
  const { isAuthenticated, user, logout, initializeAuth } = useAuthStore();
  const { sessions, fetchSessions, isLoading } = useSessionStore();
  const { fetchNotifications } = useNotificationStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessionTab, setSessionTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isPullingToRefresh, setIsPullingToRefresh] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    initializeAuth();
  }, [refreshKey]);

  useEffect(() => {
    if (isAuthenticated) {
      // Reset to upcoming tab on login
      setSessionTab('upcoming');
      fetchSessions('upcoming');
      setShowSignup(false); // Reset to login page when authenticated
      // Reset all view states to show dashboard
      setShowSettings(false);
      setShowStats(false);
      setShowCreateForm(false);
      setSelectedSessionId(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions(sessionTab);
    }
  }, [sessionTab]);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    // Check if at top of page (iOS compatible)
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (pullStartY > 0 && scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - pullStartY;
      
      if (distance > 0 && distance < 120) {
        setPullDistance(distance);
        setIsPullingToRefresh(true);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      // Show loading indicator
      setIsPullingToRefresh(true);
      
      // Full app refresh - reload all data
      try {
        await Promise.all([
          fetchSessions(sessionTab),
          fetchNotifications(),
          // Refresh user data by re-initializing auth
          initializeAuth()
        ]);
      } catch (error) {
        console.error('Refresh error:', error);
      }
      
      // Small delay to show the refresh happened
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Reset state
    setPullStartY(0);
    setPullDistance(0);
    setIsPullingToRefresh(false);
  };

  if (!isAuthenticated) {
    if (showSignup) {
      return <SignupPage onBackToLogin={() => setShowSignup(false)} />;
    }
    return <LoginPage onShowSignup={() => setShowSignup(true)} />;
  }

  if (showAdmin) {
    return <AdminPage onBack={() => setShowAdmin(false)} />;
  }

  if (showSettings) {
    return (
      <SettingsPage
        onBack={() => {
          setShowSettings(false);
          // Trigger user data refresh by updating the key
          setRefreshKey(prev => prev + 1);
          // Also refresh sessions to update avatars in session cards
          fetchSessions('upcoming');
        }}
        onShowAdmin={() => {
          setShowSettings(false);
          setShowAdmin(true);
        }}
      />
    );
  }

  if (showStats) {
    return <PlayerStatsPage onBack={() => setShowStats(false)} />;
  }

  if (selectedSessionId) {
    return (
      <SessionDetailPage
        key={refreshKey}
        sessionId={selectedSessionId}
        onBack={() => {
          setSelectedSessionId(null);
          fetchSessions(sessionTab);
        }}
      />
    );
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
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
    <div 
      className="min-h-screen bg-dark-bg p-2 sm:p-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to Refresh Indicator */}
      {isPullingToRefresh && (
        <div 
          className="fixed top-0 left-0 right-0 flex justify-center items-center z-50 transition-opacity"
          style={{ 
            opacity: Math.min(pullDistance / 60, 1),
            transform: `translateY(${Math.min(pullDistance - 10, 50)}px)`
          }}
        >
          <div className="bg-dark-card text-padel-green px-4 py-2 rounded-full shadow-lg border border-padel-green/30 flex items-center gap-2">
            <div className="animate-spin">↻</div>
            <span className="text-sm font-medium">
              {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-8 mb-4 sm:mb-8 border border-gray-800">
          {/* Mobile: Compact layout */}
          <div className="sm:hidden">
            {/* Top row: Title and icons */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎾</span>
                <span>POPKNOTS</span>
              </h1>
              <div className="flex items-center gap-2">
                <NotificationBell onNotificationClick={(sessionId) => sessionId && setSelectedSessionId(sessionId)} />
                <button
                  onClick={() => setShowSettings(true)}
                  className="hover:opacity-80 transition-opacity"
                  title="Settings"
                >
                  <Avatar src={user?.avatarUrl} name={user?.name || ''} size="md" />
                </button>
              </div>
            </div>
            
            {/* Bottom row: Welcome and Stats button */}
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                Hey <span className="font-semibold text-padel-green">{user?.name}</span>! 👋
              </p>
              <button
                onClick={() => setShowStats(true)}
                className="bg-gradient-to-r from-padel-green to-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg flex items-center gap-1"
                title="Stats"
              >
                📊 Stats
              </button>
            </div>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden sm:flex justify-between items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-5xl">🎾</span>
                <span className="truncate">POPKNOTS</span>
              </h1>
              <p className="text-lg text-gray-400">
                Welcome, <span className="font-semibold text-padel-green">{user?.name}</span>
                {user?.isAdmin && <span className="ml-2 text-yellow-500" title="Admin">🛡️</span>}! 👋
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <NotificationBell onNotificationClick={(sessionId) => sessionId && setSelectedSessionId(sessionId)} />
              <button
                onClick={() => setShowStats(true)}
                className="bg-gradient-to-r from-padel-green to-emerald-600 text-white py-2.5 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium"
                title="View Stats"
              >
                📊 Stats
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="hover:opacity-80 transition-opacity"
                title="Settings"
              >
                <Avatar src={user?.avatarUrl} name={user?.name || ''} size="md" />
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
          className="w-full bg-gradient-to-r from-padel-orange to-orange-500 text-white py-3 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-orange-600 transition-all font-bold text-base sm:text-xl mb-4 sm:mb-8 shadow-2xl hover:shadow-orange-500/50 active:scale-95 sm:hover:scale-[1.02] transform"
        >
          <span className="flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">+</span>
            Create New Session
          </span>
        </button>

        {/* Sessions List */}
        <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setSessionTab('upcoming')}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                sessionTab === 'upcoming'
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              📅 Booked Sessions
            </button>
            <button
              onClick={() => setSessionTab('past')}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                sessionTab === 'past'
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              🏆 Past Sessions
            </button>
          </div>

          <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
            <span className="text-padel-green">{sessionTab === 'upcoming' ? '📅' : '🏆'}</span>
            {sessionTab === 'upcoming' ? 'Booked Sessions' : 'Past Sessions'}
          </h2>

          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner text="Loading sessions..." />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-6xl mb-4">{sessionTab === 'upcoming' ? '🎾' : '🏆'}</p>
              <p className="text-xl font-semibold mb-2 text-white">
                {sessionTab === 'upcoming' ? 'No booked sessions!' : 'No past sessions yet!'}
              </p>
              <p className="text-sm">
                {sessionTab === 'upcoming' ? 'Create your first padel session above' : 'Past sessions will appear here'}
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="group bg-dark-elevated border border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-padel-green transition-all cursor-pointer active:opacity-80 overflow-hidden"
                >
                  {/* Header - Venue and Date/Time in one line for mobile */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 overflow-hidden">
                    <h3 className="text-base sm:text-2xl font-bold text-white group-hover:text-padel-green transition-colors truncate flex-1 min-w-0">
                      {session.venueName}
                    </h3>
                    <span className="text-xs sm:text-sm text-padel-green font-bold whitespace-nowrap flex-shrink-0 ml-auto">
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
                    {(() => {
                      const totalCourtCost = session.courts?.reduce((sum, court) => sum + (court.cost || 0), 0) || 0;
                      return totalCourtCost > 0 ? <span className="ml-2">• €{totalCourtCost}</span> : null;
                    })()}
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
                                  {court.cost && <span className="ml-1">• €{(court.cost / 4).toFixed(2)}/p</span>}
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
                      
                      {/* Can't Make It - Compact */}
                      {session.rsvps && session.rsvps.filter(r => r.status === 'no').length > 0 && (
                        <div className="bg-[#1a1a1a] rounded p-2 border border-red-500/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-red-400">❌ Can't Make It</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {session.rsvps
                              .filter(r => r.status === 'no')
                              .map(rsvp => (
                                <div key={rsvp.id} title={rsvp.user.name}>
                                  <Avatar 
                                    src={rsvp.user.avatarUrl} 
                                    name={rsvp.user.name} 
                                    size="sm"
                                    className="opacity-40 grayscale"
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
