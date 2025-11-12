import { useState, type FormEvent } from 'react';

interface AddGuestModalProps {
  sessionId: string;
  courtId?: string;
  courtNumber?: number;
  courtIsFull?: boolean;
  onAdd: (sessionId: string, courtId: string | null, name: string, status: string) => Promise<void>;
  onClose: () => void;
}

export default function AddGuestModal({ sessionId, courtId, courtNumber, courtIsFull, onAdd, onClose }: AddGuestModalProps) {
  const [guestName, setGuestName] = useState('');
  const [status, setStatus] = useState('yes');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await onAdd(sessionId, status === 'yes' ? (courtId || null) : null, guestName.trim(), status);
      setGuestName('');
      setStatus('yes');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add guest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-800">
        <h2 className="text-2xl font-bold text-white mb-4">
          Add Guest {courtNumber ? `to Court ${courtNumber}` : ''}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
            {error}
          </div>
        )}

        {courtIsFull && (
          <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 text-yellow-300 rounded-xl text-sm">
            <p className="font-semibold mb-1">⚠️ Court is Full</p>
            <p className="text-xs">You can still add a guest with "Maybe" or "No" status.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guestName" className="block text-sm font-semibold text-gray-300 mb-2">
              Guest Name
            </label>
            <input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
              placeholder="Enter guest's name"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-semibold text-gray-300 mb-2">
              RSVP Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
            >
              <option value="yes">✅ Yes - Playing</option>
              <option value="maybe">🤔 Maybe</option>
              <option value="no">❌ No - Can't make it</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 text-white py-3 px-6 rounded-xl hover:bg-gray-600 transition-all font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !guestName.trim()}
              className="flex-1 bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold shadow-2xl hover:shadow-green-500/50"
            >
              {isLoading ? 'Adding...' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

