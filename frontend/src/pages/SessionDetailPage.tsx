import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSessionStore } from '../store/sessionStore';
import { useRSVPStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import CourtSelector from '../components/CourtSelector';
import EditSessionModal from '../components/EditSessionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import AddGuestModal from '../components/AddGuestModal';
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
  const [rsvpStatus, setRSVPStatus] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionById(sessionId);
    fetchRSVPs(sessionId);
  }, [sessionId]);

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

  const isCreator = currentSession?.creator.id === user?.id;

  if (isLoading || !currentSession) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800">
            <LoadingSpinner size="lg" text="Loading session..." />
          </div>
        </div>
      </div>
    );
  }

  const yesRSVPs = rsvps.filter((r) => r.status === 'yes');
  const noRSVPs = rsvps.filter((r) => r.status === 'no');
  const maybeRSVPs = rsvps.filter((r) => r.status === 'maybe');
  const waitlistRSVPs = yesRSVPs.filter((r) => !r.courtId);

  return (
    <div className="min-h-screen bg-dark-bg p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all"
        >
          ← Back to Dashboard
        </button>

        {/* Session Details Card */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 mb-6 border border-gray-800">
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
            <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
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
              <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-sm mb-1">💰 Total Cost</p>
                <p className="text-white font-bold text-lg">€{currentSession.totalCost}</p>
              </div>
            )}

            <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">🎾 Number of Courts</p>
              <p className="text-white font-bold text-lg">
                {currentSession.numberOfCourts} {currentSession.numberOfCourts === 1 ? 'Court' : 'Courts'}
              </p>
            </div>

            <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm mb-1">👥 Attendance</p>
              <p className="text-white font-bold text-lg">
                {rsvpSummary?.yes || 0} Coming · {rsvpSummary?.maybe || 0} Maybe · {rsvpSummary?.no || 0} Can't Make It
              </p>
            </div>
          </div>

          {/* Notes */}
          {currentSession.notes && (
            <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-gray-300 italic">"{currentSession.notes}"</p>
            </div>
          )}
        </div>

        {/* RSVP Section */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 mb-6 border border-gray-800">
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
          <div className="bg-dark-card rounded-2xl shadow-2xl p-8 mb-6 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-4">Courts Overview</h2>
            <div className="grid gap-4">
              {courtsInfo.map((court) => (
                <div
                  key={court.id}
                  className="bg-dark-elevated p-6 rounded-xl border-2 border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-padel-green mb-1">
                        Court {court.courtNumber}
                      </h3>
                      <p className="text-gray-400">
                        🕐 {court.startTime} ({court.duration} min)
                      </p>
                      {court.cost && (
                        <p className="text-padel-green font-semibold mt-1">
                          💰 €{court.cost} <span className="text-sm text-gray-400">(€{(court.cost / 4).toFixed(2)}/person)</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          (court.availableSpots ?? 0) === 0 ? 'text-red-400' : 'text-padel-green'
                        }`}>
                          {court.availableSpots ?? 0}/{court.maxPlayers}
                        </p>
                        <p className="text-xs text-gray-500">Available</p>
                      </div>
                      {(court.availableSpots ?? 0) > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCourtForGuest({ id: court.id, number: court.courtNumber });
                            setShowAddGuestModal(true);
                          }}
                          className="bg-padel-blue hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
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
                        <div className="flex flex-wrap gap-2">
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
                        <div className="flex flex-wrap gap-2">
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

        {/* Attendance Lists */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">Full Attendance List</h2>

          {/* Waitlist */}
          {waitlistRSVPs.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-500/10 rounded-xl border-2 border-yellow-500/30">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <span>⏳</span>
                Waitlist ({waitlistRSVPs.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {waitlistRSVPs.map((rsvp) => (
                  <span
                    key={rsvp.id}
                    className="inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-yellow-500/30"
                  >
                    {rsvp.user.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coming */}
          {yesRSVPs.filter((r) => r.courtId).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                <span>✅</span>
                Coming ({yesRSVPs.filter((r) => r.courtId).length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {yesRSVPs
                  .filter((r) => r.courtId)
                  .map((rsvp) => (
                    <span
                      key={rsvp.id}
                      className="inline-block bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-500/30"
                    >
                      {rsvp.user.name}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Maybe */}
          {maybeRSVPs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <span>🤔</span>
                Maybe ({maybeRSVPs.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {maybeRSVPs.map((rsvp) => (
                  <span
                    key={rsvp.id}
                    className="inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-yellow-500/30"
                  >
                    {rsvp.user.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Can't Make It */}
          {noRSVPs.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3 flex items-center gap-2">
                <span>❌</span>
                Can't Make It ({noRSVPs.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {noRSVPs.map((rsvp) => (
                  <span
                    key={rsvp.id}
                    className="inline-block bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-500/30"
                  >
                    {rsvp.user.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rsvps.length === 0 && (
            <p className="text-gray-400 text-center py-4">No RSVPs yet. Be the first!</p>
          )}
        </div>

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
