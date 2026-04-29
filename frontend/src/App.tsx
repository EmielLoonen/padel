import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useSessionStore } from './store/sessionStore';
import { useRSVPStore } from './store/sessionStore';
import { useNotificationStore } from './store/notificationStore';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CreateSessionPage from './pages/CreateSessionPage';
import SessionDetailPage from './pages/SessionDetailPage';
import SettingsPage from './pages/SettingsPage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import AdminPage from './pages/AdminPage';
import GroupSetupPage from './pages/GroupSetupPage';
import GroupSwitcher from './components/GroupSwitcher';
import NotificationBell from './components/NotificationBell';
import SponsorCarousel from './components/SponsorCarousel';
import Avatar from './components/Avatar';
import MissedNotificationsModal from './components/MissedNotificationsModal';
import './App.css';

function App() {
  const { isAuthenticated, isInitializing, user, logout, initializeAuth } = useAuthStore();
  const { sessions, fetchSessions, isLoading } = useSessionStore();
  const { createOrUpdateRSVP } = useRSVPStore();
  const { fetchNotifications, fetchMissedNotifications, missedNotifications } = useNotificationStore();
  const [rsvpLoadingIds, setRsvpLoadingIds] = useState<Set<string>>(new Set());
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
  const [showMissedNotifications, setShowMissedNotifications] = useState(false);
  const [hasCheckedMissedNotifications, setHasCheckedMissedNotifications] = useState(false);
  const [showGroupSetup, setShowGroupSetup] = useState(false);
  const [allGroupsMode, setAllGroupsMode] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, [refreshKey]);

  useEffect(() => {
    if (isAuthenticated) {
      // Reset to upcoming tab on login
      setSessionTab('upcoming');
      fetchSessions('upcoming');
      fetchNotifications();
      setShowSignup(false); // Reset to login page when authenticated
      // Reset all view states to show dashboard
      setShowSettings(false);
      setShowStats(false);
      setShowCreateForm(false);
      setSelectedSessionId(null);
      
      // Check for missed notifications (only once per session)
      // Note: This will be called after login, but we need to check if this is a fresh login
      // For now, we'll check missed notifications - if user just logged in via login page,
      // the previousLastLogin will be passed from the login response
      if (!hasCheckedMissedNotifications) {
        // Try to get previousLastLogin from localStorage (set during login)
        const previousLastLogin = localStorage.getItem('previousLastLogin');
        fetchMissedNotifications(previousLastLogin || undefined).then(() => {
          localStorage.removeItem('previousLastLogin'); // Clean up
          setHasCheckedMissedNotifications(true);
        }).catch((error) => {
          console.error('Error fetching missed notifications:', error);
          localStorage.removeItem('previousLastLogin'); // Clean up
          setHasCheckedMissedNotifications(true); // Set to true even on error to prevent retries
        });
      }
    } else {
      // Reset when logged out
      setHasCheckedMissedNotifications(false);
      setShowMissedNotifications(false);
    }
  }, [isAuthenticated, hasCheckedMissedNotifications]);

  // Show modal when missed notifications are loaded
  useEffect(() => {
    if (isAuthenticated && hasCheckedMissedNotifications && missedNotifications.length > 0) {
      setShowMissedNotifications(true);
    }
  }, [missedNotifications, hasCheckedMissedNotifications, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessions(sessionTab, allGroupsMode);
    }
  }, [sessionTab, allGroupsMode]);

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
          fetchSessions(sessionTab, allGroupsMode),
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

  const handleQuickRSVP = async (e: React.MouseEvent, sessionId: string, status: 'yes' | 'no') => {
    e.stopPropagation();
    e.preventDefault();
    setRsvpLoadingIds(prev => new Set(prev).add(sessionId));
    try {
      await createOrUpdateRSVP(sessionId, status, null);
      await fetchSessions(sessionTab, allGroupsMode);
    } catch (err) {
      console.error('Quick RSVP failed:', err);
    } finally {
      setRsvpLoadingIds(prev => { const s = new Set(prev); s.delete(sessionId); return s; });
    }
  };

  if (isInitializing) {
    return <SponsorCarousel fullscreen />;
  }

  if (!isAuthenticated) {
    if (showSignup) {
      return <SignupPage onBackToLogin={() => setShowSignup(false)} />;
    }
    return <LoginPage onShowSignup={() => setShowSignup(true)} />;
  }

  // If authenticated but not in any group yet, show group setup
  if (!user?.groupId && !user?.isSuperAdmin) {
    return <GroupSetupPage onSuccess={() => fetchSessions('upcoming')} />;
  }

  // Overlay: user wants to create or join an additional group
  if (showGroupSetup) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => setShowGroupSetup(false)}
            className="mb-4 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            ← Back
          </button>
          <GroupSetupPage onSuccess={() => { setShowGroupSetup(false); fetchSessions(sessionTab); }} />
        </div>
      </div>
    );
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
                  className="relative hover:opacity-80 transition-opacity"
                  title="Settings"
                >
                  <Avatar src={user?.avatarUrl} name={user?.name || ''} size="md" />
                  <span className="absolute -bottom-1 -right-1 bg-dark-card border border-gray-700 rounded-full w-4 h-4 flex items-center justify-center text-[9px]">⚙️</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Welcome + Stats */}
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

            {/* Group switcher: full width row on mobile */}
            <div className="mt-2">
              <GroupSwitcher
                allGroupsMode={allGroupsMode}
                onGroupSwitched={() => {
                  setAllGroupsMode(false);
                  fetchSessions(sessionTab, false);
                  fetchNotifications();
                }}
                onAllGroups={() => setAllGroupsMode(true)}
                onCreateOrJoin={() => setShowGroupSetup(true)}
              />
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
              <GroupSwitcher
                allGroupsMode={allGroupsMode}
                onGroupSwitched={() => {
                  setAllGroupsMode(false);
                  fetchSessions(sessionTab, false);
                  fetchNotifications();
                }}
                onAllGroups={() => setAllGroupsMode(true)}
                onCreateOrJoin={() => setShowGroupSetup(true)}
              />
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
                className="relative hover:opacity-80 transition-opacity"
                title="Settings"
              >
                <Avatar src={user?.avatarUrl} name={user?.name || ''} size="md" />
                <span className="absolute -bottom-1 -right-1 bg-dark-card border border-gray-700 rounded-full w-4 h-4 flex items-center justify-center text-[9px]">⚙️</span>
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

        {/* Create Session Button - Only show if user has permission */}
        {(user?.isAdmin || user?.canCreateSessions !== false) && (
          <>
            <button
              onClick={() => !allGroupsMode && setShowCreateForm(true)}
              disabled={allGroupsMode}
              className={`w-full bg-gradient-to-r from-padel-orange to-orange-500 text-white py-3 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold text-base sm:text-xl mb-2 shadow-2xl transform transition-all ${
                allGroupsMode
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:from-orange-600 hover:to-orange-600 hover:shadow-orange-500/50 active:scale-95 sm:hover:scale-[1.02]'
              }`}
            >
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">+</span>
                Create New Event
              </span>
            </button>
            {allGroupsMode && (
              <p className="text-center text-xs text-gray-500 mb-4 sm:mb-8">
                Select a group first to create an event.
              </p>
            )}
          </>
        )}

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
              📅 Events
            </button>
            <button
              onClick={() => setSessionTab('past')}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                sessionTab === 'past'
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              🏆 Past Events
            </button>
          </div>

          {isLoading ? (
            <SponsorCarousel fullscreen={false} />
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-6xl mb-4">{sessionTab === 'upcoming' ? '🎾' : '🏆'}</p>
              <p className="text-xl font-semibold mb-2 text-white">
                {sessionTab === 'upcoming' ? 'No booked events!' : 'No past events yet!'}
              </p>
              <p className="text-sm">
                {sessionTab === 'upcoming' ? 'Create your first padel event above' : 'Past events will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {(() => {
                // Group sessions by date
                const grouped = sessions.reduce((acc, session) => {
                  const dateKey = session.date.split('T')[0];
                  if (!acc[dateKey]) acc[dateKey] = [];
                  acc[dateKey].push(session);
                  return acc;
                }, {} as Record<string, typeof sessions>);

                return Object.entries(grouped).map(([dateKey, dateSessions]) => (
                  <div key={dateKey}>
                    {/* Date group header */}
                    <div className="flex items-center gap-3 mb-2 sm:mb-3">
                      <div className="h-px flex-1 bg-gray-700" />
                      <span className="text-xs sm:text-sm font-bold text-padel-green whitespace-nowrap px-1">
                        {new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {dateSessions.length > 1 && (
                          <span className="ml-2 text-gray-500 font-normal">({dateSessions.length} events)</span>
                        )}
                      </span>
                      <div className="h-px flex-1 bg-gray-700" />
                    </div>

                    {/* Sessions for this date */}
                    <div className="grid gap-2 sm:gap-3">
              {dateSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className="group bg-dark-elevated border border-gray-700 rounded-lg sm:rounded-xl p-3 sm:p-6 hover:border-padel-green transition-all cursor-pointer active:opacity-80 overflow-hidden"
                >
                  {/* Header - Venue and Time */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3 overflow-hidden">
                    <h3 className="text-base sm:text-2xl font-bold text-white group-hover:text-padel-green transition-colors truncate flex-1 min-w-0">
                      {session.venueName}
                    </h3>
                    {session.sportType === 'TENNIS' && (
                      <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap flex-shrink-0">
                        Tennis
                      </span>
                    )}
                    {allGroupsMode && session.group && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-padel-green/20 text-padel-green border border-padel-green/30 whitespace-nowrap flex-shrink-0">
                        {session.group.name}
                      </span>
                    )}
                    <span className="text-base sm:text-2xl text-padel-green font-bold whitespace-nowrap flex-shrink-0 ml-auto">
                      {session.courts?.[0] && (
                        <span className="mr-1">Court {session.courts[0].courtNumber} ·</span>
                      )}
                      {session.time}
                    </span>
                  </div>

                  {/* Cost only (date is shown in the group header) */}
                  {session.courts?.[0]?.cost && (
                    <p className="text-xs sm:text-base text-gray-400 mb-2 sm:mb-3">
                      €{Number(session.courts[0].cost).toFixed(2)}
                    </p>
                  )}

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
                        const courtGuests = court.guests?.filter((g: any) => g.status === 'yes') || [];
                        const totalPlayers = courtRSVPs.length + courtGuests.length;
                        const spotsLeft = court.maxPlayers - totalPlayers;
                        
                        return (
                          <div key={court.id} className="bg-[#1a1a1a] rounded p-2 sm:p-3 border border-gray-800">
                            {/* Court header - single compact line */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] sm:text-xs text-gray-500">
                                  {court.duration}min
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
                                {courtGuests.map((guest: any) => (
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
                      {(() => {
                        const maybeRSVPs = session.rsvps?.filter(r => r.status === 'maybe') || [];
                        const maybeGuests = session.guests?.filter((g: any) => g.status === 'maybe') || [];
                        return (maybeRSVPs.length > 0 || maybeGuests.length > 0) && (
                          <div className="bg-[#1a1a1a] rounded p-2 border border-gray-700">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-bold text-gray-400">🤔 Maybe</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {maybeRSVPs.map(rsvp => (
                                <div key={rsvp.id} title={rsvp.user.name}>
                                  <Avatar 
                                    src={rsvp.user.avatarUrl} 
                                    name={rsvp.user.name} 
                                    size="sm"
                                    className="opacity-60"
                                  />
                                </div>
                              ))}
                              {maybeGuests.map((guest: any) => (
                                <div key={guest.id} title={`${guest.name} (Guest)`}>
                                  <Avatar 
                                    src={null} 
                                    name={guest.name} 
                                    size="sm"
                                    className="opacity-60 ring-2 ring-blue-500/30"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Can't Make It - Compact */}
                      {(() => {
                        const noRSVPs = session.rsvps?.filter(r => r.status === 'no') || [];
                        const noGuests = session.guests?.filter((g: any) => g.status === 'no') || [];
                        return (noRSVPs.length > 0 || noGuests.length > 0) && (
                          <div className="bg-[#1a1a1a] rounded p-2 border border-red-500/30">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-bold text-red-400">❌ Can't Make It</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {noRSVPs.map(rsvp => (
                                <div key={rsvp.id} title={rsvp.user.name}>
                                  <Avatar 
                                    src={rsvp.user.avatarUrl} 
                                    name={rsvp.user.name} 
                                    size="sm"
                                    className="opacity-40 grayscale"
                                  />
                                </div>
                              ))}
                              {noGuests.map((guest: any) => (
                                <div key={guest.id} title={`${guest.name} (Guest)`}>
                                  <Avatar 
                                    src={null} 
                                    name={guest.name} 
                                    size="sm"
                                    className="opacity-40 grayscale ring-2 ring-blue-500/30"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* Quick RSVP - only for upcoming events with no response yet */}
                  {sessionTab === 'upcoming' && !session.rsvps?.find(r => r.user.id === user?.id) && !rsvpLoadingIds.has(session.id) &&
                    (() => {
                      const court = session.courts?.[0];
                      const confirmed = (court?.rsvps?.filter((r: any) => r.status === 'yes').length || 0) + (court?.guests?.filter((g: any) => g.status === 'yes').length || 0);
                      return confirmed < (court?.maxPlayers || 4);
                    })() && (
                    <div className="mt-2 pt-2 border-t border-gray-800 flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleQuickRSVP(e, session.id, 'yes')}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-padel-green/20 border border-padel-green/50 text-padel-green hover:bg-padel-green hover:text-white transition-all"
                      >
                        I'm coming
                      </button>
                      <button
                        onClick={(e) => handleQuickRSVP(e, session.id, 'no')}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                      >
                        Can't make it
                      </button>
                    </div>
                  )}

                  {/* Footer - Creator */}
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <span className="text-xs text-gray-500">
                      By {session.creator.name}
                    </span>
                  </div>
                </div>
              ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
      
      {/* Missed Notifications Modal */}
      {showMissedNotifications && (
        <MissedNotificationsModal
          onClose={() => setShowMissedNotifications(false)}
          onNotificationClick={(sessionId) => setSelectedSessionId(sessionId)}
        />
      )}
    </div>
  );
}

export default App;
