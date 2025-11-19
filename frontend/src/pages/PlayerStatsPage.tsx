import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
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
}

interface PlayerStatsPageProps {
  onBack: () => void;
}

type LeaderboardSortBy = 'sets' | 'games';

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

export default function PlayerStatsPage({ onBack }: PlayerStatsPageProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayersStats, setAllPlayersStats] = useState<PlayerStats[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('stats');
  const [leaderboardSort, setLeaderboardSort] = useState<LeaderboardSortBy>('sets');
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [trendFilter, setTrendFilter] = useState<'all' | 'last5Sessions'>('all');

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
    fetchMatchHistory();
  }, []);

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

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sets/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllPlayersStats(response.data.leaderboard);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
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
      if (trendFilter === 'last5Sessions') {
        sessions = sessions.slice(-5);
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

          data.push({
            session: sessionLabel,
            gamesWon: sessionWon,
            gamesLost: sessionLost,
            netChange,
            cumulativeNet,
            startValue,
            sessionNumber: sessionIndex + 1,
          });
        }
      });

      return data;
    } catch (error) {
      console.error('Error processing trend data:', error);
      return [];
    }
  }, [matchHistory, user?.id, trendFilter]);

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
        <div className="mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="bg-dark-card text-gray-300 hover:bg-dark-elevated hover:text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex items-center gap-2 font-medium shadow-lg border border-gray-800 transition-all text-sm sm:text-base"
          >
            ← Back to Dashboard
          </button>
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
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name}</h1>
                  <p className="text-gray-400">Player Statistics</p>
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
                    <div className="bg-dark-elevated p-4 rounded-xl border border-green-500/30">
                      <p className="text-gray-400 text-sm mb-1">Games Won</p>
                      <p className="text-3xl font-bold text-green-400">{stats.gamesWon}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-red-500/30">
                      <p className="text-gray-400 text-sm mb-1">Games Lost</p>
                      <p className="text-3xl font-bold text-red-400">{stats.gamesLost}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-padel-green/50">
                      <p className="text-gray-400 text-sm mb-1">Game Win Rate</p>
                      <p className="text-3xl font-bold text-padel-green">{stats.gameWinRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Win Rate Progress Bar */}
                  <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 font-medium">Game Win Performance</span>
                      <span className="text-padel-green font-bold">{stats.gameWinRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-padel-green to-emerald-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${stats.gameWinRate}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Games Won vs Lost Trend Graph */}
                  {trendData.length > 0 && (
                    <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Games Trend Over Time</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTrendFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              trendFilter === 'all'
                                ? 'bg-padel-green text-white'
                                : 'bg-dark-card text-gray-400 hover:text-white border border-gray-700'
                            }`}
                          >
                            All Sessions
                          </button>
                          <button
                            onClick={() => setTrendFilter('last5Sessions')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              trendFilter === 'last5Sessions'
                                ? 'bg-padel-green text-white'
                                : 'bg-dark-card text-gray-400 hover:text-white border border-gray-700'
                            }`}
                          >
                            Last 5 Sessions
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
                            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                            <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" strokeWidth={1} />
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
                                }
                                return [value, name];
                              }}
                            />
                            {/* Baseline bar (dotted line, shows starting position) */}
                            <Bar 
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
                              type="monotone"
                              dataKey="cumulativeNet"
                              stroke="#6B7280"
                              strokeWidth={1.5}
                              strokeDasharray="3 3"
                              dot={false}
                              activeDot={false}
                              name="Cumulative Trend"
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

            {/* Sort Filter */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-2">Sort by:</p>
              <div className="flex gap-2">
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

                      {/* Win Rate */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400 mb-0.5 sm:mb-1 hidden sm:block">Win Rate</p>
                        <p className="text-base sm:text-xl font-bold text-padel-green">
                          {leaderboardSort === 'sets' && player.setWinRate.toFixed(1)}
                          {leaderboardSort === 'games' && player.gameWinRate.toFixed(1)}%
                        </p>
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
