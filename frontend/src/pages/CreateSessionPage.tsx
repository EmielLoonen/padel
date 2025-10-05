import { useState, type FormEvent } from 'react';
import { useSessionStore, type CourtInput } from '../store/sessionStore';

export default function CreateSessionPage({ onSuccess }: { onSuccess?: () => void }) {
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('Padel Next');
  const [totalCost, setTotalCost] = useState('');
  const [notes, setNotes] = useState('');
  const [numberOfCourts, setNumberOfCourts] = useState(1);
  const [courts, setCourts] = useState<CourtInput[]>([
    { courtNumber: 1, startTime: '20:30', duration: 60 },
  ]);

  const { createSession, isLoading, error } = useSessionStore();

  const handleNumberOfCourtsChange = (num: number) => {
    setNumberOfCourts(num);
    
    // Update courts array
    const newCourts: CourtInput[] = [];
    for (let i = 1; i <= num; i++) {
      const existing = courts.find((c) => c.courtNumber === i);
      newCourts.push(
        existing || { courtNumber: i, startTime: '20:30', duration: 60 }
      );
    }
    setCourts(newCourts);
  };

  const updateCourt = (courtNumber: number, field: keyof CourtInput, value: string | number) => {
    setCourts((prev) =>
      prev.map((court) =>
        court.courtNumber === courtNumber ? { ...court, [field]: value } : court
      )
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      // Use the first court's start time as the session time
      const sessionTime = courts[0]?.startTime || '20:30';
      
      await createSession({
        date,
        time: sessionTime,
        venueName,
        totalCost: totalCost ? parseFloat(totalCost) : undefined,
        notes: notes || undefined,
        courts,
      });

      // Reset form
      setDate('');
      setVenueName('');
      setTotalCost('');
      setNotes('');
      setNumberOfCourts(1);
      setCourts([{ courtNumber: 1, startTime: '20:30', duration: 60 }]);

      if (onSuccess) {
        onSuccess();
      }

      alert('Session created successfully! 🎾');
    } catch (err) {
      // Error handled by store
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-dark-card rounded-2xl shadow-2xl p-8 border border-gray-800">
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
          {/* Date */}
          <div>
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
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
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

          {/* Number of Courts */}
          <div>
            <label htmlFor="numberOfCourts" className="block text-sm font-semibold text-gray-300 mb-2">
              Number of Courts *
            </label>
            <select
              id="numberOfCourts"
              value={numberOfCourts}
              onChange={(e) => handleNumberOfCourtsChange(parseInt(e.target.value))}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
            >
              {[1, 2, 3, 4].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Court' : 'Courts'}
                </option>
              ))}
            </select>
          </div>

          {/* Court Details */}
          {numberOfCourts > 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Court Times & Durations</h3>
              {courts.map((court) => (
                <div
                  key={court.courtNumber}
                  className="p-4 bg-dark-elevated rounded-xl border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-padel-green">Court {court.courtNumber}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={court.startTime}
                        onChange={(e) =>
                          updateCourt(court.courtNumber, 'startTime', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
                      <select
                        value={court.duration}
                        onChange={(e) =>
                          updateCourt(court.courtNumber, 'duration', parseInt(e.target.value))
                        }
                        className="w-full px-3 py-2 bg-dark-card border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-padel-green text-sm"
                      >
                        <option value="60">60 min</option>
                        <option value="90">90 min</option>
                        <option value="120">120 min</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Cost */}
          <div>
            <label htmlFor="totalCost" className="block text-sm font-semibold text-gray-300 mb-2">
              Total Court Cost (€)
            </label>
            <input
              id="totalCost"
              type="number"
              step="0.01"
              min="0"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="40.00"
            />
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
