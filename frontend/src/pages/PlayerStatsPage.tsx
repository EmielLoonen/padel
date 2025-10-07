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
  setsWon: number;
  setsLost: number;
  totalSets: number;
  winRate: number;
}

interface PlayerStatsPageProps {
  onBack: () => void;
}

export default function PlayerStatsPage({ onBack }: PlayerStatsPageProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayersStats, setAllPlayersStats] = useState<PlayerStats[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchLeaderboard();
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
              onClick={() => setShowLeaderboard(false)}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                !showLeaderboard
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              📊 My Stats
            </button>
            <button
              onClick={() => setShowLeaderboard(true)}
              className={`flex-1 py-2 sm:py-3 px-4 rounded-lg font-semibold transition-all ${
                showLeaderboard
                  ? 'bg-padel-green text-white'
                  : 'bg-dark-elevated text-gray-400 hover:text-white'
              }`}
            >
              🏆 Leaderboard
            </button>
          </div>
        </div>

        {!showLeaderboard ? (
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-dark-elevated p-4 rounded-xl border border-gray-700">
                      <p className="text-gray-400 text-sm mb-1">Total Matches</p>
                      <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-green-500/30">
                      <p className="text-gray-400 text-sm mb-1">Sets Won</p>
                      <p className="text-3xl font-bold text-green-400">{stats.setsWon}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-red-500/30">
                      <p className="text-gray-400 text-sm mb-1">Sets Lost</p>
                      <p className="text-3xl font-bold text-red-400">{stats.setsLost}</p>
                    </div>
                    <div className="bg-dark-elevated p-4 rounded-xl border border-padel-green/50">
                      <p className="text-gray-400 text-sm mb-1">Win Rate</p>
                      <p className="text-3xl font-bold text-padel-green">{stats.winRate.toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Win Rate Progress Bar */}
                  <div className="bg-dark-elevated p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-400 font-medium">Performance</span>
                      <span className="text-padel-green font-bold">{stats.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-padel-green to-emerald-500 h-4 rounded-full transition-all duration-500"
                        style={{ width: `${stats.winRate}%` }}
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
        ) : (
          // Leaderboard View
          <div className="bg-dark-card rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <span>🏆</span>
              Leaderboard
            </h2>

            {allPlayersStats.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {allPlayersStats.map((player, index) => {
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
                          {/* Mobile: 2 lines */}
                          <div className="sm:hidden text-xs text-gray-400">
                            <p>{player.totalMatches} {player.totalMatches === 1 ? 'match' : 'matches'}</p>
                            <p>{player.setsWon}W - {player.setsLost}L</p>
                          </div>
                          {/* Desktop: 1 line */}
                          <p className="hidden sm:block text-sm text-gray-400">
                            {player.totalMatches} matches · {player.setsWon}W-{player.setsLost}L
                          </p>
                        </div>
                      </div>

                      {/* Stats - Desktop only */}
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Sets Won</p>
                          <p className="text-lg font-bold text-green-400">{player.setsWon}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">Sets Lost</p>
                          <p className="text-lg font-bold text-red-400">{player.setsLost}</p>
                        </div>
                      </div>

                      {/* Win Rate */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400 mb-0.5 sm:mb-1 hidden sm:block">Win Rate</p>
                        <p className="text-base sm:text-xl font-bold text-padel-green">{player.winRate.toFixed(1)}%</p>
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
        )}
      </div>
    </div>
  );
}
