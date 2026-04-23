import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/Avatar';
import GroupSwitcher from '../components/GroupSwitcher';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;        // 'admin' | 'member'
  canCreateSessions: boolean;
  createdAt: string;
}

interface AdminPageProps {
  onBack: () => void;
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const { token, user, setUser, switchGroup } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [updatingPermissions, setUpdatingPermissions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<{ name: string; avatarUrl?: string | null; inviteCode?: string; _count: { users: number } } | null>(null);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [confirmDeleteName, setConfirmDeleteName] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchGroupInfo();
  }, [user?.groupId]);

  const fetchGroupInfo = async () => {
    try {
      // /api/groups/me returns { groups: [...] } — find the active group
      const res = await axios.get(`${API_URL}/api/groups/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const groups: any[] = res.data.groups ?? [];
      const active = groups.find((g: any) => g.id === user?.groupId) ?? groups[0] ?? null;
      if (active) {
        setGroupInfo({
          name: active.name,
          avatarUrl: active.avatarUrl ?? null,
          inviteCode: active.inviteCode,
          // API returns _count.members (UserGroup rows) — map to expected shape
          _count: { users: active._count?.members ?? 0 },
        });
      }
    } catch (err: any) {
      console.error('fetchGroupInfo failed:', err.response?.status, err.response?.data || err.message);
    }
  };

  const handleRegenerateCode = async () => {
    setIsRegeneratingCode(true);
    try {
      const res = await axios.patch(`${API_URL}/api/groups/invite-code`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupInfo((prev) => prev ? { ...prev, inviteCode: res.data.inviteCode } : prev);
      setSuccess('Invite code regenerated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate invite code');
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  const handleRenameGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await axios.patch(`${API_URL}/api/groups/name`, { name: newGroupName.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupInfo((prev) => prev ? { ...prev, name: res.data.name } : prev);
      setIsRenamingGroup(false);
      setNewGroupName('');
      setSuccess('Group renamed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename group');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await axios.patch(`${API_URL}/api/groups/avatar`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setGroupInfo((prev) => prev ? { ...prev, avatarUrl: res.data.avatarUrl } : prev);
      // Update the group avatar in the auth store so GroupSwitcher reflects it
      if (user) {
        setUser({
          ...user,
          groups: (user.groups ?? []).map((g) =>
            g.id === user.groupId ? { ...g, avatarUrl: res.data.avatarUrl } : g
          ),
        });
      }
      setSuccess('Group avatar updated');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleDeleteGroup = async () => {
    const groupId = user?.groupId;
    if (!groupId) return;
    try {
      await axios.delete(`${API_URL}/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove the deleted group from the user's groups list
      const remainingGroups = (user?.groups ?? []).filter((g) => g.id !== groupId);

      if (remainingGroups.length > 0) {
        // Switch to the first remaining group (issues a new token)
        await switchGroup(remainingGroups[0].id);
        // switchGroup doesn't update the groups array — patch it now using fresh store state
        const freshUser = useAuthStore.getState().user;
        if (freshUser) setUser({ ...freshUser, groups: remainingGroups });
      } else {
        // No groups left — clear groupId so App.tsx shows GroupSetupPage
        if (user) {
          setUser({ ...user, groupId: null, groups: [] });
        }
      }

      onBack();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete group');
      setIsDeletingGroup(false);
    }
  };

  const handleCopyCode = () => {
    if (groupInfo?.inviteCode) {
      navigator.clipboard.writeText(groupInfo.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsResetting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/reset-user-password`,
        {
          userId: selectedUser.id,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleCanCreateSessions = async (userId: string, currentValue: boolean) => {
    setUpdatingPermissions((prev) => new Set(prev).add(userId));
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.patch(
        `${API_URL}/api/admin/users/${userId}/can-create-sessions`,
        { canCreateSessions: !currentValue },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(response.data.message);
      // Update the user in the list
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, canCreateSessions: !currentValue } : u
        )
      );
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update permission');
    } finally {
      setUpdatingPermissions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg p-4 sm:p-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="animate-spin text-6xl mb-4">↻</div>
          <p className="text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg p-2 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 border border-gray-800">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 flex items-center gap-3">
            <span className="text-4xl">🛡️</span>
            Group Admin Panel
          </h1>
          <p className="text-gray-400 mb-3">Manage users and reset passwords</p>
          <div className="flex items-center gap-3 flex-wrap">
            <GroupSwitcher
              onGroupSwitched={() => {}}
              onCreateOrJoin={() => {}}
            />
            <button
              onClick={onBack}
              className="bg-dark-elevated hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Group Invite Code */}
        {groupInfo && (
          <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 mb-6 border border-gray-800">
            {/* Group Avatar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative group/avatar">
                <Avatar src={groupInfo.avatarUrl} name={groupInfo.name} size="lg" shape="square" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="group-avatar-upload"
                />
                <label
                  htmlFor="group-avatar-upload"
                  className={`absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold ${isUploadingAvatar ? 'opacity-100' : ''}`}
                >
                  {isUploadingAvatar ? '...' : '📷'}
                </label>
              </div>
              <p className="text-xs text-gray-500">Click avatar to change</p>
            </div>

            {isRenamingGroup ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameGroup(); if (e.key === 'Escape') { setIsRenamingGroup(false); setNewGroupName(''); } }}
                  className="flex-1 px-3 py-2 bg-dark-elevated border-2 border-padel-green text-white rounded-lg focus:outline-none font-bold text-xl"
                  placeholder={groupInfo.name}
                />
                <button onClick={handleRenameGroup} className="bg-padel-green text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm">Save</button>
                <button onClick={() => { setIsRenamingGroup(false); setNewGroupName(''); }} className="bg-dark-elevated border border-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm hover:border-gray-500 transition-colors">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  🏟️ {groupInfo.name}
                </h2>
                <button onClick={() => { setIsRenamingGroup(true); setNewGroupName(groupInfo.name); }} className="text-gray-500 hover:text-gray-300 transition-colors text-sm" title="Rename group">
                  ✏️
                </button>
              </div>
            )}
            <p className="text-gray-400 text-sm mb-4">{groupInfo._count.users} member{groupInfo._count.users !== 1 ? 's' : ''}</p>
            {groupInfo.inviteCode && (
              <>
                <p className="text-sm text-gray-400 mb-2">Share this code to invite new players:</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  <div className="flex-1 bg-dark-elevated border-2 border-padel-green/40 rounded-xl px-6 py-3 text-center">
                    <span className="text-2xl font-mono font-bold tracking-widest text-padel-green">
                      {groupInfo.inviteCode}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex-1 sm:flex-none bg-padel-green text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
                    >
                      {codeCopied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={handleRegenerateCode}
                      disabled={isRegeneratingCode}
                      className="flex-1 sm:flex-none bg-dark-elevated border border-gray-700 text-gray-300 px-4 py-3 rounded-xl font-semibold hover:border-gray-500 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
                      title="Generate a new invite code (invalidates the old one)"
                    >
                      {isRegeneratingCode ? '...' : '↻ New Code'}
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setIsDeletingGroup(true)}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white py-2.5 px-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl font-medium text-sm"
              >
                Delete group
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 text-green-400 rounded-xl">
            {success}
          </div>
        )}

        {/* Users List */}
        <div className="bg-dark-card rounded-2xl shadow-2xl p-4 sm:p-8 border border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            All Users ({users.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
                  <th className="text-left py-3 pr-4">Name</th>
                  <th className="text-left py-3 pr-4">Email</th>
                  <th className="text-left py-3 pr-4">Phone</th>
                  <th className="text-left py-3 pr-4">Full seat</th>
                  <th className="text-left py-3">Reset</th>
                </tr>
              </thead>
              <tbody>
                {[...users].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })).map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-dark-elevated/40 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                        <span className="text-white font-medium">{u.name}</span>
                        {u.role === 'admin' && (
                          <span className="text-yellow-500 text-xs" title="Admin">🛡️</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{u.email}</td>
                    <td className="py-3 pr-4 text-gray-400">{u.phone ?? '—'}</td>
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={u.canCreateSessions === true}
                        onChange={() => handleToggleCanCreateSessions(u.id, u.canCreateSessions === true)}
                        disabled={updatingPermissions.has(u.id) || u.role === 'admin'}
                        title={u.canCreateSessions ? 'Full Seat Player' : 'Limited Seat Player'}
                        className="w-4 h-4 rounded border-gray-600 bg-dark-elevated text-padel-green focus:ring-2 focus:ring-padel-green focus:ring-offset-2 focus:ring-offset-dark-card cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setNewPassword('');
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-dark-elevated border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
                      >
                        Reset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Group Confirmation Modal */}
        {isDeletingGroup && groupInfo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-2xl p-6 max-w-md w-full border border-red-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Delete Group</h2>
              <p className="text-gray-400 text-sm mb-4">
                This will permanently delete <span className="text-white font-semibold">{groupInfo.name}</span> and remove all members. Events will be kept but unlinked from the group.
              </p>
              <p className="text-sm text-gray-300 mb-2">
                Type <span className="font-mono text-red-400">{groupInfo.name}</span> to confirm:
              </p>
              <input
                autoFocus
                type="text"
                value={confirmDeleteName}
                onChange={(e) => setConfirmDeleteName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
                placeholder={groupInfo.name}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteGroup}
                  disabled={confirmDeleteName !== groupInfo.name}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete Group
                </button>
                <button
                  onClick={() => { setIsDeletingGroup(false); setConfirmDeleteName(''); }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-card rounded-2xl p-6 max-w-md w-full border border-gray-800 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-4">Reset Password</h2>
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Resetting password for:</p>
                <div className="flex items-center gap-3 p-3 bg-dark-elevated rounded-lg">
                  <Avatar src={selectedUser.avatarUrl} name={selectedUser.name} size="sm" />
                  <div>
                    <p className="font-semibold text-white">{selectedUser.name}</p>
                    <p className="text-xs text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-4 py-3 bg-dark-elevated border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-padel-green focus:border-transparent"
                  disabled={isResetting}
                  minLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleResetPassword}
                  disabled={isResetting || !newPassword}
                  className="flex-1 bg-gradient-to-r from-padel-green to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-padel-green disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold"
                >
                  {isResetting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setNewPassword('');
                    setError(null);
                  }}
                  disabled={isResetting}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

