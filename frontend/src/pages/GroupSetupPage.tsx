import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { useAuthStore, type UserGroup } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface GroupSetupPageProps {
  onSuccess?: () => void;
}

export default function GroupSetupPage({ onSuccess }: GroupSetupPageProps = {}) {
  const { token, setUser, user, switchGroup } = useAuthStore();
  const [view, setView] = useState<'choice' | 'create' | 'join'>('choice');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/groups`, { name: groupName }, { headers });
      const newGroup: UserGroup = { id: res.data.group.id, name: res.data.group.name, role: 'admin', canCreateSessions: true };
      // Add new group to user's list, then switch to it
      if (user) {
        setUser({ ...user, groups: [...(user.groups || []), newGroup] });
      }
      await switchGroup(res.data.group.id);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/groups/join`, { inviteCode: inviteCode.trim() }, { headers });
      const newGroup: UserGroup = { id: res.data.group.id, name: res.data.group.name, role: 'member', canCreateSessions: false };
      if (user) {
        setUser({ ...user, groups: [...(user.groups || []), newGroup] });
      }
      await switchGroup(res.data.group.id);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="bg-dark-card rounded-3xl shadow-2xl p-10 w-full max-w-md border border-gray-800">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">🏟️</div>
          <h1 className="text-3xl font-bold text-white mb-2">Join or Create a Group</h1>
          <p className="text-gray-400">Create a new padel group or join an existing one with an invite code.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        {view === 'choice' && (
          <div className="space-y-4">
            <button
              onClick={() => setView('create')}
              className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              Create a New Group
            </button>
            <button
              onClick={() => setView('join')}
              className="w-full bg-dark-elevated border-2 border-gray-700 text-white py-4 px-6 rounded-xl font-bold text-lg hover:border-padel-green transition-all"
            >
              Join with Invite Code
            </button>
          </div>
        )}

        {view === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Group Name</label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all"
                placeholder="e.g. Padel Club Amsterdam"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
            <button type="button" onClick={() => { setView('choice'); setError(''); }} className="w-full text-gray-400 hover:text-white transition-colors py-2">
              Back
            </button>
          </form>
        )}

        {view === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Invite Code</label>
              <input
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-dark-elevated border-2 border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-padel-green transition-all tracking-widest font-mono text-center text-xl"
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-padel-green to-emerald-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Joining...' : 'Join Group'}
            </button>
            <button type="button" onClick={() => { setView('choice'); setError(''); }} className="w-full text-gray-400 hover:text-white transition-colors py-2">
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
