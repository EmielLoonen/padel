import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


interface Group {
  id: string;
  name: string;
  sportType: 'PADEL' | 'TENNIS';
  inviteCode: string;
  createdAt: string;
  _count: { members: number; sessions: number };
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isSuperAdmin: boolean;
  lastLogin: string | null;
  createdAt: string;
  groups: Array<{
    role: string;
    canCreateSessions: boolean;
    group: { id: string; name: string; sportType: 'PADEL' | 'TENNIS' };
  }>;
}

interface Props {
  token: string;
  onLogout: () => void;
}

type Tab = 'groups' | 'users';

export default function SuperAdminDashboard({ token, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('groups');

  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [resetModal, setResetModal] = useState<{ userId: string; name: string } | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [userGroupFilter, setUserGroupFilter] = useState<string>('');
  const resetInputRef = useRef<HTMLInputElement>(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [groupsRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/superadmin/groups`, { headers }),
          axios.get(`${API_URL}/api/superadmin/users`, { headers }),
        ]);
        setGroups(groupsRes.data.groups);
        setUsers(usersRes.data.users);
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleToggleCanCreate = async (userId: string, groupId: string, current: boolean) => {
    const key = `${userId}:${groupId}`;
    setTogglingKey(key);
    try {
      await axios.patch(
        `${API_URL}/api/superadmin/users/${userId}/groups/${groupId}/can-create-sessions`,
        { canCreateSessions: !current },
        { headers }
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.id !== userId
            ? u
            : {
                ...u,
                groups: u.groups.map((m) =>
                  m.group.id === groupId ? { ...m, canCreateSessions: !current } : m
                ),
              }
        )
      );
    } catch {
      // silently ignore — user stays in previous state
    } finally {
      setTogglingKey(null);
    }
  };

  const openResetModal = (userId: string, name: string) => {
    setResetModal({ userId, name });
    setResetPassword('');
    setResetError('');
    setResetSuccess(false);
    setTimeout(() => resetInputRef.current?.focus(), 50);
  };

  const handleResetPassword = async () => {
    if (!resetModal) return;
    setResetLoading(true);
    setResetError('');
    try {
      await axios.post(
        `${API_URL}/api/superadmin/users/${resetModal.userId}/reset-password`,
        { newPassword: resetPassword },
        { headers }
      );
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesGroup = !userGroupFilter || u.groups.some((m) => m.group.id === userGroupFilter);
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredGroups = groups
    .filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-card border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <div>
            <h1 className="text-lg font-bold text-white">Super Admin</h1>
            <p className="text-xs text-gray-500">App management</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium text-sm"
        >
          Sign Out
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-dark-card rounded-xl p-1 border border-gray-800 w-fit">
          {(['groups', 'users'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-medium text-sm capitalize transition-all ${
                tab === t
                  ? 'bg-padel-green text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading...</div>
          </div>
        ) : (
          <>
            {/* Groups tab */}
            {tab === 'groups' && (
              <div className="bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between gap-4">
                  <h2 className="text-white font-semibold">All Groups ({filteredGroups.length})</h2>
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="px-3 py-1.5 bg-dark-elevated border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-padel-green w-48"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                        <th className="text-left px-6 py-3">Name</th>
                        <th className="text-left px-6 py-3">Sport</th>
                        <th className="text-left px-6 py-3">Invite Code</th>
                        <th className="text-left px-6 py-3">Members</th>
                        <th className="text-left px-6 py-3">Events</th>
                        <th className="text-left px-6 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGroups.map((g) => (
                        <tr
                          key={g.id}
                          onClick={() => { setUserGroupFilter(g.id); setTab('users'); }}
                          className="border-b border-gray-800/50 hover:bg-dark-elevated/50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-3 text-white font-medium">{g.name}</td>
                          <td className="px-6 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-padel-green/20 text-padel-green border border-padel-green/30">
                              {g.sportType === 'TENNIS' ? 'Tennis' : 'Padel'}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-mono text-padel-green text-xs tracking-widest">{g.inviteCode}</td>
                          <td className="px-6 py-3 text-gray-300">{g._count.members}</td>
                          <td className="px-6 py-3 text-gray-300">{g._count.sessions}</td>
                          <td className="px-6 py-3 text-gray-500">{formatDate(g.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredGroups.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No groups found</p>
                  )}
                </div>
              </div>
            )}

            {/* Users tab */}
            {tab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-white font-semibold">All Users ({filteredUsers.length})</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={userGroupFilter}
                      onChange={(e) => setUserGroupFilter(e.target.value)}
                      className="px-3 py-1.5 bg-dark-card border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-padel-green"
                    >
                      <option value="">All groups</option>
                      {[...groups].sort((a, b) => a.name.localeCompare(b.name)).map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="px-3 py-1.5 bg-dark-card border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-padel-green w-48"
                    />
                  </div>
                </div>

                <div className="bg-dark-card rounded-xl border border-gray-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                          <th className="text-left px-6 py-3">Name</th>
                          <th className="text-left px-6 py-3">Email</th>
                          <th className="text-left px-6 py-3">Phone</th>
                          <th className="text-left px-6 py-3">Group</th>
                          <th className="text-left px-6 py-3">Sport</th>
                          <th className="text-left px-6 py-3">Full seat</th>
                          <th className="text-left px-6 py-3">Reset</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center text-gray-500 py-8">No users found</td>
                          </tr>
                        )}
                        {filteredUsers.flatMap((u) => {
                          const rows = u.groups.length > 0 ? u.groups : [null];
                          return rows.map((m, i) => {
                            const key = m ? `${u.id}:${m.group.id}` : u.id;
                            const toggling = m ? togglingKey === key : false;
                            return (
                              <tr key={key} className="border-b border-gray-800/50 hover:bg-dark-elevated/40 transition-colors">
                                {/* Name — only show on first row for this user */}
                                <td className="px-6 py-3">
                                  {i === 0 && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-medium">{u.name}</span>
                                      {u.isSuperAdmin && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">super</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-gray-400">{i === 0 ? u.email : ''}</td>
                                <td className="px-6 py-3 text-gray-400">{i === 0 ? (u.phone ?? '—') : ''}</td>
                                <td className="px-6 py-3">
                                  {m ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-200">{m.group.name}</span>
                                      {m.role === 'admin' && <span className="text-xs text-padel-green">★</span>}
                                    </div>
                                  ) : (
                                    <span className="text-gray-600 text-xs">No groups</span>
                                  )}
                                </td>
                                <td className="px-6 py-3">
                                  {m && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-padel-green/20 text-padel-green border border-padel-green/30">
                                      {m.group.sportType === 'TENNIS' ? 'Tennis' : 'Padel'}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-3">
                                  {m && (
                                    <button
                                      onClick={() => handleToggleCanCreate(u.id, m.group.id, m.canCreateSessions)}
                                      disabled={toggling}
                                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                        m.canCreateSessions ? 'bg-padel-green' : 'bg-gray-700'
                                      } ${toggling ? 'opacity-50' : ''}`}
                                    >
                                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                        m.canCreateSessions ? 'translate-x-4' : 'translate-x-1'
                                      }`} />
                                    </button>
                                  )}
                                </td>
                                <td className="px-6 py-3">
                                  {i === 0 && (
                                    <button
                                      onClick={() => openResetModal(u.id, u.name)}
                                      className="text-xs px-3 py-1.5 rounded-lg bg-dark-elevated border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Reset password modal */}
            {resetModal && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <div className="bg-dark-card rounded-2xl border border-gray-800 p-6 w-full max-w-sm shadow-2xl">
                  <h3 className="text-white font-bold text-lg mb-1">Reset Password</h3>
                  <p className="text-gray-400 text-sm mb-5">Set a new password for <span className="text-white">{resetModal.name}</span></p>

                  {resetSuccess ? (
                    <div className="text-center py-4">
                      <div className="text-3xl mb-3">✓</div>
                      <p className="text-padel-green font-medium">Password updated</p>
                      <button
                        onClick={() => setResetModal(null)}
                        className="mt-4 w-full bg-dark-elevated border border-gray-700 text-white py-2 px-4 rounded-lg hover:border-gray-500 transition-all text-sm"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      {resetError && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-400 rounded-lg text-sm">
                          {resetError}
                        </div>
                      )}
                      <input
                        ref={resetInputRef}
                        type="password"
                        placeholder="New password (min 6 chars)"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                        className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-padel-green mb-4"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => setResetModal(null)}
                          className="flex-1 py-2.5 px-4 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleResetPassword}
                          disabled={resetLoading || resetPassword.length < 6}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-padel-green to-emerald-600 text-white font-medium text-sm hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                        >
                          {resetLoading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
