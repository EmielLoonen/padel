import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlayerStats {
  userId: string;
  userName: string;
  userAvatar: string | null;
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  totalSets: number;
  gamesWon: number;
  gamesLost: number;
  totalGames: number;
  setWinRate: number;
  gameWinRate: number;
  matchWinRate: number;
}

interface PlayerStatsPageProps {
  onBack: () => void;
}

type LeaderboardSortBy = 'matches' | 'sets' | 'games';

interface MatchHistory {
  id: string;
  date: string;
  sessionId: string;
  venueName: string;
  courtNumber: number;
  sets: { team1: number; team2: number }[];
  team1Player1: { id: string; name: string; avatarUrl: string | null };
  team1Player2: { id: string; name: string; avatarUrl: string | null };
  team2Player1: { id: string; name: string; avatarUrl: string | null };
  team2Player2: { id: string; name: string; avatarUrl: string | null };
  team1SetsWon: number;
  team2SetsWon: number;
  playerWon: boolean;
  isTeam1: boolean;
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

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
    fetchMatchHistory();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/matches/stats/${user?.id}`, {
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
      const response = await axios.get(`${API_URL}/api/matches/history/${user?.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchHistory(response.data.matches);
    } catch (error) {
      console.error('Failed to fetch match history:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/matches/leaderboard`, {
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
      case 'matches':
        // Sort by match win rate, then by matches won
        return sorted.sort((a, b) => {
          if (b.matchWinRate !== a.matchWinRate) {
            return b.matchWinRate - a.matchWinRate;
          }
          return b.matchesWon - a.matchesWon;
        });
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

              {stats && stats.totalMatches > 0 ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm mb-1">Total Matches</p>
                      <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-green-500/30">
                      <p className="text-gray-400 text-sm mb-1">Matches Won</p>
                      <p className="text-3xl font-bold text-green-400">{stats.matchesWon}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-red-500/30">
                      <p className="text-gray-400 text-sm mb-1">Matches Lost</p>
                      <p className="text-3xl font-bold text-red-400">{stats.matchesLost}</p>
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
                  <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700">
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
                  onClick={() => setLeaderboardSort('matches')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    leaderboardSort === 'matches'
                      ? 'bg-padel-green text-white'
                      : 'bg-dark-elevated text-gray-400 hover:text-white'
                  }`}
                >
                  🏅 Matches
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
                            <p>{player.totalMatches} {player.totalMatches === 1 ? 'match' : 'matches'}</p>
                            {leaderboardSort === 'matches' && <p>{player.matchesWon}W - {player.matchesLost}L</p>}
                            {leaderboardSort === 'sets' && <p>{player.setsWon}W - {player.setsLost}L</p>}
                            {leaderboardSort === 'games' && <p>{player.gamesWon}W - {player.gamesLost}L</p>}
                          </div>
                          {/* Desktop: 1 line - show stats based on sort */}
                          <p className="hidden sm:block text-sm text-gray-400">
                            {player.totalMatches} matches · 
                            {leaderboardSort === 'matches' && ` ${player.matchesWon}W-${player.matchesLost}L`}
                            {leaderboardSort === 'sets' && ` ${player.setsWon}W-${player.setsLost}L`}
                            {leaderboardSort === 'games' && ` ${player.gamesWon}W-${player.gamesLost}L`}
                          </p>
                        </div>
                      </div>

                      {/* Stats - Desktop only */}
                      <div className="hidden sm:flex items-center gap-6">
                        {leaderboardSort === 'matches' && (
                          <>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Matches Won</p>
                              <p className="text-lg font-bold text-green-400">{player.matchesWon}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Matches Lost</p>
                              <p className="text-lg font-bold text-red-400">{player.matchesLost}</p>
                            </div>
                          </>
                        )}
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
                          {leaderboardSort === 'matches' && player.matchWinRate.toFixed(1)}
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
          // Match History View
          <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <span>📜</span>
              Match History
            </h2>

            {matchHistory.length > 0 ? (
              <div className="space-y-3">
                {matchHistory.map((match) => (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border-2 ${
                      match.playerWon
                        ? 'bg-green-900/20 border-green-600/50'
                        : 'bg-red-900/20 border-red-600/50'
                    }`}
                  >
                    {/* Date & Venue */}
                    <div className="flex justify-between items-start mb-3 text-sm">
                      <div>
                        <p className="text-gray-400">
                          {new Date(match.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-gray-500 text-xs">{match.venueName} - Court {match.courtNumber}</p>
                      </div>
                      <div className={`text-lg font-bold ${match.playerWon ? 'text-green-500' : 'text-red-500'}`}>
                        {match.playerWon ? 'W' : 'L'}
                      </div>
                    </div>

                    {/* Teams */}
                    <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center text-sm">
                      {/* Team 1 */}
                      <div className={`${match.isTeam1 ? 'font-semibold text-white' : 'text-gray-400'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar
                            src={match.team1Player1.avatarUrl}
                            name={match.team1Player1.name || 'Unknown'}
                            size="sm"
                          />
                          <span className="truncate">{match.team1Player1.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={match.team1Player2.avatarUrl}
                            name={match.team1Player2.name || 'Unknown'}
                            size="sm"
                          />
                          <span className="truncate">{match.team1Player2.name}</span>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {match.team1SetsWon} - {match.team2SetsWon}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {match.sets.map((set, idx) => (
                            <span key={idx} className="mr-2">
                              {set.team1}-{set.team2}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Team 2 */}
                      <div className={`text-right ${!match.isTeam1 ? 'font-semibold text-white' : 'text-gray-400'}`}>
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <span className="truncate">{match.team2Player1.name}</span>
                          <Avatar
                            src={match.team2Player1.avatarUrl}
                            name={match.team2Player1.name || 'Unknown'}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <span className="truncate">{match.team2Player2.name}</span>
                          <Avatar
                            src={match.team2Player2.avatarUrl}
                            name={match.team2Player2.name || 'Unknown'}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p className="text-6xl mb-4">🎾</p>
                <p className="text-xl font-semibold mb-2 text-white">No matches yet!</p>
                <p className="text-sm">Play some matches to see your history</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
