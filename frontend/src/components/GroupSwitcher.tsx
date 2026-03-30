import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Avatar from './Avatar';

interface GroupSwitcherProps {
  onGroupSwitched: () => void;
  onCreateOrJoin: () => void;
}

export default function GroupSwitcher({ onGroupSwitched, onCreateOrJoin }: GroupSwitcherProps) {
  const { user, switchGroup } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const groups = user?.groups ?? [];
  const activeGroupId = user?.groupId;
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  if (groups.length === 0) return null;

  const handleSwitch = async (groupId: string) => {
    if (groupId === activeGroupId || isSwitching) return;
    setIsSwitching(true);
    setIsOpen(false);
    try {
      await switchGroup(groupId);
      onGroupSwitched();
    } catch (err) {
      console.error('Failed to switch group:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        disabled={isSwitching}
        className="w-full sm:w-auto flex items-center gap-2 bg-dark-elevated border border-gray-700 hover:border-padel-green text-white px-3 py-2 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
        title="Switch group"
      >
        <Avatar src={activeGroup?.avatarUrl} name={activeGroup?.name ?? ''} size="xs" shape="square" />
        <span className="flex-1 sm:flex-none text-left">
          {isSwitching ? 'Switching…' : (activeGroup?.name ?? 'Select group')}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Your Groups</p>
            </div>

            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => handleSwitch(g.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-dark-elevated transition-colors ${
                  g.id === activeGroupId ? 'text-padel-green' : 'text-white'
                }`}
              >
                <Avatar src={g.avatarUrl} name={g.name} size="xs" shape="square" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{g.role}</p>
                </div>
                {g.id === activeGroupId && <span className="text-padel-green text-sm">✓</span>}
              </button>
            ))}

            <div className="border-t border-gray-700">
              <button
                onClick={() => { setIsOpen(false); onCreateOrJoin(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-dark-elevated transition-colors text-gray-400 hover:text-white"
              >
                <span className="text-base">+</span>
                <span className="text-sm font-medium">Create or Join Group</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
