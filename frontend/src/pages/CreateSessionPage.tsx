import { useState, type FormEvent } from 'react';
import { useSessionStore, type CourtInput } from '../store/sessionStore';
import { useAuthStore } from '../store/authStore';

export default function CreateSessionPage({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthStore();
  const activeGroup = user?.groups?.find((g) => g.id === user.groupId);
  const sportType = activeGroup?.sportType ?? 'PADEL';

  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('Padel Next');
  const [notes, setNotes] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(sportType === 'TENNIS' ? 2 : 4);
  const [court, setCourt] = useState<CourtInput>({ courtNumber: 1, startTime: '20:30', duration: 60 });

  const { createSession, isLoading, error } = useSessionStore();

  const updateCourt = (field: keyof CourtInput, value: string | number) => {
    setCourt((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await createSession({
        date,
        time: court.startTime,
        venueName,
        notes: notes || undefined,
        courts: [{ ...court, maxPlayers }],
      });

      // Reset form
      setDate('');
      setVenueName('Padel Next');
      setNotes('');
      setMaxPlayers(sportType === 'TENNIS' ? 2 : 4);
      setCourt({ courtNumber: 1, startTime: '20:30', duration: 60 });

      if (onSuccess) {
        onSuccess();
      }

      alert('Session created successfully! 🎾');
    } catch (err) {
      // Error handled by store
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-4xl">🎾</span>
          Create New Session
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sport (from group) + format toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-300">Sport</span>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-padel-green/20 text-padel-green border border-padel-green/30">
                🎾 {sportType === 'TENNIS' ? 'Tennis' : 'Padel'}
              </span>
            </div>
            <label className="block text-xs text-gray-400 mb-1.5">Format</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMaxPlayers(4)}
                className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-all ${
                  maxPlayers === 4
                    ? 'border-padel-green bg-padel-green/20 text-white'
                    : 'border-gray-700 bg-dark-elevated text-gray-400 hover:border-gray-500'
                }`}
              >
                4 — Doubles
              </button>
              <button
                type="button"
                onClick={() => setMaxPlayers(2)}
                className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-all ${
                  maxPlayers === 2
                    ? 'border-padel-green bg-padel-green/20 text-white'
                    : 'border-gray-700 bg-dark-elevated text-gray-400 hover:border-gray-500'
                }`}
              >
                2 — Singles
              </button>
            </div>
          </div>

          {/* Date */}
          <div className="overflow-hidden">
            <label htmlFor="date" className="block text-sm font-semibold text-gray-300 mb-2">
              Date *
            </label>
            <input
              id="date"
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0 max-w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
            />
          </div>

          {/* Venue Name */}
          <div>
            <label htmlFor="venueName" className="block text-sm font-semibold text-gray-300 mb-2">
              Venue Name *
            </label>
            <input
              id="venueName"
              type="text"
              required
              maxLength={200}
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="Court Central Amsterdam"
            />
          </div>

          {/* Court Details */}
          <div className="p-4 bg-dark-elevated rounded-xl border border-gray-700 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Court Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="overflow-hidden">
                <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                <input
                  type="time"
                  value={court.startTime}
                  onChange={(e) => updateCourt('startTime', e.target.value)}
                  className="w-full min-w-0 max-w-full px-3 py-2 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
                <div className="relative">
                  <select
                    value={court.duration}
                    onChange={(e) => updateCourt('duration', parseInt(e.target.value))}
                    className="w-full appearance-none px-3 py-2 pr-9 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
                  >
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cost (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={court.cost || ''}
                onChange={(e) => updateCourt('cost', e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full px-3 py-2 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
                placeholder="20.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="Bring your A-game! 🔥"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-2xl hover:shadow-green-500/50 hover:scale-[1.02] transform"
          >
            {isLoading ? 'Creating Session...' : 'Create Session 🎾'}
          </button>
        </form>
      </div>
    </div>
  );
}
