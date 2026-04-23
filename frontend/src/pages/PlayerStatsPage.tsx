import { useEffect, useState, useMemo } from 'react';
import GroupSwitcher from '../components/GroupSwitcher';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import RatingDisplay from '../components/RatingDisplay';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlayerStats {
  userId: string;
  userName: string;
  userAvatar: string | null;
  setsWon: number;
  setsLost: number;
  totalSets: number;
  totalSetsIncludingIncomplete?: number;
  gamesWon: number;
  gamesLost: number;
  totalGames: number;
  setWinRate: number;
  gameWinRate: number;
  rating?: number | null;
  teammateWinRates?: Array<{
    teammateId: string;
    teammateName: string;
    teammateAvatar: string | null;
    gamesWon: number;
    gamesLost: number;
    totalGames: number;
    winRate: number;
  }>;
}

interface PlayerStatsPageProps {
  onBack: () => void;
}

type LeaderboardSortBy = 'sets' | 'games' | 'rating';

interface MatchHistory {
  id: string;
  date: string;
  sessionId: string;
  venueName: string;
  courtNumber: number;
  setNumber?: number;
  scores?: Array<{
    userId?: string;
    guestId?: string;
    gamesWon: number;
    user?: { id: string; name: string; avatarUrl: string | null };
    guest?: { id: string; name: string };
  }>;
  maxScore?: number;
  playerWon?: boolean;
  sets?: { team1: number; team2: number }[];
  team1Player1?: { id: string; name: string; avatarUrl: string | null };
  team1Player2?: { id: string; name: string; avatarUrl: string | null };
  team2Player1?: { id: string; name: string; avatarUrl: string | null };
  team2Player2?: { id: string; name: string; avatarUrl: string | null };
  team1SetsWon?: number;
  team2SetsWon?: number;
  isTeam1?: boolean;
}

type ViewType = 'stats' | 'leaderboard' | 'history';

interface MatchPlayerRow {
  name: string;
  userId: string | null;
  team: number;
  pointsWon: number;
  contributionPct: number | null;
  onServeWinPct: number | null;
  onReturnWinPct: number | null;
  serverWinPct: number | null;
  gameWinningPoints: number;
  setWinningPoints: number;
  clutchPoints: number;
  pointsBySet: Record<string, number> | null;
}

interface MatchSummary {
  id: string;
  startDate: string;
  winner: number | null;
  playerTeam: number;
  sets: { setNumber: number; team1Games: number; team2Games: number }[];
  players: MatchPlayerRow[];
  team1Points: number | null;
  team2Points: number | null;
  sessionDate?: string;
}

interface MatchPlayerAggStats {
  totalMatches: number;
  matches: MatchSummary[];
  stats: {
    totalPoints: number;
    avgContributionPct: number | null;
    avgServeWinPct: number | null;
    avgReturnWinPct: number | null;
    avgServerWinPct: number | null;
    totalGameWinningPoints: number;
    totalSetWinningPoints: number;
    totalClutchPoints: number;
    totalBreakPointOpportunities: number;
    totalBreakPointsConverted: number;
    avgBreakConversionPct: number | null;
    avgTeamServeWinPct: number | null;
    avgTeamReturnWinPct: number | null;
    maxLongestWinStreak: number | null;
  } | null;
}

export default function PlayerStatsPage({ onBack }: PlayerStatsPageProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayersStats, setAllPlayersStats] = useState<PlayerStats[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('stats');
  const [leaderboardSort, setLeaderboardSort] = useState<LeaderboardSortBy>('sets');
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [ratingHistory, setRatingHistory] = useState<Array<{ createdAt: string; rating: number | null; setId?: string | null }>>([]);
  const [trendFilter, setTrendFilter] = useState<'all' | 'last10Sessions'>('last10Sessions');
  const [matchAggStats, setMatchAggStats] = useState<MatchPlayerAggStats | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [leaderboardRolling, setLeaderboardRolling] = useState<5 | 10 | 20 | null>(10);

  useEffect(() => {
    fetchStats();
    fetchLeaderboard(leaderboardRolling);
    fetchMatchHistory();
    fetchRatingHistory();
    fetchMatchAggStats();
  }, [user?.groupId]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sets/stats/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMatchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sets/history/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort by date (latest first) and then by set number (descending)
      const sortedHistory = [...response.data.sets].sort((a: any, b: any) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) {
          return dateB - dateA; // Latest date first
        }
        // If same date, sort by set number (descending)
        return (b.setNumber || 0) - (a.setNumber || 0);
      });
      setMatchHistory(sortedHistory);
    } catch (error) {
      console.error('Failed to fetch set history:', error);
    }
  };

  const fetchRatingHistory = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/ratings/${user.id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sort by date (oldest first) for trend calculation
      const sortedHistory = [...response.data.history].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });
      setRatingHistory(sortedHistory.map((h: any) => ({
        createdAt: h.createdAt,
        rating: h.rating ? Number(h.rating) : null,
        setId: h.setId,
      })));
    } catch (error) {
      console.error('Failed to fetch rating history:', error);
    }
  };

  const fetchLeaderboard = async (rolling: 5 | 10 | 20 | null = leaderboardRolling) => {
    try {
      const token = localStorage.getItem('token');
      const url = rolling
        ? `${API_URL}/api/sets/leaderboard?rolling=${rolling}`
        : `${API_URL}/api/sets/leaderboard`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllPlayersStats(response.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const fetchMatchAggStats = async (matchId?: string | null) => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const url = matchId
        ? `${API_URL}/api/matches/player-stats/${user.id}?matchId=${matchId}`
        : `${API_URL}/api/matches/player-stats/${user.id}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchAggStats((prev) => ({
        ...response.data,
        // Preserve the full matches list when filtering to a single match
        matches: matchId && prev?.matches ? prev.matches : response.data.matches,
      }));
      // Auto-select the match when there is only one
      if (!matchId && response.data.matches?.length === 1) {
        setSelectedMatchId(response.data.matches[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch match stats:', error);
    }
  };

  const getSortedLeaderboard = () => {
    const sorted = [...allPlayersStats];
    
    switch (leaderboardSort) {
      case 'sets':
        // Sort by set win rate, then by sets won
        return sorted.sort((a, b) => {
          if (b.setWinRate !== a.setWinRate) {
            return b.setWinRate - a.setWinRate;
          }
          return b.setsWon - a.setsWon;
        });
      case 'games':
        // Sort by game win rate, then by games won
        return sorted.sort((a, b) => {
          if (b.gameWinRate !== a.gameWinRate) {
            return b.gameWinRate - a.gameWinRate;
          }
          return b.gamesWon - a.gamesWon;
        });
      case 'rating':
        // Sort by rating, then by total sets
        return sorted.sort((a, b) => {
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          if (ratingB !== ratingA) {
            return ratingB - ratingA;
          }
          return b.totalSets - a.totalSets;
        });
      default:
        return sorted;
    }
  };

  // Process match history to create trend data grouped by session
  const trendData = useMemo(() => {
    if (!matchHistory || matchHistory.length === 0 || !user?.id || !stats) return [];

    try {
      // Sort by date (oldest first) first to group sessions properly
      const sortedHistory = [...matchHistory].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });

      // Group sets by sessionId
      const sessionsMap = new Map<string, typeof sortedHistory>();
      sortedHistory.forEach((set) => {
        if (!set.sessionId) return;
        if (!sessionsMap.has(set.sessionId)) {
          sessionsMap.set(set.sessionId, []);
        }
        sessionsMap.get(set.sessionId)!.push(set);
      });

      // Convert to array and sort sessions by date
      let sessions = Array.from(sessionsMap.entries()).sort((a, b) => {
        const dateA = a[1][0]?.date ? new Date(a[1][0].date).getTime() : 0;
        const dateB = b[1][0]?.date ? new Date(b[1][0].date).getTime() : 0;
        return dateA - dateB;
      });

      // Filter to last 5 sessions if needed (before calculating baseline)
      if (trendFilter === 'last10Sessions') {
        sessions = sessions.slice(-10);
      }

      if (sessions.length === 0) return [];

      // Calculate total games from sessions that WILL be shown in the graph
      let totalWonFromShownSessions = 0;
      let totalLostFromShownSessions = 0;
      sessions.forEach(([, sets]) => {
        sets.forEach((set) => {
          if (!set.scores || !Array.isArray(set.scores) || set.scores.length === 0) {
            return;
          }
          const playerScore = set.scores.find((s: any) => s.userId === user.id);
          if (playerScore && typeof playerScore.gamesWon === 'number') {
            totalWonFromShownSessions += playerScore.gamesWon;
            
            // Group players by score to identify teams
            const scoreGroups = new Map<number, Array<{ userId?: string; guestId?: string }>>();
            set.scores.forEach((s: any) => {
              const score = s.gamesWon;
              if (!scoreGroups.has(score)) {
                scoreGroups.set(score, []);
              }
              scoreGroups.get(score)!.push({ userId: s.userId, guestId: s.guestId });
            });
            
            const playerTeamScore = playerScore.gamesWon;
            let maxOpponentScore = 0;
            scoreGroups.forEach((_, score) => {
              if (score !== playerTeamScore) {
                maxOpponentScore = Math.max(maxOpponentScore, score);
              }
            });
            if (maxOpponentScore > 0) {
              totalLostFromShownSessions += maxOpponentScore;
            }
          }
        });
      });

      // Calculate starting baseline: total stats minus what will be shown
      // This ensures the final cumulative value matches the total stats
      const baselineWon = (stats.gamesWon || 0) - totalWonFromShownSessions;
      const baselineLost = (stats.gamesLost || 0) - totalLostFromShownSessions;

      // Start cumulative values from baseline (to account for sessions not shown)
      let cumulativeWon = baselineWon;
      let cumulativeLost = baselineLost;
      const data: Array<{ 
        session: string; 
        gamesWon: number; 
        gamesLost: number; 
        netChange: number; // gamesWon - gamesLost for this session
        cumulativeNet: number; // cumulative net difference
        startValue: number; // starting cumulative net value
        sessionNumber: number;
        rating: number | null; // DSS rating at this point
      }> = [];

      sessions.forEach(([, sets], sessionIndex) => {
        let sessionWon = 0;
        let sessionLost = 0;

        sets.forEach((set) => {
          if (!set.scores || !Array.isArray(set.scores) || set.scores.length === 0) {
            return;
          }

          // Find the player's score in this set
          // Note: user.id is always a registered user ID, not a guest ID
          const playerScore = set.scores.find((s: any) => s.userId === user.id);

          if (playerScore && typeof playerScore.gamesWon === 'number') {
            sessionWon += playerScore.gamesWon;
            
            // Group players by score to identify teams (teammates have the same score)
            const scoreGroups = new Map<number, Array<{ userId?: string; guestId?: string }>>();
            set.scores.forEach((s: any) => {
              const score = s.gamesWon;
              if (!scoreGroups.has(score)) {
                scoreGroups.set(score, []);
              }
              scoreGroups.get(score)!.push({ userId: s.userId, guestId: s.guestId });
            });

            // Find which team the current player belongs to (by score)
            const playerTeamScore = playerScore.gamesWon;
            
            // Find opponent team (the team with a different score)
            let maxOpponentScore = 0;
            scoreGroups.forEach((_, score) => {
              if (score !== playerTeamScore) {
                // This is the opponent team, take their max score
                maxOpponentScore = Math.max(maxOpponentScore, score);
              }
            });
            
            if (maxOpponentScore > 0) {
              sessionLost += maxOpponentScore;
            }
          }
        });

        // Only add session if player participated
        if (sessionWon > 0 || sessionLost > 0) {
          const netChange = sessionWon - sessionLost;
          const startValue = cumulativeWon - cumulativeLost;
          
          cumulativeWon += sessionWon;
          cumulativeLost += sessionLost;
          const cumulativeNet = cumulativeWon - cumulativeLost;

          // Format session label with date
          const firstSet = sets[0];
          let sessionLabel = `Session ${sessionIndex + 1}`;
          
          // Add date to label
          let dateStr = '';
          if (firstSet?.date) {
            try {
              const date = new Date(firstSet.date);
              if (!isNaN(date.getTime())) {
                dateStr = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }
            } catch (e) {
              // Ignore date parsing errors
            }
          }
          
          if (firstSet?.venueName) {
            // Shorten venue name if too long
            const venueShort = firstSet.venueName.length > 12 
              ? firstSet.venueName.substring(0, 12) + '...' 
              : firstSet.venueName;
            sessionLabel = dateStr ? `${venueShort} (${dateStr})` : venueShort;
          } else if (dateStr) {
            sessionLabel = `${sessionLabel} (${dateStr})`;
          }

          // Find rating at the end of this session
          // Match ratings to sets within this session, or use the most recent rating before this session
          let sessionRating: number | null = null;
          
          if (ratingHistory.length > 0) {
            // First, try to find ratings that correspond to sets in this session
            const setIdsInSession = new Set(sets.map((s: any) => s.id));
            let latestRatingInSession: number | null = null;
            let latestRatingDate = 0;
            
            // Look for ratings that match sets in this session (iterate in reverse to get latest)
            for (let i = ratingHistory.length - 1; i >= 0; i--) {
              const ratingEntry = ratingHistory[i];
              if (ratingEntry.setId && setIdsInSession.has(ratingEntry.setId)) {
                const ratingDate = new Date(ratingEntry.createdAt).getTime();
                if (ratingDate > latestRatingDate) {
                  latestRatingDate = ratingDate;
                  latestRatingInSession = ratingEntry.rating;
                }
              }
            }
            
            if (latestRatingInSession !== null) {
              sessionRating = latestRatingInSession;
            } else if (firstSet?.date) {
              // If no rating found for sets in this session, use the most recent rating before or at this session date
              const sessionDate = new Date(firstSet.date).getTime();
              // Find the latest rating entry before or at this session date
              for (let i = ratingHistory.length - 1; i >= 0; i--) {
                const ratingDate = new Date(ratingHistory[i].createdAt).getTime();
                if (ratingDate <= sessionDate) {
                  sessionRating = ratingHistory[i].rating;
                  break;
                }
              }
              // If no rating found before this session, use the first available rating (oldest)
              if (sessionRating === null && ratingHistory.length > 0) {
                sessionRating = ratingHistory[0].rating;
              }
            } else {
              // No date available, use the most recent rating
              sessionRating = ratingHistory[ratingHistory.length - 1].rating;
            }
          }

          data.push({
            session: sessionLabel,
            gamesWon: sessionWon,
            gamesLost: sessionLost,
            netChange,
            cumulativeNet,
            startValue,
            sessionNumber: sessionIndex + 1,
            rating: sessionRating,
          });
        }
      });

      return data;
    } catch (error) {
      console.error('Error processing trend data:', error);
      return [];
    }
  }, [matchHistory, user?.id, trendFilter, ratingHistory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner text="Loading stats..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all text-sm sm:text-base"
          >
            ← Back to Dashboard
          </button>
          <GroupSwitcher
            onGroupSwitched={() => {}}
            onCreateOrJoin={() => {}}
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 mb-4 sm:mb-6 border border-gray-800">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCurrentView('stats')}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                currentView === 'stats'
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              📊 My Stats
            </button>
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                currentView === 'leaderboard'
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => setCurrentView('history')}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                currentView === 'history'
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              📜 History
            </button>
          </div>
        </div>

        {currentView === 'stats' ? (
          // My Stats View
          <div className="space-y-4 sm:space-y-6">
            {/* Player Info Card */}
            <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-800">
              <div className="flex items-center gap-4 mb-6">
                <Avatar src={user?.avatarUrl} name={user?.name || ''} size="xl" />
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-gray-400">Player Statistics</p>
                    {stats && stats.rating !== null && stats.rating !== undefined && (
                      <RatingDisplay rating={stats.rating} size="md" showLabel />
                    )}
                  </div>
                </div>
              </div>

              {stats && stats.totalSets > 0 ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm mb-1">Total Sets</p>
                      <p className="text-3xl font-bold text-white">{stats.totalSets}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-green-500/30">
                      <p className="text-gray-400 text-sm mb-1">Sets Won</p>
                      <p className="text-3xl font-bold text-green-400">{stats.setsWon}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-red-500/30">
                      <p className="text-gray-400 text-sm mb-1">Sets Lost</p>
                      <p className="text-3xl font-bold text-red-400">{stats.setsLost}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm mb-1">Total Games</p>
                      <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-green-500/30">
                      <p className="text-gray-400 text-sm mb-1">Games Won</p>
                      <p className="text-3xl font-bold text-green-400">{stats.gamesWon}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-red-500/30">
                      <p className="text-gray-400 text-sm mb-1">Games Lost</p>
                      <p className="text-3xl font-bold text-red-400">{stats.gamesLost}</p>
                    </div>
                  </div>

                  {/* Win Rate Progress Bar */}
                  <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 font-medium">Game Win Performance</span>
                      <span className="text-padel-green font-bold">{stats.gameWinRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden relative">
                      {/* Full-width gradient background (0-100%) */}
                      <div
                        className="absolute inset-0 rounded-full transition-all duration-500"
                        style={{
                          background: `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(34, 197, 94) 100%)`,
                          clipPath: `inset(0 ${100 - stats.gameWinRate}% 0 0)`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Watch Match Stats */}
                  {matchAggStats && matchAggStats.totalMatches > 0 && (() => {
                    const s = matchAggStats.stats;
                    const pct = (v: number | null) => v != null ? `${(v * 100).toFixed(1)}%` : '—';
                    const formatDate = (iso: string) => {
                      const d = new Date(iso);
                      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    };
                    const Info = ({ text }: { text: string }) => (
                      <span className="relative inline-block group">
                        <span className="text-gray-600 hover:text-gray-400 cursor-help text-xs ml-1 select-none">ⓘ</span>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 border border-gray-600 text-gray-300 text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-20 text-left shadow-lg">
                          {text}
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-600" />
                        </span>
                      </span>
                    );
                    // Derive the winning team (1 or 2) from available match data when match.winner is null
                    const deriveWinner = (m: MatchSummary): number | null => {
                      if (m.winner !== null) return m.winner;
                      // 1. Set count
                      const t1s = m.sets.filter((s) => s.team1Games > s.team2Games).length;
                      const t2s = m.sets.filter((s) => s.team2Games > s.team1Games).length;
                      if (t1s > t2s) return 1;
                      if (t2s > t1s) return 2;
                      // 2. Total games
                      const t1g = m.sets.reduce((a, s) => a + s.team1Games, 0);
                      const t2g = m.sets.reduce((a, s) => a + s.team2Games, 0);
                      if (t1g > t2g) return 1;
                      if (t2g > t1g) return 2;
                      // 3. Points from MatchTeamStats (reliable even when set scores are corrupted)
                      if (m.team1Points != null && m.team2Points != null && m.team1Points !== m.team2Points) {
                        return m.team1Points > m.team2Points ? 1 : 2;
                      }
                      return null;
                    };
                    return (
                      <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                          <span>⌚</span>
                          In-game Stats
                        </h3>

                        {/* Match filter dropdown */}
                        {matchAggStats.matches && matchAggStats.matches.length >= 1 && (
                          <div className="mt-2 mb-3">
                            <select
                              value={selectedMatchId ?? ''}
                              onChange={(e) => {
                                const val = e.target.value || null;
                                setSelectedMatchId(val);
                                fetchMatchAggStats(val);
                              }}
                              className="w-full bg-dark-card border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-padel-green"
                            >
                              <option value="">All matches ({matchAggStats.totalMatches})</option>
                              {(() => {
                                // Count how many matches share the same display date so we can add rotation numbers
                                const dateCounts = new Map<string, number>();
                                const dateIndex = new Map<string, number>();
                                matchAggStats.matches.forEach((m) => {
                                  const d = formatDate(m.sessionDate ?? m.startDate);
                                  dateCounts.set(d, (dateCounts.get(d) ?? 0) + 1);
                                });
                                return matchAggStats.matches.map((m) => {
                                  const dateKey = formatDate(m.sessionDate ?? m.startDate);
                                  const isMultiple = (dateCounts.get(dateKey) ?? 1) > 1;
                                  const rotationIdx = isMultiple ? (dateIndex.get(dateKey) ?? 0) + 1 : null;
                                  if (isMultiple) dateIndex.set(dateKey, rotationIdx!);

                                  const derivedWinner = deriveWinner(m);
                                  const winLabel = derivedWinner !== null
                                    ? (derivedWinner === m.playerTeam ? ' — Win' : ' — Loss')
                                    : '';
                                  const rotationLabel = rotationIdx !== null ? ` (${rotationIdx})` : '';

                                  return (
                                    <option key={m.id} value={m.id}>
                                      {dateKey}{rotationLabel}{winLabel}
                                    </option>
                                  );
                                });
                              })()}
                            </select>
                          </div>
                        )}

                        {/* Match detail card for selected match */}
                        {selectedMatchId && (() => {
                          const sel = matchAggStats.matches?.find((m) => m.id === selectedMatchId);
                          if (!sel?.sets?.length) return null;
                          const selWinner = deriveWinner(sel);
                          const isWin = selWinner !== null && selWinner === sel.playerTeam;
                          const initials = (name: string) => {
                            const parts = name.trim().split(/\s+/);
                            if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                            return name.trim().slice(0, 2).toUpperCase();
                          };
                          // Order: your team first, opponents second
                          const myTeamPlayers = (sel.players ?? []).filter(p => p.team === sel.playerTeam);
                          const oppPlayers = (sel.players ?? []).filter(p => p.team !== sel.playerTeam);
                          const orderedPlayers = [...myTeamPlayers, ...oppPlayers];
                          const team1Games = sel.sets.reduce((acc, s) => acc + s.team1Games, 0);
                          const team2Games = sel.sets.reduce((acc, s) => acc + s.team2Games, 0);
                          const team1Sets = sel.sets.filter((s) => s.team1Games > s.team2Games).length;
                          const team2Sets = sel.sets.filter((s) => s.team2Games > s.team1Games).length;
                          return (
                            <div className="mb-4 bg-dark-card rounded-lg border border-gray-700 p-3">
                              {/* Result + Score row */}
                              <div className="flex items-center gap-3 mb-3">
                                <span className={`text-xs font-bold px-2 py-1 rounded-md flex-shrink-0 ${isWin ? 'bg-green-900/50 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                  {isWin ? 'WIN' : 'LOSS'}
                                </span>
                                <div className="flex items-center gap-2">
                                  {sel.sets.map((set, i) => {
                                    const myGames = sel.playerTeam === 1 ? set.team1Games : set.team2Games;
                                    const oppGames = sel.playerTeam === 1 ? set.team2Games : set.team1Games;
                                    const wonSet = myGames > oppGames;
                                    return (
                                      <span key={i} className={`text-sm font-semibold ${wonSet ? 'text-white' : 'text-gray-500'}`}>
                                        {myGames}–{oppGames}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              {/* Quick stats row */}
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="bg-dark-elevated rounded-md p-2 text-center">
                                  <p className="text-xs text-gray-500 mb-0.5">Points</p>
                                  <p className="text-sm font-bold text-white">
                                    {sel.team1Points ?? '—'}<span className="text-gray-600 mx-1">–</span>{sel.team2Points ?? '—'}
                                  </p>
                                </div>
                                <div className="bg-dark-elevated rounded-md p-2 text-center">
                                  <p className="text-xs text-gray-500 mb-0.5">Games</p>
                                  <p className="text-sm font-bold text-white">{team1Games}<span className="text-gray-600 mx-1">–</span>{team2Games}</p>
                                </div>
                                <div className="bg-dark-elevated rounded-md p-2 text-center">
                                  <p className="text-xs text-gray-500 mb-0.5">Sets</p>
                                  <p className="text-sm font-bold text-white">{team1Sets}<span className="text-gray-600 mx-1">–</span>{team2Sets}</p>
                                </div>
                              </div>
                              {/* Player stats table */}
                              {orderedPlayers.length > 0 && (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr>
                                        <th className="text-left text-gray-500 font-normal pb-2 pr-2 w-24">Stat</th>
                                        {orderedPlayers.map((p, i) => (
                                          <th key={i} className={`text-center pb-2 px-1 font-bold ${p.team === sel.playerTeam ? 'text-padel-green' : 'text-gray-400'}`}>
                                            {initials(p.name)}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                      {[
                                        { label: 'Points won', fn: (p: MatchPlayerRow) => p.pointsWon },
                                        { label: 'Contribution %', fn: (p: MatchPlayerRow) => p.contributionPct != null ? `${(p.contributionPct * 100).toFixed(0)}%` : '—' },
                                        { label: 'On-serve win %', fn: (p: MatchPlayerRow) => p.onServeWinPct != null ? `${(p.onServeWinPct * 100).toFixed(0)}%` : '—' },
                                        { label: 'On-return win %', fn: (p: MatchPlayerRow) => p.onReturnWinPct != null ? `${(p.onReturnWinPct * 100).toFixed(0)}%` : '—' },
                                        { label: 'Server win %', fn: (p: MatchPlayerRow) => p.serverWinPct != null ? `${(p.serverWinPct * 100).toFixed(0)}%` : '—' },
                                        { label: 'Game winners', fn: (p: MatchPlayerRow) => p.gameWinningPoints },
                                        { label: 'Set winners', fn: (p: MatchPlayerRow) => p.setWinningPoints },
                                        { label: 'Clutch points', fn: (p: MatchPlayerRow) => p.clutchPoints },
                                        ...sel.sets.map((set) => ({
                                          label: `Set ${set.setNumber} pts`,
                                          fn: (p: MatchPlayerRow) => p.pointsBySet?.[String(set.setNumber)] ?? '—',
                                        })),
                                      ].map((row, ri) => (
                                        <tr key={ri}>
                                          <td className="text-gray-500 py-1.5 pr-2 whitespace-nowrap">{row.label}</td>
                                          {orderedPlayers.map((p, pi) => (
                                            <td key={pi} className={`text-center py-1.5 px-1 font-medium ${p.team === sel.playerTeam ? 'text-white' : 'text-gray-400'}`}>
                                              {String(row.fn(p))}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {s && (<>
                        {/* Serve vs Return */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-dark-card p-4 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Serve Win %<Info text="% of points your team wins when your team is serving. A high score means you dominate your own service games." />
                            </p>
                            <p className="text-2xl font-bold text-padel-green">{pct(s.avgTeamServeWinPct)}</p>
                            <p className="text-xs text-gray-500 mt-1">when your team serves</p>
                          </div>
                          <div className="bg-dark-card p-4 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Return Win %<Info text="% of points your team wins when the opponents are serving. A high score means you break serve often." />
                            </p>
                            <p className="text-2xl font-bold text-blue-400">{pct(s.avgTeamReturnWinPct)}</p>
                            <p className="text-xs text-gray-500 mt-1">when your team returns</p>
                          </div>
                        </div>

                        {/* Personal contribution + server win */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-dark-card p-4 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Avg Contribution<Info text="Your share of your team's total points won. 50% is perfectly equal with your partner. Above 50% means you won more points than them." />
                            </p>
                            <p className="text-2xl font-bold text-white">{pct(s.avgContributionPct)}</p>
                            <p className="text-xs text-gray-500 mt-1">of team's points</p>
                          </div>
                          <div className="bg-dark-card p-4 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              On Serve Win %<Info text="% of points you personally win when you are the server. Measures your individual serving effectiveness." />
                            </p>
                            <p className="text-2xl font-bold text-yellow-400">{pct(s.avgServerWinPct)}</p>
                            <p className="text-xs text-gray-500 mt-1">when you're serving</p>
                          </div>
                        </div>

                        {/* Clutch & key points */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-dark-card p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Clutch Pts<Info text="Points you won in high-pressure situations: deuce, advantage, or game point moments." />
                            </p>
                            <p className="text-xl font-bold text-purple-400">{s.totalClutchPoints}</p>
                          </div>
                          <div className="bg-dark-card p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Win Streak<Info text="The longest consecutive points won by your team in a single match." />
                            </p>
                            <p className="text-xl font-bold text-orange-400">{s.maxLongestWinStreak ?? '—'}</p>
                          </div>
                          <div className="bg-dark-card p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Game Winners<Info text="The number of times you hit the point that directly won a game." />
                            </p>
                            <p className="text-xl font-bold text-white">{s.totalGameWinningPoints}</p>
                          </div>
                          <div className="bg-dark-card p-3 rounded-lg border border-gray-700 text-center">
                            <p className="text-xs text-gray-400 mb-1 flex items-center justify-center">
                              Set Winners<Info text="The number of times you hit the point that directly won a set." />
                            </p>
                            <p className="text-xl font-bold text-white">{s.totalSetWinningPoints}</p>
                          </div>
                        </div>

                        {/* Break points */}
                        {s.totalBreakPointOpportunities > 0 && (
                          <div className="bg-dark-card p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-400 flex items-center">
                                Break Point Conversion<Info text="How often your team converted a break point opportunity into an actual break. Calculated as breaks won ÷ total break point opportunities." />
                              </span>
                              <span className="text-sm font-bold text-white">
                                {s.totalBreakPointsConverted}/{s.totalBreakPointOpportunities}
                                {s.avgBreakConversionPct != null && (
                                  <span className="text-padel-green ml-1">({pct(s.avgBreakConversionPct)})</span>
                                )}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-padel-green to-emerald-500 transition-all duration-500"
                                style={{ width: `${s.avgBreakConversionPct != null ? s.avgBreakConversionPct * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                        </>)}
                      </div>
                    );
                  })()}

                  {/* Win Rate Per Teammate */}
                  {stats.teammateWinRates && stats.teammateWinRates.length > 0 && (
                    <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700 mb-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>🤝</span>
                        Compatibility Score
                      </h3>
                      <div className="space-y-3">
                        {stats.teammateWinRates.map((teammate) => (
                          <div
                            key={teammate.teammateId}
                            className="bg-dark-card p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Avatar
                                  src={teammate.teammateAvatar}
                                  name={teammate.teammateName}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold truncate">{teammate.teammateName}</p>
                                  <p className="text-xs text-gray-400">
                                    {teammate.totalGames} {teammate.totalGames === 1 ? 'game' : 'games'} · {teammate.gamesWon}W-{teammate.gamesLost}L
                                  </p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-lg font-bold text-padel-green">{teammate.winRate.toFixed(1)}%</p>
                              </div>
                            </div>
                            {/* Win Rate Progress Bar */}
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mt-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  teammate.winRate >= 50
                                    ? 'bg-gradient-to-r from-padel-green to-emerald-500'
                                    : 'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${teammate.winRate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Games Won vs Lost Trend Graph */}
                  {trendData.length > 0 && (
                    <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Event Trend</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTrendFilter('last10Sessions')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              trendFilter === 'last10Sessions'
                                ? 'bg-padel-green text-white'
                                : 'bg-dark-card text-gray-400 hover:text-white border border-gray-700'
                            }`}
                          >
                            Last 10 Events
                          </button>
                          <button
                            onClick={() => setTrendFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              trendFilter === 'all'
                                ? 'bg-padel-green text-white'
                                : 'bg-dark-card text-gray-400 hover:text-white border border-gray-700'
                            }`}
                          >
                            All Events
                          </button>
                        </div>
                      </div>
                      <div className="w-full" style={{ height: '300px', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="session" 
                              stroke="#9CA3AF"
                              style={{ fontSize: '12px' }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              yAxisId="left"
                              stroke="#9CA3AF" 
                              style={{ fontSize: '12px' }} 
                              label={{ value: 'Net Games', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                            />
                            <YAxis 
                              yAxisId="right"
                              orientation="right"
                              stroke="#A855F7" 
                              style={{ fontSize: '12px' }} 
                              label={{ value: 'DSS Rating', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#A855F7' } }}
                            />
                            <ReferenceLine yAxisId="left" y={0} stroke="#6B7280" strokeDasharray="3 3" strokeWidth={1} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#F3F4F6',
                              }}
                              labelStyle={{ color: '#9CA3AF' }}
                              formatter={(value: number, name: string) => {
                                if (name === 'cumulativeNet') {
                                  const sign = value >= 0 ? '+' : '';
                                  return [`${sign}${value}`, 'Cumulative Net'];
                                } else if (name === 'netChange') {
                                  const sign = value >= 0 ? '+' : '';
                                  return [`${sign}${value}`, 'Net Change (this session)'];
                                } else if (name === 'rating') {
                                  return value !== null ? [value.toFixed(2), 'DSS Rating'] : ['N/A', 'DSS Rating'];
                                }
                                return [value, name];
                              }}
                            />
                            {/* Baseline bar (dotted line, shows starting position) */}
                            <Bar 
                              yAxisId="left"
                              dataKey="startValue" 
                              stackId="net"
                              fill="transparent"
                              stroke="#6B7280"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                              name="Baseline"
                            />
                            {/* Net change bars (incremental per session, positioned cumulatively) */}
                            <Bar 
                              yAxisId="left"
                              dataKey="netChange" 
                              stackId="net"
                              fill="#10B981"
                              name="Net Change"
                            >
                              {trendData.map((entry, index) => {
                                const color = entry.netChange >= 0 ? '#10B981' : '#EF4444';
                                return <Cell key={`net-cell-${index}`} fill={color} />;
                              })}
                            </Bar>
                            {/* Dotted line connecting cumulative points */}
                            <Line 
                              yAxisId="left"
                              type="monotone"
                              dataKey="cumulativeNet"
                              stroke="#6B7280"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              dot={false}
                              activeDot={false}
                              name="Cumulative Trend"
                            />
                            {/* DSS Rating trend line */}
                            <Line 
                              yAxisId="right"
                              type="monotone"
                              dataKey="rating"
                              stroke="#A855F7"
                              strokeWidth={2}
                              dot={{ fill: '#A855F7', r: 4 }}
                              activeDot={{ r: 6 }}
                              name="DSS Rating"
                              connectNulls={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-6xl mb-4">🎾</p>
                  <p className="text-xl font-semibold mb-2 text-white">No matches played yet!</p>
                  <p className="text-sm">Play some matches to see your statistics</p>
                </div>
              )}
            </div>
          </div>
        ) : currentView === 'leaderboard' ? (
          // Leaderboard View
          <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-2">
              <span>🏆</span>
              Leaderboard
            </h2>

            {/* Rolling window filter */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Matches:</p>
              <div className="flex gap-2">
                {([5, 10, 20, null] as const).map((r) => (
                  <button
                    key={r ?? 'all'}
                    onClick={() => {
                      setLeaderboardRolling(r);
                      fetchLeaderboard(r);
                    }}
                    className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
                      leaderboardRolling === r
                        ? 'bg-padel-green text-white'
                        : 'bg-dark-elevated text-gray-400 hover:text-white'
                    }`}
                  >
                    {r === null ? 'All' : `Last ${r}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Sort by:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLeaderboardSort('rating')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    leaderboardSort === 'rating'
                      ? 'bg-padel-green text-white'
                      : 'bg-dark-elevated text-gray-400 hover:text-white'
                  }`}
                >
                  ⭐ Rating
                </button>
                <button
                  onClick={() => setLeaderboardSort('sets')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    leaderboardSort === 'sets'
                      ? 'bg-padel-green text-white'
                      : 'bg-dark-elevated text-gray-400 hover:text-white'
                  }`}
                >
                  🎾 Sets
                </button>
                <button
                  onClick={() => setLeaderboardSort('games')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    leaderboardSort === 'games'
                      ? 'bg-padel-green text-white'
                      : 'bg-dark-elevated text-gray-400 hover:text-white'
                  }`}
                >
                  🎯 Games
                </button>
              </div>
            </div>

            {allPlayersStats.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {getSortedLeaderboard().map((player, index) => {
                  const isCurrentUser = player.userId === user?.id;
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                  
                  return (
                    <div
                      key={player.userId}
                      className={`flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg sm:rounded-xl transition-all ${
                        isCurrentUser
                          ? 'bg-padel-green/20 border-2 border-padel-green'
                          : 'bg-dark-elevated border border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 sm:w-12 text-center flex-shrink-0">
                        {medal ? (
                          <span className="text-xl sm:text-3xl">{medal}</span>
                        ) : (
                          <span className="text-sm sm:text-xl font-bold text-gray-400">#{index + 1}</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Avatar src={player.userAvatar} name={player.userName} size="sm" className="sm:w-10 sm:h-10" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm sm:text-base font-semibold truncate ${isCurrentUser ? 'text-padel-green' : 'text-white'}`}>
                            {player.userName}
                            {isCurrentUser && <span className="ml-1 text-xs">(You)</span>}
                          </p>
                          {/* Mobile: 2 lines - show stats based on sort */}
                          <div className="sm:hidden text-xs text-gray-400">
                            <p>
                              {player.totalSets} {player.totalSets === 1 ? 'set' : 'sets'}
                              {player.totalSetsIncludingIncomplete && player.totalSetsIncludingIncomplete > player.totalSets && (
                                <span className="text-gray-500"> ({player.totalSetsIncludingIncomplete} total)</span>
                              )}
                            </p>
                            {leaderboardSort === 'rating' && player.rating !== null && player.rating !== undefined && (
                              <div><RatingDisplay rating={player.rating} size="sm" /></div>
                            )}
                            {leaderboardSort === 'sets' && <p>{player.setsWon}W - {player.setsLost}L</p>}
                            {leaderboardSort === 'games' && <p>{player.gamesWon}W - {player.gamesLost}L</p>}
                          </div>
                          {/* Desktop: 1 line - show stats based on sort */}
                          <p className="hidden sm:block text-sm text-gray-400">
                            {player.totalSets} sets
                            {player.totalSetsIncludingIncomplete && player.totalSetsIncludingIncomplete > player.totalSets && (
                              <span className="text-gray-500"> ({player.totalSetsIncludingIncomplete} total)</span>
                            )}
                            {' ·'}
                            {leaderboardSort === 'rating' && player.rating !== null && player.rating !== undefined && (
                              <span className="ml-1"><RatingDisplay rating={player.rating} size="sm" /></span>
                            )}
                            {leaderboardSort === 'sets' && ` ${player.setsWon}W-${player.setsLost}L`}
                            {leaderboardSort === 'games' && ` ${player.gamesWon}W-${player.gamesLost}L`}
                          </p>
                        </div>
                      </div>

                      {/* Stats - Desktop only */}
                      <div className="hidden sm:flex items-center gap-6">
                        {leaderboardSort === 'sets' && (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Sets Won</p>
                              <p className="text-lg font-bold text-green-400">{player.setsWon}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Sets Lost</p>
                              <p className="text-lg font-bold text-red-400">{player.setsLost}</p>
                            </div>
                          </>
                        )}
                        {leaderboardSort === 'games' && (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Games Won</p>
                              <p className="text-lg font-bold text-green-400">{player.gamesWon}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Games Lost</p>
                              <p className="text-lg font-bold text-red-400">{player.gamesLost}</p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Win Rate / Rating */}
                      <div className="text-right flex-shrink-0">
                        {leaderboardSort === 'rating' ? (
                          <>
                            <p className="text-xs text-gray-400 mb-0.5 sm:mb-1 hidden sm:block">DSS Rating</p>
                            <div className="text-base sm:text-xl">
                              <RatingDisplay rating={player.rating ?? null} size="lg" />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-gray-400 mb-0.5 sm:mb-1 hidden sm:block">Win Rate</p>
                            <p className="text-base sm:text-xl font-bold text-padel-green">
                              {leaderboardSort === 'sets' && player.setWinRate.toFixed(1)}
                              {leaderboardSort === 'games' && player.gameWinRate.toFixed(1)}%
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-6xl mb-4">🏆</p>
                <p className="text-xl font-semibold mb-2 text-white">No data yet!</p>
                <p className="text-sm">Play some matches to see the leaderboard</p>
              </div>
            )}
          </div>
        ) : (
          // Set History View
          <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📜</span>
              Set History
            </h2>

            {matchHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Group sets by date */}
                {Object.entries(
                  matchHistory.reduce((groups: any, set: any) => {
                    const dateKey = new Date(set.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    if (!groups[dateKey]) {
                      groups[dateKey] = {
                        dateValue: new Date(set.date).getTime(),
                        sets: []
                      };
                    }
                    groups[dateKey].sets.push(set);
                    return groups;
                  }, {})
                )
                .sort(([, a]: [string, any], [, b]: [string, any]) => {
                  // Sort by date (latest first - descending)
                  return b.dateValue - a.dateValue;
                })
                .map(([date, group]: [string, any]) => {
                  // Sort sets within each date group by set number (descending - latest set first)
                  const sortedSets = [...group.sets].sort((a: any, b: any) => {
                    // First sort by set number (descending)
                    if (b.setNumber !== a.setNumber) {
                      return b.setNumber - a.setNumber;
                    }
                    // If same set number, sort by creation time (descending)
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                  });
                  
                  return { date, sets: sortedSets };
                })
                .map(({ date, sets }: { date: string; sets: any[] }) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="sticky top-0 bg-dark-elevated/90 backdrop-blur-sm border-l-4 border-padel-green px-4 py-2 mb-3 rounded-r-lg">
                      <p className="text-sm font-bold text-padel-green flex items-center gap-2">
                        <span>📅</span>
                        {date}
                        <span className="text-xs text-gray-400 font-normal">({sets.length} {sets.length === 1 ? 'set' : 'sets'})</span>
                      </p>
                    </div>

                    {/* Sets for this date */}
                    <div className="space-y-3 ml-4">
                      {sets.map((set: any) => (
                        <div
                          key={set.id}
                          className={`p-4 rounded-lg border-2 ${
                            set.playerWon
                              ? 'bg-green-900/20 border-green-600/50'
                              : 'bg-gray-800/50 border-gray-700'
                          }`}
                        >
                          {/* Venue Info */}
                          <div className="flex justify-between items-start mb-3 text-sm">
                            <div>
                              <p className="text-gray-500 text-xs">{set.venueName} - Court {set.courtNumber} - Set {set.setNumber}</p>
                            </div>
                            <div className={`text-lg font-bold ${set.playerWon ? 'text-green-500' : 'text-gray-400'}`}>
                              {set.playerWon ? 'W' : ''}
                            </div>
                          </div>

                          {/* Players & Scores */}
                          <div className="flex flex-wrap gap-2">
                            {set.scores.map((score: any) => {
                              const isMaxScore = score.gamesWon === set.maxScore;
                              // Support both users and guests
                              const playerName = score.user?.name || score.guest?.name || 'Unknown';
                              const playerAvatar = score.user?.avatarUrl || null;
                              const playerId = score.userId || score.guestId;
                              return (
                                <div
                                  key={playerId}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                    isMaxScore && score.gamesWon >= 6
                                      ? 'bg-green-500/20 border border-green-500'
                                      : 'bg-gray-800 border border-gray-700'
                                  }`}
                                >
                                  <Avatar
                                    src={playerAvatar}
                                    name={playerName}
                                    size="sm"
                                  />
                                  <span className="text-xs sm:text-sm text-white">{playerName}</span>
                                  <span className="text-sm font-bold text-padel-green ml-1">
                                    {score.gamesWon}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-6xl mb-4">🎾</p>
                <p className="text-xl font-semibold mb-2 text-white">No sets played yet!</p>
                <p className="text-sm">Play some sets to see your history</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
