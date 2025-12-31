import { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from './Avatar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AddUserModalProps {
  sessionId: string;
  courtId: string;
  courtNumber: number;
  courtIsFull: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddUserModal({
  sessionId,
  courtId,
  courtNumber,
  courtIsFull,
  onSuccess,
  onClose,
}: AddUserModalProps) {
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; avatarUrl: string | null }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [status, setStatus] = useState<'yes' | 'no' | 'maybe'>('yes');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/admin/sessions/${sessionId}/add-user`,
        {
          userId: selectedUserId,
          status,
          courtId: status === 'yes' && !courtIsFull ? courtId : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to add user to session');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-2xl p-6 max-w-md w-full border border-gray-800 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-4">Add User to Court {courtNumber}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 bg-dark-elevated border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-padel-green"
            />
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select User</label>
            <div className="max-h-48 overflow-y-auto border border-gray-700 rounded-lg bg-dark-elevated">
              {filteredUsers.length === 0 ? (
                <p className="p-4 text-gray-500 text-center">No users found</p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors ${
                      selectedUserId === user.id ? 'bg-padel-green/20 border-l-4 border-padel-green' : ''
                    }`}
                  >
                    <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                    <div className="flex-1 text-left">
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    {selectedUserId === user.id && (
                      <span className="text-padel-green">✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">RSVP Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStatus('yes')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  status === 'yes'
                    ? 'bg-green-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-green-500/20'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setStatus('maybe')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  status === 'maybe'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-yellow-500/20'
                }`}
              >
                Maybe
              </button>
              <button
                type="button"
                onClick={() => setStatus('no')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  status === 'no'
                    ? 'bg-red-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-red-500/20'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {status === 'yes' && courtIsFull && (
            <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 rounded">
              <p className="text-yellow-400 text-sm">
                ⚠️ Court is full. User will be added to waitlist.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-dark-elevated text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isLoading}
              className="flex-1 py-2 px-4 bg-padel-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


