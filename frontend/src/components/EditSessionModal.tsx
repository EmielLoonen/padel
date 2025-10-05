import { useState, useEffect } from 'react';
import { useSessionStore, type Session } from '../store/sessionStore';

interface EditSessionModalProps {
  session: Session;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSessionModal({ session, onClose, onSuccess }: EditSessionModalProps) {
  const { updateSession, isLoading } = useSessionStore();

  const [formData, setFormData] = useState({
    date: session.date.split('T')[0], // Format as YYYY-MM-DD
    time: session.time,
    venueName: session.venueName,
    notes: session.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingCourtId, setDeletingCourtId] = useState<string | null>(null);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [courtEdits, setCourtEdits] = useState<Record<string, any>>({});

  const handleEditCourt = (court: any) => {
    setEditingCourtId(court.id);
    setCourtEdits({
      [court.id]: {
        courtNumber: court.courtNumber,
        startTime: court.startTime,
        duration: court.duration,
        cost: court.cost || '',
      },
    });
  };

  const handleCourtEditChange = (courtId: string, field: string, value: any) => {
    setCourtEdits((prev) => ({
      ...prev,
      [courtId]: {
        ...prev[courtId],
        [field]: value,
      },
    }));
  };

  const handleSaveCourtEdit = async (courtId: string) => {
    try {
      const token = localStorage.getItem('token');
      const edits = courtEdits[courtId];
      
      const payload: any = {
        courtNumber: parseInt(edits.courtNumber),
        startTime: edits.startTime,
        duration: parseInt(edits.duration),
      };
      
      if (edits.cost) {
        payload.cost = parseFloat(edits.cost);
      }
      
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/courts/${courtId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      setEditingCourtId(null);
      setCourtEdits({});
      onSuccess();
    } catch (error) {
      alert('Failed to update court');
    }
  };

  const handleCancelCourtEdit = () => {
    setEditingCourtId(null);
    setCourtEdits({});
  };

  const handleDeleteCourt = async (courtId: string) => {
    if (!confirm('Are you sure you want to delete this empty court?')) return;
    
    setDeletingCourtId(courtId);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/courts/${courtId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh the session
      onSuccess();
    } catch (error) {
      alert('Failed to delete court');
    } finally {
      setDeletingCourtId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.venueName.trim()) newErrors.venueName = 'Venue name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await updateSession(session.id, {
        date: formData.date,
        time: formData.time,
        venueName: formData.venueName.trim(),
        notes: formData.notes.trim() || undefined,
      });

      onSuccess();
    } catch (error) {
      alert('Failed to update session. Please try again.');
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Edit Session</h2>
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
          {/* Courts Section */}
          {session.courts && session.courts.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Courts ({session.courts.length})</h3>
              <div className="space-y-3">
                {session.courts.map((court) => {
                  const hasPlayers = court.rsvps && court.rsvps.length > 0;
                  const isEditing = editingCourtId === court.id;
                  const edits = courtEdits[court.id];
                  
                  return (
                    <div key={court.id} className="p-3 bg-white border rounded-lg">
                      {isEditing ? (
                        // Edit mode
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Court #</label>
                              <input
                                type="number"
                                min="1"
                                value={edits.courtNumber}
                                onChange={(e) => handleCourtEditChange(court.id, 'courtNumber', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                              <input
                                type="time"
                                value={edits.startTime}
                                onChange={(e) => handleCourtEditChange(court.id, 'startTime', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Duration (min)</label>
                              <select
                                value={edits.duration}
                                onChange={(e) => handleCourtEditChange(court.id, 'duration', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="60">60</option>
                                <option value="90">90</option>
                                <option value="120">120</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Cost (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={edits.cost}
                                onChange={(e) => handleCourtEditChange(court.id, 'cost', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveCourtEdit(court.id)}
                              className="flex-1 py-1 px-3 bg-padel-green text-white rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelCourtEdit}
                              className="flex-1 py-1 px-3 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-gray-700">Court {court.courtNumber}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {court.startTime} ({court.duration} min)
                              {court.cost && <span> • €{court.cost}</span>}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {court.rsvps?.length || 0}/{court.maxPlayers} players
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCourt(court)}
                              className="text-padel-green hover:text-green-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                            {!hasPlayers && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCourt(court.id)}
                                disabled={deletingCourtId === court.id}
                                className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                              >
                                {deletingCourtId === court.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                You can edit court details or delete courts with no players assigned.
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-padel-green ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-padel-green ${
                    errors.time ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
              </div>
            </div>

            {/* Venue Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venueName"
                value={formData.venueName}
                onChange={handleChange}
                placeholder="e.g., Padel Club Amsterdam"
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-padel-green ${
                  errors.venueName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.venueName && (
                <p className="text-red-500 text-sm mt-1">{errors.venueName}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional info..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-padel-green"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-padel-green text-white rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

