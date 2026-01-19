import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useSessionStore } from '../store/sessionStore';
import { useRSVPStore } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';
import CourtSelector from '../components/CourtSelector';
import EditSessionModal from '../components/EditSessionModal';
import LoadingSpinner from '../components/LoadingSpinner';
import AddGuestModal from '../components/AddGuestModal';
import AddUserModal from '../components/AddUserModal';
import AddSetModal from '../components/AddSetModal';
import EditSetModal from '../components/EditSetModal';
import Avatar from '../components/Avatar';
import RatingDisplay from '../components/RatingDisplay';
import OverlapWarningModal from '../components/OverlapWarningModal';

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
  const [showAddSetModal, setShowAddSetModal] = useState(false);
  const [selectedCourtForSet, setSelectedCourtForSet] = useState<{ id: string; number: number } | null>(null);
  const [sets, setSets] = useState<any[]>([]);
  const [showEditSetModal, setShowEditSetModal] = useState(false);
  const [selectedSetForEdit, setSelectedSetForEdit] = useState<any>(null);
  const [rsvpStatus, setRSVPStatus] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [playerStats, setPlayerStats] = useState<any[]>([]);
  const [playerRatings, setPlayerRatings] = useState<Map<string, number>>(new Map());
  const [matchPredictions, setMatchPredictions] = useState<Map<string, any>>(new Map());
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedCourtForAddUser, setSelectedCourtForAddUser] = useState<{ id: string; number: number } | null>(null);
  const [showOverlapWarning, setShowOverlapWarning] = useState(false);
  const [overlaps, setOverlaps] = useState<Array<{ sessionId: string; sessionName: string; date: string; courtNumber: number; startTime: string; endTime: string }>>([]);
  const [pendingRSVP, setPendingRSVP] = useState<{ status: 'yes' | 'no' | 'maybe'; courtId: string | null } | null>(null);
  const isProcessingRSVP = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Reset initialization flag when session changes
    hasInitialized.current = false;
    isProcessingRSVP.current = false;
    
    fetchSessionById(sessionId);
    fetchRSVPs(sessionId);
    fetchSets();
    fetchPlayerStats();
    fetchPlayerRatings();
  }, [sessionId]);

  const fetchPlayerStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sets/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayerStats(response.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
    }
  };

  const fetchPlayerRatings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ratings/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ratingsMap = new Map<string, number>();
      response.data.leaderboard.forEach((player: any) => {
        if (player.rating !== null && player.rating !== undefined) {
          ratingsMap.set(player.userId, player.rating);
        }
      });
      setPlayerRatings(ratingsMap);
    } catch (error) {
      console.error('Failed to fetch player ratings:', error);
    }
  };

  const fetchMatchPrediction = async (team1Ids: string[], team2Ids: string[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/ratings/predict-match`,
        { team1PlayerIds: team1Ids, team2PlayerIds: team2Ids },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.prediction;
    } catch (error) {
      console.error('Failed to fetch match prediction:', error);
      return null;
    }
  };

  const calculateBalancedTeams = (court: any) => {
    const allPlayers = [
      ...(court.rsvps?.map((rsvp: any) => ({ id: rsvp.user.id, name: rsvp.user.name, isGuest: false })) || []),
      ...(court.guests?.filter((guest: any) => guest.status === 'yes').map((guest: any) => ({ id: guest.id, name: guest.name, isGuest: true })) || []),
    ];

    if (allPlayers.length !== 4) return null;

    // Get stats and ratings for each player
    const playersWithStats = allPlayers.map((player) => {
      const stats = playerStats.find((s) => s.userId === player.id);
      const rating = playerRatings.get(player.id) || null;
      return {
        ...player,
        gameWinRate: stats?.gameWinRate || 0,
        totalGames: stats?.totalGames || 0,
        rating: rating || (player.isGuest ? null : 5.0), // Default to 5.0 for registered users without rating, null for guests
      };
    });

    // Sort by UTR rating (guests and players with no rating go to bottom)
    const sortedPlayers = [...playersWithStats].sort((a, b) => {
      if (a.isGuest && b.isGuest) return 0;
      if (a.isGuest) return 1;
      if (b.isGuest) return -1;
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingA === 0 && ratingB === 0) return 0;
      if (ratingA === 0) return 1;
      if (ratingB === 0) return -1;
      return ratingB - ratingA; // Sort descending (highest rating first)
    });

    // Best + Worst vs Middle two
    return {
      team1: [sortedPlayers[0], sortedPlayers[3]],
      team2: [sortedPlayers[1], sortedPlayers[2]],
    };
  };

  const fetchSets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sets/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSets(response.data.sets);
    } catch (error) {
      console.error('Failed to fetch sets:', error);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!window.confirm('Are you sure you want to delete this set?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/sets/${setId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSets();
    } catch (error) {
      console.error('Failed to delete set:', error);
      alert('Failed to delete set');
    }
  };

  useEffect(() => {
    // Only update RSVP status from rsvps if we're not currently processing an RSVP change
    if (!isProcessingRSVP.current) {
      const userRSVP = rsvps.find((r) => r.userId === user?.id);
      if (userRSVP) {
        // Only update if status actually changed to prevent unnecessary updates
        const newStatus = userRSVP.status as 'yes' | 'no' | 'maybe';
        if (rsvpStatus !== newStatus) {
          setRSVPStatus(newStatus);
        }
        const newCourtId = userRSVP.courtId || null;
        if (selectedCourtId !== newCourtId) {
          setSelectedCourtId(newCourtId);
        }
      } else {
        // Only reset if we had a status before (not on initial load)
        if (hasInitialized.current && rsvpStatus !== null) {
          setRSVPStatus(null);
          setSelectedCourtId(null);
        }
      }
      // Mark as initialized after RSVPs have been loaded and courtsInfo is available
      // This ensures we don't process RSVP changes until data is ready
      if (!hasInitialized.current && !isLoadingRSVP && courtsInfo !== null) {
        hasInitialized.current = true;
      }
    }
  }, [rsvps, user]);

  const handleRSVPChange = async (status: 'yes' | 'no' | 'maybe', event?: React.MouseEvent) => {
    // CRITICAL: Only process if this was triggered by a user click (event must be present)
    // This prevents alerts from showing on page load or automatic triggers
    if (!event) {
      console.warn('handleRSVPChange called without event - ignoring');
      return;
    }
    
    // Prevent default and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // Don't process if not initialized yet (still loading initial data)
    if (!hasInitialized.current) {
      console.warn('handleRSVPChange called before initialization - ignoring');
      return;
    }
    
    // Prevent multiple simultaneous requests
    if (isLoadingRSVP || isProcessingRSVP.current) {
      console.warn('handleRSVPChange called while processing - ignoring');
      return;
    }
    
    // If clicking the same status, do nothing
    if (rsvpStatus === status) {
      return;
    }
    
    // Set processing flag
    isProcessingRSVP.current = true;
    const previousStatus = rsvpStatus;
    setRSVPStatus(status);
    
    try {
      if (status !== 'yes') {
        // For "no" and "maybe", submit immediately without court selection
        try {
          await createOrUpdateRSVP(sessionId, status, null);
          await fetchSessionById(sessionId); // Refresh to get updated courts
          await fetchRSVPs(sessionId);
        } catch (error: any) {
          const errorMessage = error?.response?.data?.error || 'Failed to update RSVP';
          // Only show alert if this was a user-initiated action
          if (event) {
            alert(errorMessage);
          } else {
            console.error('RSVP error (non-user action):', errorMessage);
          }
          // Reset to previous status on error
          setRSVPStatus(previousStatus);
        }
      } else if (status === 'yes') {
        // For "yes", check if we have court info
        if (!courtsInfo || courtsInfo.length === 0) {
          console.error('No courts available');
          // Only show alert if this was a user-initiated action
          if (event) {
            alert('No courts available for this session');
          }
          setRSVPStatus(previousStatus);
          return;
        }
        
        // Check if all courts are full first
        const allCourtsFull = courtsInfo.every((court) => court.isFull || (court.rsvps?.length || 0) >= court.maxPlayers);
        
        if (allCourtsFull) {
          // All courts are full - add to waitlist
          try {
            await createOrUpdateRSVP(sessionId, status, null);
            setSelectedCourtId(null);
            await fetchSessionById(sessionId);
            await fetchRSVPs(sessionId);
          } catch (error: any) {
            const errorMessage = error?.response?.data?.error || 'Failed to update RSVP';
            // Only show alert if this was a user-initiated action
            if (event) {
              alert(errorMessage);
            } else {
              console.error('RSVP error (non-user action):', errorMessage);
            }
            // Reset to previous status on error
            setRSVPStatus(previousStatus);
          }
        } else {
          // Auto-select first available court
          const availableCourt = courtsInfo.find(
            (court) => !court.isFull && (court.rsvps?.length || 0) < court.maxPlayers
          );
          
          if (availableCourt) {
            // Auto-select first available court and submit immediately
            try {
              const result = await createOrUpdateRSVP(sessionId, status, availableCourt.id);
              
              // Check for overlaps
              if (result?.overlaps && result.overlaps.length > 0) {
                // Store overlaps and show warning modal
                setOverlaps(result.overlaps);
                setPendingRSVP({ status, courtId: availableCourt.id });
                setShowOverlapWarning(true);
                // Don't update status yet - wait for user confirmation
                setRSVPStatus(previousStatus);
                return;
              }
              
              setSelectedCourtId(availableCourt.id);
              await fetchSessionById(sessionId);
              await fetchRSVPs(sessionId);
            } catch (error: any) {
              const errorMessage = error?.response?.data?.error || 'Failed to update RSVP';
              
              // Handle "Court is full" error specifically
              if (errorMessage === 'Court is full' || errorMessage.includes('full')) {
                // Only show alert if this was a user-initiated action
                if (event) {
                  alert('This court is now full. Please try selecting another court or join the waitlist.');
                } else {
                  console.error('Court is full error (non-user action):', errorMessage);
                }
                // Refresh court info to get latest state
                await fetchRSVPs(sessionId);
                // Reset to previous status
                setRSVPStatus(previousStatus);
              } else {
                // Only show alert if this was a user-initiated action
                if (event) {
                  alert(errorMessage);
                } else {
                  console.error('RSVP error (non-user action):', errorMessage);
                }
                setRSVPStatus(previousStatus);
              }
            }
          } else {
            // Fallback: just set status and show court selector
            // (This shouldn't normally happen, but keeping as safety)
            setRSVPStatus(previousStatus);
          }
        }
      }
    } finally {
      // Always clear processing flag
      isProcessingRSVP.current = false;
    }
  };

  const handleCourtSelection = async (courtId: string | null) => {
    // Don't process if not initialized yet
    if (!hasInitialized.current) {
      return;
    }
    
    // Prevent if already processing
    if (isProcessingRSVP.current || isLoadingRSVP) {
      return;
    }
    
    setSelectedCourtId(courtId);
    
    // Submit RSVP with court selection
    if (rsvpStatus === 'yes' && courtId) {
      isProcessingRSVP.current = true;
      try {
        const result = await createOrUpdateRSVP(sessionId, rsvpStatus, courtId);
        
        // Check for overlaps
        if (result?.overlaps && result.overlaps.length > 0) {
          // Store overlaps and show warning modal
          setOverlaps(result.overlaps);
          setPendingRSVP({ status: rsvpStatus, courtId });
          setShowOverlapWarning(true);
          // Revert court selection until user confirms
          setSelectedCourtId(null);
          return;
        }
        
        await fetchSessionById(sessionId); // Refresh to get updated courts
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Failed to update RSVP';
        // Only show alert for user-initiated actions (court selection is always user-initiated)
        alert(errorMessage);
        setSelectedCourtId(null);
      } finally {
        isProcessingRSVP.current = false;
      }
    }
  };

  const handleOverlapProceed = async () => {
    if (!pendingRSVP) return;
    
    setShowOverlapWarning(false);
    isProcessingRSVP.current = true;
    
    try {
      // RSVP was already created, just refresh the data
      setSelectedCourtId(pendingRSVP.courtId);
      setRSVPStatus(pendingRSVP.status);
      await fetchSessionById(sessionId);
      await fetchRSVPs(sessionId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to refresh session data';
      alert(errorMessage);
    } finally {
      isProcessingRSVP.current = false;
      setPendingRSVP(null);
      setOverlaps([]);
    }
  };

  const handleOverlapCancel = async () => {
    if (!pendingRSVP) return;
    
    setShowOverlapWarning(false);
    isProcessingRSVP.current = true;
    
    try {
      // Delete the RSVP that was just created
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/rsvps/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh data
      await fetchSessionById(sessionId);
      await fetchRSVPs(sessionId);
      setRSVPStatus(null);
      setSelectedCourtId(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to cancel RSVP';
      alert(errorMessage);
    } finally {
      isProcessingRSVP.current = false;
      setPendingRSVP(null);
      setOverlaps([]);
    }
  };

  const handleAddGuest = async (sessionId: string, courtId: string | null, name: string, status: string) => {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_URL}/api/guests/session/${sessionId}`,
      { name, status, courtId },
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

  const handleAdminRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the session?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/admin/sessions/${sessionId}/remove-user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchRSVPs(sessionId);
      await fetchSessionById(sessionId);
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to remove user from session');
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

          {/* Check if all courts are full or if user is already on a court */}
          {(() => {
            const allCourtsFull = courtsInfo && courtsInfo.length > 0 && 
              courtsInfo.every((court) => court.isFull || (court.rsvps?.length || 0) >= court.maxPlayers);
            const userHasCourt = selectedCourtId !== null;
            
            // If user is already on a court, only show "Can't Make It"
            if (userHasCourt && rsvpStatus === 'yes') {
              return (
                <div className="mb-6">
                  <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                    <p className="text-green-400 font-semibold mb-2">✓ You're Confirmed!</p>
                    <p className="text-gray-300 text-sm">
                      You're already assigned to a court. If you can't make it, click below to cancel.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => handleRSVPChange('no', e)}
                    disabled={isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                      (rsvpStatus as string) === 'no'
                        ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-2xl shadow-red-500/50'
                        : 'bg-dark-elevated text-gray-300 hover:bg-red-500/20 border-2 border-gray-700 hover:border-red-500'
                    }`}
                  >
                    ❌ Can't Make It
                  </button>
                </div>
              );
            }
            
            return allCourtsFull ? (
              // All courts full - show waitlist option and "Can't Make It" only
              <>
                <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
                  <p className="text-yellow-400 font-semibold mb-2">⚠️ All Courts Are Full</p>
                  <p className="text-gray-300 text-sm">
                    All courts for this session are currently full. You can join the waitlist below and you'll be notified if a spot opens up.
                  </p>
                </div>
                
                {/* Waitlist Button */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={(e) => handleRSVPChange('yes', e)}
                    disabled={isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current || rsvpStatus === 'yes'}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all border-2 ${
                      rsvpStatus === 'yes'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : 'bg-dark-elevated text-gray-300 hover:bg-yellow-500/20 border-gray-700 hover:border-yellow-500'
                    } ${(isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">⏳</span>
                      <span>{rsvpStatus === 'yes' ? 'On Waitlist' : 'Join Waitlist'}</span>
                    </div>
                  </button>
                </div>

                {/* Can't Make It Button */}
                <button
                  type="button"
                  onClick={(e) => handleRSVPChange('no', e)}
                  disabled={isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    rsvpStatus === 'no'
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-2xl shadow-red-500/50'
                      : 'bg-dark-elevated text-gray-300 hover:bg-red-500/20 border-2 border-gray-700 hover:border-red-500'
                  }`}
                >
                  ❌ Can't Make It
                </button>
              </>
            ) : (
              // Courts available - show all RSVP options
              <div className="flex gap-3 mb-6 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => handleRSVPChange('yes', e)}
                  disabled={isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current}
                  className={`flex-1 min-w-[120px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    rsvpStatus === 'yes'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl shadow-green-500/50'
                      : 'bg-dark-elevated text-gray-300 hover:bg-green-500/20 border-2 border-gray-700 hover:border-green-500'
                  } ${(isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ✅ I'm Coming
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRSVPChange('maybe', e)}
                  disabled={isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current}
                  className={`flex-1 min-w-[120px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    rsvpStatus === 'maybe'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-2xl shadow-yellow-500/50'
                      : 'bg-dark-elevated text-gray-300 hover:bg-yellow-500/20 border-2 border-gray-700 hover:border-yellow-500'
                  } ${(isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  🤔 Maybe
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRSVPChange('no', e)}
                  disabled={isLoadingRSVP || isProcessingRSVP.current || !hasInitialized.current}
                  className={`flex-1 min-w-[120px] py-4 px-6 rounded-xl font-bold text-lg transition-all ${
                    rsvpStatus === 'no'
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-2xl shadow-red-500/50'
                      : 'bg-dark-elevated text-gray-300 hover:bg-red-500/20 border-2 border-gray-700 hover:border-red-500'
                  }`}
                >
                  ❌ Can't Make It
                </button>
              </div>
            );
          })()}

          {/* Court Selection (only shown if user said "yes" and courts are available) */}
          {rsvpStatus === 'yes' && courtsInfo && courtsInfo.length > 0 && (() => {
            const allCourtsFull = courtsInfo.every((court) => court.isFull || (court.rsvps?.length || 0) >= court.maxPlayers);
            
            // Don't show court selector if all courts are full (user is on waitlist)
            if (allCourtsFull && !selectedCourtId) {
              return (
                <div className="mt-6">
                  <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 rounded-lg">
                    <p className="text-yellow-400 font-semibold">⏳ You're on the waitlist</p>
                    <p className="text-gray-300 text-sm mt-1">
                      You'll be notified if a spot opens up on any court.
                    </p>
                  </div>
                </div>
              );
            }
            
            // Show court selector if user has a court or if courts are available
            return (
              <div className="mt-6">
                {selectedCourtId && rsvpStatus === 'yes' && (
                  <p className="text-sm text-gray-400 mb-3">
                    ✓ You're confirmed! You can change your court selection below if needed.
                  </p>
                )}
                <CourtSelector
                  courts={courtsInfo}
                  selectedCourtId={selectedCourtId}
                  onSelectCourt={(courtId) => {
                    // Only allow court selection if initialized and not processing
                    if (hasInitialized.current && !isProcessingRSVP.current && !isLoadingRSVP) {
                      handleCourtSelection(courtId);
                    }
                  }}
                  disabled={isLoadingRSVP || !hasInitialized.current || isProcessingRSVP.current}
                />
              </div>
            );
          })()}
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
                      <div className="flex gap-2">
                        {user?.isAdmin && (
                          <button
                            onClick={() => {
                              setSelectedCourtForAddUser({ id: court.id, number: court.courtNumber });
                              setShowAddUserModal(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                            title="Add user (Admin)"
                          >
                            + User
                          </button>
                        )}
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
                      </div>
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
                              className="flex items-center gap-2 bg-green-500/20 px-2 py-1.5 rounded-lg border border-green-500/30 group"
                            >
                              <Avatar src={rsvp.user.avatarUrl} name={rsvp.user.name} size="sm" />
                              <span className="text-sm font-medium text-green-400">
                                {rsvp.user.name}
                              </span>
                              {playerRatings.has(rsvp.user.id) && (
                                <RatingDisplay 
                                  rating={playerRatings.get(rsvp.user.id)!} 
                                  size="sm" 
                                />
                              )}
                              {user?.isAdmin && (
                                <button
                                  onClick={() => handleAdminRemoveUser(rsvp.user.id)}
                                  className="ml-auto text-red-500 hover:text-red-400 text-sm sm:text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                  title="Remove user"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Guest players (only "yes" status) */}
                    {court.guests && court.guests.filter((g: any) => g.status === 'yes').length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2 font-semibold">Guest Players</p>
                        {/* Mobile: Always vertical, Desktop: Wrap */}
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                          {court.guests.filter((g: any) => g.status === 'yes').map((guest: any) => (
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
                    
                    {!court.rsvps?.length && !court.guests?.filter((g: any) => g.status === 'yes').length && (
                      <p className="text-gray-500 italic text-sm">No players yet</p>
                    )}

                    {/* Smart Balance Suggestion - Only show if exactly 4 players */}
                    {(() => {
                      const totalPlayers = (court.rsvps?.length || 0) + (court.guests?.filter((g: any) => g.status === 'yes').length || 0);
                      if (totalPlayers !== 4) return null;
                      
                      const balancedTeams = calculateBalancedTeams(court);
                      if (!balancedTeams) return null;

                      // Get team IDs for prediction (only for registered users, not guests)
                      const team1Ids = balancedTeams.team1.map((p: any) => p.isGuest ? null : p.id).filter((id: any) => id !== null);
                      const team2Ids = balancedTeams.team2.map((p: any) => p.isGuest ? null : p.id).filter((id: any) => id !== null);
                      const predictionKey = `${team1Ids.join(',')}-${team2Ids.join(',')}`;
                      const prediction = matchPredictions.get(predictionKey);

                      // Fetch prediction if not already loaded and both teams have 2 registered users
                      if (!prediction && team1Ids.length === 2 && team2Ids.length === 2) {
                        fetchMatchPrediction(team1Ids, team2Ids).then((pred) => {
                          if (pred) {
                            setMatchPredictions(new Map(matchPredictions.set(predictionKey, pred)));
                          }
                        });
                      }

                      return (
                        <div className="mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🎯</span>
                            <p className="text-sm font-bold text-purple-300">Smart Balance Suggestion</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                            {/* Team 1 */}
                            <div className="bg-dark-card p-2 rounded-lg border border-gray-700">
                              <p className="text-xs text-gray-400 mb-1">Team 1</p>
                              {balancedTeams.team1.map((player: any) => (
                                <div key={player.id} className="flex items-center justify-between text-xs">
                                  <span className="text-white">{player.name}</span>
                                  {player.rating !== null && player.rating !== undefined ? (
                                    <RatingDisplay rating={player.rating} size="sm" />
                                  ) : player.totalGames > 0 ? (
                                    <span className="text-gray-500">
                                      {player.gameWinRate.toFixed(0)}% ({player.totalGames} games)
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">No rating</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {/* Team 2 */}
                            <div className="bg-dark-card p-2 rounded-lg border border-gray-700">
                              <p className="text-xs text-gray-400 mb-1">Team 2</p>
                              {balancedTeams.team2.map((player: any) => (
                                <div key={player.id} className="flex items-center justify-between text-xs">
                                  <span className="text-white">{player.name}</span>
                                  {player.rating !== null && player.rating !== undefined ? (
                                    <RatingDisplay rating={player.rating} size="sm" />
                                  ) : player.totalGames > 0 ? (
                                    <span className="text-gray-500">
                                      {player.gameWinRate.toFixed(0)}% ({player.totalGames} games)
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">No rating</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Match Prediction */}
                          {prediction && (
                            <div className="mt-3 pt-3 border-t border-purple-500/30">
                              <p className="text-xs text-gray-400 mb-2 font-semibold">Expected Match Outcome (3 sets):</p>
                              <div className="space-y-1.5">
                                {prediction.expectedSetScores.map((set: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between text-xs bg-dark-card px-2 py-1 rounded">
                                    <span className="text-gray-400">Set {index + 1}:</span>
                                    <span className="text-white">
                                      <span className={set.team1Games > set.team2Games ? 'text-green-400 font-bold' : 'text-gray-300'}>
                                        {set.team1Games}
                                      </span>
                                      {' - '}
                                      <span className={set.team2Games > set.team1Games ? 'text-green-400 font-bold' : 'text-gray-300'}>
                                        {set.team2Games}
                                      </span>
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-gray-400">
                                  Team 1 Win Probability: <span className="text-purple-300 font-semibold">{(prediction.team1ExpectedWinPct * 100).toFixed(1)}%</span>
                                </span>
                                <span className="text-gray-400">
                                  Match Weight: <span className="text-purple-300 font-semibold">{prediction.matchWeight.toFixed(2)}</span>
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-2 italic">
                            Based on UTR ratings{prediction ? ' with match prediction' : ''}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waitlist/Maybe/No RSVPs & Guests Section */}
        {(() => {
          const waitlistRSVPs = rsvps?.filter((r) => r.status === 'yes' && !r.courtId) || [];
          const waitlistGuests = currentSession?.guests?.filter((g: any) => g.status === 'yes' && !g.courtId) || [];
          const maybeRSVPs = rsvps?.filter((r) => r.status === 'maybe') || [];
          const maybeGuests = currentSession?.guests?.filter((g: any) => g.status === 'maybe') || [];
          const noRSVPs = rsvps?.filter((r) => r.status === 'no') || [];
          const noGuests = currentSession?.guests?.filter((g: any) => g.status === 'no') || [];
          const hasWaitlist = waitlistRSVPs.length > 0 || waitlistGuests.length > 0;
          const hasMaybes = maybeRSVPs.length > 0 || maybeGuests.length > 0;
          const hasNos = noRSVPs.length > 0 || noGuests.length > 0;
          
          return (hasWaitlist || hasMaybes || hasNos) && (
            <div className="bg-dark-card rounded-2xl shadow-2xl p-6 border border-gray-800 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Waitlist, Maybe & Can't Make It</h2>
              
              {/* Waitlist */}
              {hasWaitlist && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-orange-400 mb-2">⏳ Waitlist ({waitlistRSVPs.length + waitlistGuests.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Registered Players */}
                    {waitlistRSVPs.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-500/30 group"
                      >
                        <Avatar src={rsvp.user.avatarUrl} name={rsvp.user.name} size="sm" />
                        <span className="text-sm font-medium text-orange-300">{rsvp.user.name}</span>
                        {playerRatings.has(rsvp.user.id) && (
                          <RatingDisplay 
                            rating={playerRatings.get(rsvp.user.id)!} 
                            size="sm" 
                          />
                        )}
                        {user?.isAdmin && (
                          <button
                            onClick={() => handleAdminRemoveUser(rsvp.user.id)}
                            className="ml-auto text-red-500 hover:text-red-400 text-sm sm:text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            title="Remove from waitlist"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Guests */}
                    {waitlistGuests.map((guest: any) => (
                      <div
                        key={guest.id}
                        className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-500/30"
                      >
                        <Avatar src={null} name={guest.name} size="sm" />
                        <span className="text-sm font-medium text-orange-300">{guest.name}</span>
                        <span className="text-xs text-gray-500">(Guest)</span>
                        {(guest.addedBy.id === user?.id || isCreator) && (
                          <button
                            onClick={() => handleRemoveGuest(guest.id)}
                            className="ml-1 text-red-500 hover:text-red-400 text-xs transition-colors"
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
              
              {/* Maybe */}
              {hasMaybes && (
                <div className="mb-4">
                  <p className="text-sm font-semibold text-yellow-400 mb-2">🤔 Maybe ({maybeRSVPs.length + maybeGuests.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Registered Players */}
                    {maybeRSVPs.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-500/30"
                      >
                        <Avatar src={rsvp.user.avatarUrl} name={rsvp.user.name} size="sm" />
                        <span className="text-sm font-medium text-yellow-300">{rsvp.user.name}</span>
                      </div>
                    ))}
                    {/* Guests */}
                    {maybeGuests.map((guest: any) => (
                      <div
                        key={guest.id}
                        className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-500/30"
                      >
                        <Avatar src={null} name={guest.name} size="sm" />
                        <span className="text-sm font-medium text-yellow-300">{guest.name}</span>
                        <span className="text-xs text-gray-500">(Guest)</span>
                        {(guest.addedBy.id === user?.id || isCreator) && (
                          <button
                            onClick={() => handleRemoveGuest(guest.id)}
                            className="ml-1 text-red-500 hover:text-red-400 text-xs transition-colors"
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

              {/* Can't Make It */}
              {hasNos && (
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-2">❌ Can't Make It ({noRSVPs.length + noGuests.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {/* Registered Players */}
                    {noRSVPs.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30"
                      >
                        <Avatar src={rsvp.user.avatarUrl} name={rsvp.user.name} size="sm" />
                        <span className="text-sm font-medium text-red-300">{rsvp.user.name}</span>
                      </div>
                    ))}
                    {/* Guests */}
                    {noGuests.map((guest: any) => (
                      <div
                        key={guest.id}
                        className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/30"
                      >
                        <Avatar src={null} name={guest.name} size="sm" />
                        <span className="text-sm font-medium text-red-300">{guest.name}</span>
                        <span className="text-xs text-gray-500">(Guest)</span>
                        {(guest.addedBy.id === user?.id || isCreator) && (
                          <button
                            onClick={() => handleRemoveGuest(guest.id)}
                            className="ml-1 text-red-500 hover:text-red-400 text-xs transition-colors"
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
            </div>
          );
        })()}

        {/* Match Results Section - Only show after session date */}
        {currentSession && new Date(currentSession.date) < new Date() && courtsInfo && (
          <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🏆</span>
                Match Results
              </h2>
            </div>

            {/* Set Results */}
            {sets.length > 0 ? (
              <div className="space-y-4 mb-6">
                {/* Group sets by court */}
                {courtsInfo.map((court) => {
                  const courtSets = sets.filter((set) => set.courtId === court.id);
                  if (courtSets.length === 0) return null;

                  return (
                    <div key={court.id} className="bg-dark-elevated p-3 sm:p-4 rounded-xl border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm sm:text-base font-semibold text-padel-green">Court {court.courtNumber}</span>
                      </div>
                      
                      {courtSets.map((set) => {
                        const isCreator = set.createdById === user?.id || user?.isAdmin;
                        const sortedScores = [...set.scores].sort((a: any, b: any) => b.gamesWon - a.gamesWon);
                        const maxScore = sortedScores[0]?.gamesWon || 0;
                        
                        return (
                          <div key={set.id} className="mb-3 last:mb-0 p-2 sm:p-3 bg-dark-bg rounded-lg border border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs sm:text-sm font-semibold text-gray-400">Set {set.setNumber}</span>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(set.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                {isCreator && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedSetForEdit({
                                          id: set.id,
                                          courtId: court.id,
                                          courtNumber: court.courtNumber,
                                          setNumber: set.setNumber,
                                          scores: set.scores.map((s: any) => ({
                                            userId: s.userId || s.guestId,
                                            guestId: s.guestId,
                                            name: s.user?.name || s.guest?.name || 'Unknown',
                                            gamesWon: s.gamesWon,
                                          })),
                                        });
                                        setShowEditSetModal(true);
                                      }}
                                      className="text-blue-500 hover:text-blue-600 p-1 text-sm"
                                      title="Edit set"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSet(set.id)}
                                      className="text-red-500 hover:text-red-600 p-1 text-sm"
                                      title="Delete set"
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                              {sortedScores.map((score: any) => {
                                const isWinner = score.gamesWon === maxScore && score.gamesWon >= 6;
                                // Support both users and guests
                                const playerName = score.user?.name || score.guest?.name || 'Unknown';
                                const playerAvatar = score.user?.avatarUrl || null;
                                const playerId = score.userId || score.guestId;
                                return (
                                  <div
                                    key={playerId}
                                    className={`flex items-center justify-between sm:justify-start gap-2 px-2 sm:px-3 py-2 rounded-lg ${
                                      isWinner
                                        ? 'bg-green-500/20 border border-green-500'
                                        : 'bg-gray-800 border border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Avatar src={playerAvatar} name={playerName} size="sm" />
                                      <span className="text-xs sm:text-sm text-white truncate">{playerName}</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold text-padel-green flex-shrink-0">
                                      {score.gamesWon}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 italic mb-6">No set results recorded yet</p>
            )}

            {/* Add Set Buttons for each court (only for courts without sets) */}
            {courtsInfo.filter((court) => !sets.some((set) => set.courtId === court.id)).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 mb-2">Record set results:</p>
                <div className="flex flex-wrap gap-2">
                  {courtsInfo
                    .filter((court) => !sets.some((set) => set.courtId === court.id))
                    .map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          setSelectedCourtForSet({ id: court.id, number: court.courtNumber });
                          setShowAddSetModal(true);
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

        {/* Add User Modal (Admin) */}
        {showAddUserModal && selectedCourtForAddUser && (
          <AddUserModal
            sessionId={sessionId}
            courtId={selectedCourtForAddUser.id}
            courtNumber={selectedCourtForAddUser.number}
            courtIsFull={(() => {
              const court = courtsInfo?.find((c) => c.id === selectedCourtForAddUser.id);
              return (court?.availableSpots ?? 0) === 0;
            })()}
            onSuccess={async () => {
              setShowAddUserModal(false);
              setSelectedCourtForAddUser(null);
              // Refresh RSVPs and session data to show the newly added user
              await fetchRSVPs(sessionId);
              await fetchSessionById(sessionId);
            }}
            onClose={() => {
              setShowAddUserModal(false);
              setSelectedCourtForAddUser(null);
            }}
          />
        )}

        {/* Add Guest Modal */}
        {showAddGuestModal && selectedCourtForGuest && (
          <AddGuestModal
            sessionId={sessionId}
            courtId={selectedCourtForGuest.id}
            courtNumber={selectedCourtForGuest.number}
            courtIsFull={(() => {
              const court = courtsInfo?.find((c) => c.id === selectedCourtForGuest.id);
              return (court?.availableSpots ?? 0) === 0;
            })()}
            onAdd={handleAddGuest}
            onClose={() => {
              setShowAddGuestModal(false);
              setSelectedCourtForGuest(null);
            }}
          />
        )}

        {/* Add Set Modal */}
        {showAddSetModal && selectedCourtForSet && courtsInfo && (
          <AddSetModal
            courtId={selectedCourtForSet.id}
            courtNumber={selectedCourtForSet.number}
            players={(() => {
              // Find the court
              const court = courtsInfo.find((c) => c.id === selectedCourtForSet.id);
              if (!court) return [];
              
              // Get registered players on this court
              const courtPlayers = court.rsvps?.map((rsvp) => ({
                id: rsvp.user.id,
                name: rsvp.user.name,
              })) || [];
              
              // Get guest players on this court (only "yes" status)
              const guestPlayers = court.guests?.filter((g: any) => g.status === 'yes').map((guest: any) => ({
                id: guest.id,
                name: `${guest.name} (Guest)`,
              })) || [];
              
              return [...courtPlayers, ...guestPlayers];
            })()}
            onSuccess={() => {
              setShowAddSetModal(false);
              setSelectedCourtForSet(null);
              fetchSets();
              fetchSessionById(sessionId);
              fetchRSVPs(sessionId);
            }}
            onClose={() => {
              setShowAddSetModal(false);
              setSelectedCourtForSet(null);
            }}
          />
        )}

        {/* Edit Set Modal */}
        {showEditSetModal && selectedSetForEdit && (
          <EditSetModal
            setId={selectedSetForEdit.id}
            courtId={selectedSetForEdit.courtId}
            courtNumber={selectedSetForEdit.courtNumber}
            setNumber={selectedSetForEdit.setNumber}
            currentScores={selectedSetForEdit.scores}
            onSuccess={() => {
              setShowEditSetModal(false);
              setSelectedSetForEdit(null);
              fetchSets();
            }}
            onClose={() => {
              setShowEditSetModal(false);
              setSelectedSetForEdit(null);
            }}
          />
        )}

        {/* Overlap Warning Modal */}
        {showOverlapWarning && overlaps.length > 0 && (
          <OverlapWarningModal
            overlaps={overlaps}
            onProceed={handleOverlapProceed}
            onCancel={handleOverlapCancel}
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
