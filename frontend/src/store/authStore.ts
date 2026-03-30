import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface UserGroup {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: 'admin' | 'member';
  canCreateSessions: boolean;
}

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  canCreateSessions?: boolean;
  groupId?: string | null;
  groups?: UserGroup[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
  initializeAuth: () => void;
  switchGroup: (groupId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { user, token, previousLastLogin } = response.data;
      localStorage.setItem('token', token);

      if (previousLastLogin) {
        localStorage.setItem('previousLastLogin', previousLastLogin);
      }

      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  signup: async (email: string, password: string, name: string, phone?: string, inviteCode?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, {
        email,
        password,
        name,
        phone,
        ...(inviteCode ? { inviteCode } : {}),
      });

      const { user, token } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Signup failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },

  switchGroup: async (groupId: string) => {
    const token = get().token;
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/switch-group`,
        { groupId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { token: newToken, isAdmin, canCreateSessions } = response.data;
      localStorage.setItem('token', newToken);

      set((state) => ({
        token: newToken,
        user: state.user
          ? {
              ...state.user,
              groupId,
              isAdmin,
              canCreateSessions,
            }
          : null,
      }));
    } catch (error: any) {
      console.error('Switch group failed:', error);
      throw new Error(error.response?.data?.error || 'Failed to switch group');
    }
  },

  initializeAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // /api/auth/me returns raw user — merge with group data from token
      // The token already carries groupId; we need to reconstruct isAdmin/canCreateSessions
      // from the groups list. We'll rely on the token's embedded groupId.
      const rawUser = response.data.user;
      const groups: UserGroup[] = (rawUser.groups || []).map((ug: any) => ({
        id: ug.group.id,
        name: ug.group.name,
        avatarUrl: ug.group.avatarUrl ?? null,
        role: ug.role,
        canCreateSessions: ug.canCreateSessions,
      }));

      // Re-fetch a fresh token to get correct isAdmin/canCreateSessions for current group
      // Instead, decode the existing token's groupId and find the matching group
      let activeGroupId: string | null = null;
      let isAdmin = false;
      let canCreateSessions = false;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        activeGroupId = payload.groupId ?? null;
      } catch {}

      // If token has no groupId but user already has memberships, auto-select the first group
      if (!activeGroupId && groups.length > 0) {
        activeGroupId = groups[0].id;
      }

      const activeGroup = groups.find((g) => g.id === activeGroupId);
      if (activeGroup) {
        isAdmin = activeGroup.role === 'admin';
        canCreateSessions = activeGroup.canCreateSessions;
      }

      set({
        user: {
          ...rawUser,
          groupId: activeGroupId,
          isAdmin,
          canCreateSessions,
          groups,
        },
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
