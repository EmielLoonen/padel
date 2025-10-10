import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSessionStore } from '../store/sessionStore';
import { useRSVPStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import CourtSelector from '../components/CourtSelector';
import EditSessionModal from '../components/EditSessionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import AddGuestModal from '../components/AddGuestModal';
import AddMatchModal from '../components/AddMatchModal';
import EditMatchModal from '../components/EditMatchModal';
import Avatar from '../components/Avatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SessionDetailPageProps {
  sessionId: string;
  onBack: () => void;
}

export default function SessionDetailPage({ sessionId, onBack }: SessionDetailPageProps) {
  const { currentSession, fetchSessionById, deleteSession, isLoading } = useSessionStore();
  const { rsvps, rsvpSummary, courtsInfo, fetchRSVPs, createOrUpdateRSVP, isLoadingRSVP } =
    useRSVPStore();
  const { user } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [selectedCourtForGuest, setSelectedCourtForGuest] = useState<{ id: string; number: number } | null>(null);
  const [showAddMatchModal, setShowAddMatchModal] = useState(false);
  const [selectedCourtForMatch, setSelectedCourtForMatch] = useState<{ id: string; number: number } | null>(null);
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [selectedMatchForEdit, setSelectedMatchForEdit] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [rsvpStatus, setRSVPStatus] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionById(sessionId);
    fetchRSVPs(sessionId);
    fetchMatches();
  }, [sessionId]);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/matches/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(response.data.matches);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm('Are you sure you want to delete this match?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMatches();
    } catch (error) {
      console.error('Failed to delete match:', error);
      alert('Failed to delete match');
    }
  };

  useEffect(() => {
    const userRSVP = rsvps.find((r) => r.userId === user?.id);
    if (userRSVP) {
      setRSVPStatus(userRSVP.status as 'yes' | 'no' | 'maybe');
      setSelectedCourtId(userRSVP.courtId || null);
    }
  }, [rsvps, user]);

  const handleRSVPChange = async (status: 'yes' | 'no' | 'maybe') => {
    // If clicking the same status, do nothing
    if (rsvpStatus === status) {
      return;
    }
    
    setRSVPStatus(status);
    
    if (status !== 'yes') {
      // For "no" and "maybe", submit immediately without court selection
      try {
        await createOrUpdateRSVP(sessionId, status, null);
        await fetchSessionById(sessionId); // Refresh to get updated courts
        await fetchRSVPs(sessionId);
      } catch (error: any) {
        alert(error?.response?.data?.error || 'Failed to update RSVP');
        setRSVPStatus(null);
      }
    } else if (status === 'yes') {
      // For "yes", check if we have court info
      if (!courtsInfo || courtsInfo.length === 0) {
        console.error('No courts available');
        alert('No courts available for this session');
        setRSVPStatus(null);
        return;
      }
      
      // If only one court, auto-submit
      if (courtsInfo.length === 1) {
        const court = courtsInfo[0];
        if (!court.isFull && (court.rsvps?.length || 0) < court.maxPlayers) {
          try {
            await createOrUpdateRSVP(sessionId, status, court.id);
            setSelectedCourtId(court.id);
            await fetchSessionById(sessionId);
            await fetchRSVPs(sessionId);
          } catch (error: any) {
            alert(error?.response?.data?.error || 'Failed to update RSVP');
            setRSVPStatus(null);
          }
        } else {
          alert('Court is full');
          setRSVPStatus(null);
        }
      }
      // For multiple courts, just set status and wait for court selection
    }
  };

  const handleCourtSelection = async (courtId: string | null) => {
    setSelectedCourtId(courtId);
    
    // Submit RSVP with court selection
    if (rsvpStatus === 'yes') {
      try {
        await createOrUpdateRSVP(sessionId, rsvpStatus, courtId);
        await fetchSessionById(sessionId); // Refresh to get updated courts
      } catch (error: any) {
        alert(error?.response?.data?.error || 'Failed to update RSVP');
        setSelectedCourtId(null);
      }
    }
  };

  const handleAddGuest = async (courtId: string, name: string) => {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_URL}/api/guests/court/${courtId}`,
      { name },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // Refresh session and RSVP data
    await fetchSessionById(sessionId);
    await fetchRSVPs(sessionId);
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (!confirm('Remove this guest?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/guests/${guestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh session and RSVP data
      await fetchSessionById(sessionId);
      await fetchRSVPs(sessionId);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to remove guest');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSession(sessionId);
      onBack(); // Go back to list after deletion
    } catch (error) {
      alert('Failed to delete session');
    }
  };

  const isCreator = currentSession?.creator.id === user?.id || user?.isAdmin;

  if (isLoading || !currentSession) {
    return (
      <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800">
            <LoadingSpinner size="lg" text="Loading session..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all"
        >
          ← Back to Dashboard
        </button>

        {/* Session Details Card */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 border border-gray-800">
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{currentSession.venueName}</h1>
              <p className="text-gray-400 text-lg">
                Created by{' '}
                <span className="font-semibold text-padel-green">{currentSession.creator.name}</span>
              </p>
            </div>

            {/* Creator Actions */}
            {isCreator && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Session Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-dark-elevated p-3 sm:p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">📅 Date & Time</p>
              <p className="text-white font-bold text-lg">
                {new Date(currentSession.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
                {' at '}
                <span className="text-padel-green">{currentSession.time}</span>
              </p>
            </div>

            {currentSession.totalCost && (
              <div className="bg-dark-elevated p-3 sm:p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">💰 Total Cost</p>
                <p className="text-white font-bold text-lg">€{currentSession.totalCost}</p>
              </div>
            )}

            <div className="bg-dark-elevated p-3 sm:p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">🎾 Number of Courts</p>
              <p className="text-white font-bold text-lg">
                {currentSession.numberOfCourts} {currentSession.numberOfCourts === 1 ? 'Court' : 'Courts'}
              </p>
            </div>

            <div className="bg-dark-elevated p-3 sm:p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">👥 Attendance</p>
              <p className="text-white font-bold text-lg">
                {rsvpSummary?.yes || 0} Coming · {rsvpSummary?.maybe || 0} Maybe · {rsvpSummary?.no || 0} Can't Make It
              </p>
            </div>
          </div>

          {/* Notes */}
          {currentSession.notes && (
            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
              <p className="text-gray-300 italic">"{currentSession.notes}"</p>
            </div>
          )}
        </div>

        {/* RSVP Section */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-4">Your RSVP</h2>

          {/* RSVP Status Buttons */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <button
              onClick={() => handleRSVPChange('yes')}
              disabled={isLoadingRSVP}
              className={`flex-1 min-w-[120px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                rsvpStatus === 'yes'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/50'
                  : 'bg-dark-elevated text-gray-300 hover:bg-green-500/20 border-2 border-gray-700 hover:border-green-500'
              }`}
            >
              ✅ I'm Coming
            </button>
            <button
              onClick={() => handleRSVPChange('maybe')}
              disabled={isLoadingRSVP}
              className={`flex-1 min-w-[120px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                rsvpStatus === 'maybe'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-2xl shadow-yellow-500/50'
                  : 'bg-dark-elevated text-gray-300 hover:bg-yellow-500/20 border-2 border-gray-700 hover:border-yellow-500'
              }`}
            >
              🤔 Maybe
            </button>
            <button
              onClick={() => handleRSVPChange('no')}
              disabled={isLoadingRSVP}
              className={`flex-1 min-w-[120px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                rsvpStatus === 'no'
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-2xl shadow-red-500/50'
                  : 'bg-dark-elevated text-gray-300 hover:bg-red-500/20 border-2 border-gray-700 hover:border-red-500'
              }`}
            >
              ❌ Can't Make It
            </button>
          </div>

          {/* Court Selection (only shown if user said "yes") */}
          {rsvpStatus === 'yes' && courtsInfo && courtsInfo.length > 0 && (
            <div className="mt-6">
              <CourtSelector
                courts={courtsInfo}
                selectedCourtId={selectedCourtId}
                onSelectCourt={handleCourtSelection}
                disabled={isLoadingRSVP}
              />
            </div>
          )}
        </div>

        {/* Courts Overview */}
        {courtsInfo && courtsInfo.length > 0 && (
          <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 border border-gray-800">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Courts Overview</h2>
            <div className="grid gap-4">
              {courtsInfo.map((court) => (
                <div
                  key={court.id}
                  className="bg-dark-elevated p-4 sm:p-6 rounded-xl border-2 border-gray-700"
                >
                  {/* Header - Mobile: Stack, Desktop: Row */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-padel-green mb-1">
                        Court {court.courtNumber}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-400">
                        🕐 {court.startTime} ({court.duration} min)
                      </p>
                      {court.cost && (
                        <p className="text-padel-green font-semibold mt-1 text-sm sm:text-base">
                          💰 €{court.cost} <span className="text-xs sm:text-sm text-gray-400">(€{(court.cost / 4).toFixed(2)}/person)</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Mobile: Row layout for status and button */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-base sm:text-lg ${
                          (court.availableSpots ?? 0) === 0 ? 'text-red-400' : 'text-padel-green'
                        }`}>
                          {court.availableSpots ?? 0}/{court.maxPlayers}
                        </p>
                        <p className="text-xs text-gray-500">spots</p>
                      </div>
                      {(court.availableSpots ?? 0) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCourtForGuest({ id: court.id, number: court.courtNumber });
                            setShowAddGuestModal(true);
                          }}
                          className="bg-padel-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                          title="Add guest player"
                        >
                          + Guest
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Players and Guests on this court */}
                  <div className="space-y-3">
                    {/* Registered players */}
                    {court.rsvps && court.rsvps.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">Registered Players</p>
                        {/* Mobile: Always vertical, Desktop: Wrap */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                          {court.rsvps.map((rsvp) => (
                            <div
                              key={rsvp.id}
                              className="flex items-center gap-2 bg-green-500/20 px-2 py-1.5 rounded-lg border border-green-500/30"
                            >
                              <Avatar src={rsvp.user.avatarUrl} name={rsvp.user.name} size="sm" />
                              <span className="text-sm font-medium text-green-400">
                                {rsvp.user.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Guest players */}
                    {court.guests && court.guests.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">Guest Players</p>
                        {/* Mobile: Always vertical, Desktop: Wrap */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                          {court.guests.map((guest) => (
                            <div
                              key={guest.id}
                              className="flex items-center gap-2 bg-blue-500/20 px-2 py-1.5 rounded-lg border border-blue-500/30 group"
                            >
                              <Avatar src={null} name={guest.name} size="sm" />
                              <span className="text-sm font-medium text-blue-400">
                                {guest.name}
                              </span>
                              <span className="text-xs text-gray-500">(Guest)</span>
                              {(guest.addedBy.id === user?.id || isCreator) && (
                                <button
                                  onClick={() => handleRemoveGuest(guest.id)}
                                  className="ml-1 text-red-500 hover:text-red-400 text-sm sm:text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                  title="Remove guest"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {!court.rsvps?.length && !court.guests?.length && (
                      <p className="text-gray-500 italic text-sm">No players yet</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Results Section - Only show after session date */}
        {currentSession && new Date(currentSession.date) < new Date() && courtsInfo && (
          <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🏆</span>
                Match Results
              </h2>
            </div>

            {/* Match History */}
            {matches.length > 0 ? (
              <div className="space-y-4 mb-6">
                {matches.map((match) => {
                  const sets = JSON.parse(match.sets);
                  let team1SetsWon = 0;
                  let team2SetsWon = 0;
                  sets.forEach((set: any) => {
                    if (set.team1 > set.team2) team1SetsWon++;
                    else if (set.team2 > set.team1) team2SetsWon++;
                  });
                  const team1Won = team1SetsWon > team2SetsWon;
                  
                  const isCreator = match.createdById === user?.id || user?.isAdmin;
                  
                  return (
                    <div key={match.id} className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-400">Court {match.court.courtNumber}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </span>
                          {isCreator && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setSelectedMatchForEdit(match);
                                  setShowEditMatchModal(true);
                                }}
                                className="text-padel-green hover:text-green-600 p-1 text-sm"
                                title="Edit match"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteMatch(match.id)}
                                className="text-red-500 hover:text-red-600 p-1 text-sm"
                                title="Delete match"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mobile: Vertical layout, Desktop: 3-column grid */}
                      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4 sm:items-center">
                        {/* Team 1 */}
                        <div className={`p-3 rounded-lg ${team1Won ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-800 border border-gray-700'}`}>
                          <p className="text-xs text-gray-400 mb-2 sm:hidden">Team 1 {team1Won && '(Winner)'}</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Avatar src={match.team1Player1.avatarUrl} name={match.team1Player1.name} size="sm" />
                              <span className="text-xs sm:text-sm text-white truncate">{match.team1Player1.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Avatar src={match.team1Player2.avatarUrl} name={match.team1Player2.name} size="sm" />
                              <span className="text-xs sm:text-sm text-white truncate">{match.team1Player2.name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Sets */}
                        <div className="text-center bg-dark-bg p-3 rounded-lg sm:bg-transparent sm:p-0">
                          <div className="text-2xl sm:text-2xl font-bold text-white mb-2">
                            {team1SetsWon} - {team2SetsWon}
                          </div>
                          <div className="flex flex-col gap-1">
                            {sets.map((set: any, idx: number) => (
                              <div key={idx} className="text-xs sm:text-sm text-gray-400">
                                Set {idx + 1}: <span className="text-white">{set.team1} - {set.team2}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team 2 */}
                        <div className={`p-3 rounded-lg ${!team1Won ? 'bg-green-500/20 border-2 border-green-500' : 'bg-gray-800 border border-gray-700'}`}>
                          <p className="text-xs text-gray-400 mb-2 sm:hidden">
                            Team 2 {!team1Won && '(Winner)'}
                          </p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Avatar src={match.team2Player1.avatarUrl} name={match.team2Player1.name} size="sm" />
                              <span className="text-xs sm:text-sm text-white truncate">{match.team2Player1.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Avatar src={match.team2Player2.avatarUrl} name={match.team2Player2.name} size="sm" />
                              <span className="text-xs sm:text-sm text-white truncate">{match.team2Player2.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic mb-6">No matches recorded yet</p>
            )}

            {/* Add Match Buttons for each court (only for courts without matches) */}
            {courtsInfo.filter((court) => !matches.some((match) => match.court.id === court.id)).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 mb-2">Record a match:</p>
                <div className="flex flex-wrap gap-2">
                  {courtsInfo
                    .filter((court) => !matches.some((match) => match.court.id === court.id))
                    .map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          setSelectedCourtForMatch({ id: court.id, number: court.courtNumber });
                          setShowAddMatchModal(true);
                        }}
                        className="bg-gradient-to-r from-padel-green to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium"
                      >
                        + Court {court.courtNumber}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <EditSessionModal
            session={currentSession}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              fetchSessionById(sessionId);
            }}
          />
        )}

        {/* Add Guest Modal */}
        {showAddGuestModal && selectedCourtForGuest && (
          <AddGuestModal
            courtId={selectedCourtForGuest.id}
            courtNumber={selectedCourtForGuest.number}
            onAdd={handleAddGuest}
            onClose={() => {
              setShowAddGuestModal(false);
              setSelectedCourtForGuest(null);
            }}
          />
        )}

        {/* Add Match Modal */}
        {showAddMatchModal && selectedCourtForMatch && courtsInfo && (
          <AddMatchModal
            courtId={selectedCourtForMatch.id}
            courtNumber={selectedCourtForMatch.number}
            players={(() => {
              // Find the court
              const court = courtsInfo.find((c) => c.id === selectedCourtForMatch.id);
              if (!court) return [];
              
              // Get registered players on this court
              const courtPlayers = court.rsvps?.map((rsvp) => ({
                id: rsvp.user.id,
                name: rsvp.user.name,
              })) || [];
              
              // Get guest players on this court
              const guestPlayers = court.guests?.map((guest) => ({
                id: guest.id,
                name: `${guest.name} (Guest)`,
              })) || [];
              
              return [...courtPlayers, ...guestPlayers];
            })()}
            onSuccess={() => {
              setShowAddMatchModal(false);
              setSelectedCourtForMatch(null);
              fetchMatches();
              fetchSessionById(sessionId);
              fetchRSVPs(sessionId);
            }}
            onClose={() => {
              setShowAddMatchModal(false);
              setSelectedCourtForMatch(null);
            }}
          />
        )}

        {/* Edit Match Modal */}
        {showEditMatchModal && selectedMatchForEdit && (
          <EditMatchModal
            matchId={selectedMatchForEdit.id}
            courtNumber={selectedMatchForEdit.court.courtNumber}
            initialSets={JSON.parse(selectedMatchForEdit.sets)}
            onSuccess={() => {
              setShowEditMatchModal(false);
              setSelectedMatchForEdit(null);
              fetchMatches();
            }}
            onClose={() => {
              setShowEditMatchModal(false);
              setSelectedMatchForEdit(null);
            }}
          />
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-2xl p-8 max-w-md w-full border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-4">Delete Session?</h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete this session? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-dark-elevated text-white py-3 px-6 rounded-xl hover:bg-[#2a2a2a] transition-colors font-medium border border-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white py-3 px-6 rounded-xl hover:bg-red-600 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
