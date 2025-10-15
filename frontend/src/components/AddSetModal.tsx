import { useState, type FormEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Player {
  id: string;
  name: string;
}

interface SetRow {
  setNumber: number;
  scores: { [playerId: string]: number | null }; // null means didn't play
}

interface AddSetModalProps {
  courtId: string;
  courtNumber: number;
  players: Player[]; // All players who RSVPed yes + guests
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddSetModal({
  courtId,
  courtNumber,
  players,
  onClose,
  onSuccess,
}: AddSetModalProps) {
  const [sets, setSets] = useState<SetRow[]>([
    { setNumber: 1, scores: Object.fromEntries(players.map((p) => [p.id, null])) },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSetRow = () => {
    setSets([
      ...sets,
      {
        setNumber: sets.length + 1,
        scores: Object.fromEntries(players.map((p) => [p.id, null])),
      },
    ]);
  };

  const removeLastSet = () => {
    if (sets.length > 1) {
      setSets(sets.slice(0, -1));
    }
  };

  const updateScore = (setNumber: number, playerId: string, value: string) => {
    setSets((prevSets) =>
      prevSets.map((set) =>
        set.setNumber === setNumber
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
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate: each set must have at least 2 players with scores
    for (const set of sets) {
      const scoredPlayers = Object.values(set.scores).filter(
        (score) => score !== null && score >= 0
      );
      if (scoredPlayers.length < 2) {
        setError(`Set ${set.setNumber} must have at least 2 players with scores`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Create each set individually
      for (const set of sets) {
        // Filter out players who didn't play (null scores)
        const scoresArray = Object.entries(set.scores)
          .filter(([, gamesWon]) => gamesWon !== null && gamesWon >= 0)
          .map(([userId, gamesWon]) => ({
            userId,
            gamesWon: gamesWon as number,
          }));

        await axios.post(
          `${API_URL}/api/sets`,
          {
            courtId,
            setNumber: set.setNumber,
            scores: scoresArray,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create sets:', err);
      setError(err.response?.data?.error || 'Failed to create sets');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-gray-700 p-4 sm:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🎾</span>
            Add Set Results - Court {courtNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl sm:text-3xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Instructions */}
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl text-sm">
            <p className="font-semibold mb-1">How to use:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Enter games won for each player in each set</li>
              <li>Leave empty (or 0) if a player didn't play that set</li>
              <li>Each set needs at least 2 players with scores</li>
              <li>Add more sets using the "+ Add Set" button</li>
            </ul>
          </div>

          {/* Players Header */}
          <div className="mb-3">
            <p className="text-sm text-gray-400">
              Players ({players.length}): {players.map((p) => p.name).join(', ')}
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
                    {players.map((player) => (
                      <th
                        key={player.id}
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
                  {sets.map((set) => (
                    <tr key={set.setNumber} className="border-t border-gray-700">
                      <td className="px-2 sm:px-3 py-2 text-sm font-semibold text-padel-green border-r border-gray-700 sticky left-0 bg-dark-card z-10 shadow-md">
                        {set.setNumber}
                      </td>
                      {players.map((player) => (
                        <td
                          key={player.id}
                          className="px-1 sm:px-2 py-2 border-r border-gray-700 last:border-r-0"
                        >
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={set.scores[player.id] ?? ''}
                            onChange={(e) =>
                              updateScore(set.setNumber, player.id, e.target.value)
                            }
                            className="w-full px-1 sm:px-2 py-1.5 sm:py-1 bg-dark-elevated border border-gray-600 text-white rounded text-center focus:outline-none focus:ring-1 focus:ring-padel-green text-sm sm:text-base"
                            placeholder="-"
                            inputMode="numeric"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
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
              {isSubmitting ? 'Saving...' : 'Save Results'}
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

