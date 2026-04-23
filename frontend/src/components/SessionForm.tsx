import { useState, useEffect, type FormEvent } from 'react';

export interface SessionFormValues {
  date: string;
  startTime: string;
  duration: number;
  cost: number | '';
  venueName: string;
  notes: string;
  maxPlayers: number;
}

interface SessionFormProps {
  mode: 'create' | 'edit';
  sportType?: 'PADEL' | 'TENNIS';
  initialValues?: Partial<SessionFormValues>;
  onSubmit: (values: SessionFormValues) => Promise<void>;
  onClose?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function SessionForm({
  mode,
  sportType = 'PADEL',
  initialValues,
  onSubmit,
  onClose,
  isLoading,
  error,
}: SessionFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initialValues?.date ?? '');
  const [startTime, setStartTime] = useState(initialValues?.startTime ?? '20:30');
  const [duration, setDuration] = useState(initialValues?.duration ?? 60);
  const [cost, setCost] = useState<number | ''>(initialValues?.cost ?? '');
  const [venueName, setVenueName] = useState(initialValues?.venueName ?? (mode === 'create' ? 'Padel Next' : ''));
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [maxPlayers, setMaxPlayers] = useState(initialValues?.maxPlayers ?? (sportType === 'TENNIS' ? 2 : 4));

  useEffect(() => {
    if (!initialValues) return;
    if (initialValues.date !== undefined) setDate(initialValues.date);
    if (initialValues.startTime !== undefined) setStartTime(initialValues.startTime);
    if (initialValues.duration !== undefined) setDuration(initialValues.duration);
    if (initialValues.cost !== undefined) setCost(initialValues.cost);
    if (initialValues.venueName !== undefined) setVenueName(initialValues.venueName);
    if (initialValues.notes !== undefined) setNotes(initialValues.notes);
    if (initialValues.maxPlayers !== undefined) setMaxPlayers(initialValues.maxPlayers);
  }, [initialValues?.date, initialValues?.startTime, initialValues?.venueName]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({ date, startTime, duration, cost, venueName, notes, maxPlayers });
  };

  return (
    <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-4xl">🎾</span>
          {mode === 'create' ? 'Create New Session' : 'Edit Session'}
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sport + Format */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-300">Sport</span>
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-padel-green/20 text-padel-green border border-padel-green/30">
              🎾 {sportType === 'TENNIS' ? 'Tennis' : 'Padel'}
            </span>
          </div>
          <label className="block text-xs text-gray-400 mb-1.5">Format</label>
          <div className="flex gap-2">
            {[4, 2].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxPlayers(n)}
                className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-all ${
                  maxPlayers === n
                    ? 'border-padel-green bg-padel-green/20 text-white'
                    : 'border-gray-700 bg-dark-elevated text-gray-400 hover:border-gray-500'
                }`}
              >
                {n} — {n === 4 ? 'Doubles' : 'Singles'}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="overflow-hidden">
          <label htmlFor="session-date" className="block text-sm font-semibold text-gray-300 mb-2">
            Date *
          </label>
          <input
            id="session-date"
            type="date"
            required
            min={mode === 'create' ? today : undefined}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full min-w-0 max-w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
          />
        </div>

        {/* Venue Name */}
        <div>
          <label htmlFor="session-venue" className="block text-sm font-semibold text-gray-300 mb-2">
            Venue Name *
          </label>
          <input
            id="session-venue"
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
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full min-w-0 max-w-full px-3 py-2 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
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
              value={cost}
              onChange={(e) => setCost(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full px-3 py-2 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
              placeholder="20.00"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="session-notes" className="block text-sm font-semibold text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            id="session-notes"
            rows={3}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
            placeholder="Bring your A-game! 🔥"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-dark-elevated border border-gray-700 text-gray-300 rounded-xl hover:text-white hover:border-gray-500 transition-all font-bold text-lg"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-2xl hover:shadow-green-500/50 hover:scale-[1.02] transform"
          >
            {isLoading
              ? mode === 'create' ? 'Creating…' : 'Saving…'
              : mode === 'create' ? 'Create Session 🎾' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
