import { useState, type FormEvent } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Set {
  team1: number;
  team2: number;
}

interface EditMatchModalProps {
  matchId: string;
  courtNumber: number;
  initialSets: Set[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMatchModal({
  matchId,
  courtNumber,
  initialSets,
  onClose,
  onSuccess,
}: EditMatchModalProps) {
  const [sets, setSets] = useState<Array<{ team1: string; team2: string }>>(
    initialSets.map((set) => ({ team1: set.team1.toString(), team2: set.team2.toString() }))
  );
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

    // Validate sets
    const validSets = sets.filter((set) => set.team1 && set.team2);
    if (validSets.length === 0) {
      setError('Please enter at least one set score');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/matches/${matchId}`,
        {
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
      setError(err?.response?.data?.error || 'Failed to update match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-padel-green to-emerald-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">Edit Match - Court {courtNumber}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Sets */}
          <div>
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
              className="flex-1 py-3 px-6 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-padel-green to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
