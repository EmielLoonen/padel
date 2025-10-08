import { useState, type FormEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Player {
  id: string;
  name: string;
}

interface AddMatchModalProps {
  courtId: string;
  courtNumber: number;
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMatchModal({
  courtId,
  courtNumber,
  players,
  onClose,
  onSuccess,
}: AddMatchModalProps) {
  const [team1Player1, setTeam1Player1] = useState('');
  const [team1Player2, setTeam1Player2] = useState('');
  const [team2Player1, setTeam2Player1] = useState('');
  const [team2Player2, setTeam2Player2] = useState('');
  const [sets, setSets] = useState<Array<{ team1: string; team2: string }>>([
    { team1: '', team2: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addSet = () => {
    setSets([...sets, { team1: '', team2: '' }]);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, team: 'team1' | 'team2', value: string) => {
    const newSets = [...sets];
    newSets[index][team] = value;
    setSets(newSets);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!team1Player1 || !team1Player2 || !team2Player1 || !team2Player2) {
      setError('Please select all 4 players');
      return;
    }

    // Validate sets
    const validSets = sets.filter((set) => set.team1 && set.team2);
    if (validSets.length === 0) {
      setError('Please enter at least one set score');
      return;
    }

    // Check for duplicate players
    const selectedPlayers = [team1Player1, team1Player2, team2Player1, team2Player2];
    const uniquePlayers = new Set(selectedPlayers);
    if (uniquePlayers.size !== 4) {
      setError('All 4 players must be different');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/matches`,
        {
          courtId,
          team1Player1Id: team1Player1,
          team1Player2Id: team1Player2,
          team2Player1Id: team2Player1,
          team2Player2Id: team2Player2,
          sets: validSets.map((set) => ({
            team1: parseInt(set.team1),
            team2: parseInt(set.team2),
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to record match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Record Match - Court {courtNumber}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {players.length < 4 && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
              ⚠️ This court needs at least 4 players to record a match.
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team 1 */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-bold text-green-700 mb-4">Team 1</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player 1 *
                  </label>
                  <select
                    value={team1Player1}
                    onChange={(e) => setTeam1Player1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select player...</option>
                    {players.map((player) => (
                      <option 
                        key={player.id} 
                        value={player.id}
                        disabled={[team1Player2, team2Player1, team2Player2].includes(player.id)}
                      >
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player 2 *
                  </label>
                  <select
                    value={team1Player2}
                    onChange={(e) => setTeam1Player2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select player...</option>
                    {players.map((player) => (
                      <option 
                        key={player.id} 
                        value={player.id}
                        disabled={[team1Player1, team2Player1, team2Player2].includes(player.id)}
                      >
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Team 2 */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-700 mb-4">Team 2</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player 1 *
                  </label>
                  <select
                    value={team2Player1}
                    onChange={(e) => setTeam2Player1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select player...</option>
                    {players.map((player) => (
                      <option 
                        key={player.id} 
                        value={player.id}
                        disabled={[team1Player1, team1Player2, team2Player2].includes(player.id)}
                      >
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player 2 *
                  </label>
                  <select
                    value={team2Player2}
                    onChange={(e) => setTeam2Player2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select player...</option>
                    {players.map((player) => (
                      <option 
                        key={player.id} 
                        value={player.id}
                        disabled={[team1Player1, team1Player2, team2Player1].includes(player.id)}
                      >
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sets */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-800">Sets</h3>
              <button
                type="button"
                onClick={addSet}
                className="text-sm bg-padel-green text-white px-3 py-1 rounded-lg hover:bg-green-700"
              >
                + Add Set
              </button>
            </div>
            
            <div className="space-y-3">
              {sets.map((set, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm font-medium text-gray-700 w-16">Set {index + 1}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set.team1}
                      onChange={(e) => updateSet(index, 'team1', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                      placeholder="6"
                    />
                    <span className="text-gray-500 font-bold">-</span>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set.team2}
                      onChange={(e) => updateSet(index, 'team2', e.target.value)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="4"
                    />
                  </div>
                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSet(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-padel-green to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Recording...' : 'Record Match 🏆'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
