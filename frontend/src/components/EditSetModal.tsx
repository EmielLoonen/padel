import { useState, useEffect, type FormEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Player {
  userId: string;
  name: string;
  gamesWon: number;
}

interface SetRow {
  setNumber: number;
  scores: { [playerId: string]: number | null };
  isExisting: boolean; // Track if this set already exists in DB
  setId?: string; // Store the DB ID for existing sets
}

interface EditSetModalProps {
  setId: string;
  courtId: string;
  courtNumber: number;
  setNumber: number;
  currentScores: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSetModal({
  setId,
  courtId,
  courtNumber,
  setNumber,
  currentScores,
  onClose,
  onSuccess,
}: EditSetModalProps) {
  const [sets, setSets] = useState<SetRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with the current set
    const initialScores: { [playerId: string]: number | null } = {};
    currentScores.forEach((player) => {
      initialScores[player.userId] = player.gamesWon;
    });
    setSets([{ setNumber, scores: initialScores, isExisting: true, setId }]);
  }, [currentScores, setNumber, setId]);

  const updateScore = (setIdx: number, playerId: string, value: string) => {
    setSets((prevSets) =>
      prevSets.map((set, idx) =>
        idx === setIdx
          ? {
              ...set,
              scores: {
                ...set.scores,
                [playerId]: value === '' ? null : parseInt(value, 10),
              },
            }
          : set
      )
    );
    if (error) setError(null);
  };

  const addSetRow = () => {
    const newSetNumber = Math.max(...sets.map((s) => s.setNumber)) + 1;
    const emptyScores: { [playerId: string]: number | null } = {};
    currentScores.forEach((player) => {
      emptyScores[player.userId] = null;
    });
    setSets([...sets, { setNumber: newSetNumber, scores: emptyScores, isExisting: false }]);
  };

  const removeLastSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  // Helper function to get validation hint for a set
  const getSetValidationHint = (set: SetRow): string | null => {
    const scoredPlayers = Object.entries(set.scores)
      .filter(([, score]) => score !== null && score !== undefined && score >= 0)
      .map(([playerId, score]) => ({ playerId, score: score as number }));

    if (scoredPlayers.length < 2) return null;
    if (scoredPlayers.length < 4) return null; // Allow non-4-player games

    // Group by score
    const scoreGroups = new Map<number, number>();
    scoredPlayers.forEach(({ score }) => {
      scoreGroups.set(score, (scoreGroups.get(score) || 0) + 1);
    });

    // Check if we have proper 2v2 format
    if (scoredPlayers.length === 4 && scoreGroups.size === 2) {
      const teamSizes = Array.from(scoreGroups.values());
      if (teamSizes.every((size) => size === 2)) {
        return '✓ Valid 2v2 teams';
      }
    }

    return '⚠️ Teammates should have matching scores';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate each set
    for (const set of sets) {
      const scoredPlayers = Object.entries(set.scores)
        .filter(([, score]) => score !== null && score !== undefined && score >= 0)
        .map(([playerId, score]) => ({ playerId, score: score as number }));

      // Must have at least 2 players with scores
      if (scoredPlayers.length < 2) {
        setError(`Set ${set.setNumber} must have at least 2 players with scores`);
        return;
      }

      // Group players by score to find teams
      const scoreGroups = new Map<number, string[]>();
      scoredPlayers.forEach(({ playerId, score }) => {
        if (!scoreGroups.has(score)) {
          scoreGroups.set(score, []);
        }
        scoreGroups.get(score)!.push(playerId);
      });

      // For 2v2 or team games, we should have exactly 2 different scores (one per team)
      if (scoredPlayers.length >= 4 && scoreGroups.size !== 2) {
        setError(
          `Set ${set.setNumber}: In a 4-player game, there should be 2 teams with matching scores (e.g., 6-6 vs 4-4). Please ensure teammates have the same score.`
        );
        return;
      }

      // If we have 4 players, each team should have exactly 2 players
      if (scoredPlayers.length === 4 && scoreGroups.size === 2) {
        const teamSizes = Array.from(scoreGroups.values()).map((team) => team.length);
        if (!teamSizes.every((size) => size === 2)) {
          setError(
            `Set ${set.setNumber}: Each team should have 2 players with the same score (2v2 format).`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Process each set
      for (const set of sets) {
        const scoredPlayers = Object.entries(set.scores)
          .filter(([, score]) => score !== null && score !== undefined && score >= 0)
          .map(([playerId, score]) => ({ userId: playerId, gamesWon: score as number }));

        if (set.isExisting && set.setId) {
          // Update existing set
          await axios.put(
            `${API_URL}/api/sets/${set.setId}`,
            { scores: scoredPlayers },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        } else {
          // Create new set
          await axios.post(
            `${API_URL}/api/sets`,
            {
              courtId,
              setNumber: set.setNumber,
              scores: scoredPlayers,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }

      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to save set results';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl p-4 sm:p-6 max-w-4xl w-full border border-gray-800 shadow-2xl relative">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-3xl sm:text-4xl">✏️</span>
          Edit Set Results - Court {courtNumber}
        </h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl text-sm">
            <p className="font-semibold mb-1">Edit or add sets:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Edit existing set scores or add new sets</li>
              <li>Each set needs at least 2 players with scores</li>
              <li>For 4-player games, teammates must have matching scores</li>
              <li>Use "+ Add Set" button to add more sets</li>
            </ul>
          </div>

          {/* Players Header */}
          <div className="mb-3">
            <p className="text-sm text-gray-400">
              Players ({currentScores.length}): {currentScores.map((p) => p.name).join(', ')}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-dark-elevated">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs font-semibold text-gray-300 border-r border-gray-700 sticky left-0 bg-dark-elevated z-10 shadow-md">
                      Set
                    </th>
                    {currentScores.map((player) => (
                      <th
                        key={player.userId}
                        className="px-2 sm:px-3 py-2 text-center text-xs font-semibold text-gray-300 border-r border-gray-700 last:border-r-0 min-w-[70px] sm:min-w-[80px]"
                      >
                        <div className="truncate max-w-[60px] sm:max-w-none mx-auto" title={player.name}>
                          {player.name.split(' ')[0]}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-dark-card">
                  {sets.map((set, setIdx) => {
                    const validationHint = getSetValidationHint(set);
                    return (
                      <>
                        <tr key={setIdx} className="border-t border-gray-700">
                          <td className="px-2 sm:px-3 py-2 text-sm font-semibold text-padel-green border-r border-gray-700 sticky left-0 bg-dark-card z-10 shadow-md">
                            {set.setNumber}
                          </td>
                          {currentScores.map((player) => (
                            <td
                              key={player.userId}
                              className="px-1 sm:px-2 py-2 border-r border-gray-700 last:border-r-0"
                            >
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={set.scores[player.userId] ?? ''}
                                onChange={(e) =>
                                  updateScore(setIdx, player.userId, e.target.value)
                                }
                                className="w-full px-1 sm:px-2 py-1.5 sm:py-1 bg-dark-elevated border border-gray-600 text-white rounded text-center focus:outline-none focus:ring-1 focus:ring-padel-green text-sm sm:text-base"
                                placeholder="-"
                                inputMode="numeric"
                              />
                            </td>
                          ))}
                        </tr>
                        {validationHint && (
                          <tr key={`hint-${setIdx}`}>
                            <td colSpan={currentScores.length + 1} className="px-2 py-1 text-xs text-center">
                              <span
                                className={
                                  validationHint.startsWith('✓')
                                    ? 'text-green-400'
                                    : 'text-yellow-400'
                                }
                              >
                                {validationHint}
                              </span>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add/Remove Set Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button
              type="button"
              onClick={addSetRow}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              + Add Set
            </button>
            {sets.length > 1 && (
              <button
                type="button"
                onClick={removeLastSet}
                className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Remove Last
              </button>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-lg"
            >
              {isSubmitting ? 'Saving...' : 'Save All Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
