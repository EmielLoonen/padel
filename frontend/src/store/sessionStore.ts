import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Court {
  id: string;
  courtNumber: number;
  startTime: string;
  duration: number;
  maxPlayers: number;
  cost?: number;
  rsvps?: Array<{
    id: string;
    status: 'yes' | 'no' | 'maybe';
    user: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  guests?: Array<{
    id: string;
    name: string;
    addedBy: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  availableSpots?: number;
  isFull?: boolean;
}

interface Session {
  id: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress?: string;
  totalCost?: number;
  notes?: string;
  numberOfCourts: number;
  creator: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  courts?: Court[];
  rsvps?: Array<{
    id: string;
    status: 'yes' | 'no' | 'maybe';
    courtId?: string | null;
    user: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  guests?: Array<{
    id: string;
    name: string;
    status: 'yes' | 'no' | 'maybe';
    addedBy: {
      id: string;
      name: string;
    };
  }>;
  rsvpSummary?: {
    yes: number;
    no: number;
    maybe: number;
    noResponse: number;
  };
  createdAt: string;
}

interface CourtInput {
  courtNumber: number;
  startTime: string;
  duration?: number;
  cost?: number;
}

interface CreateSessionData {
  date: string;
  time: string;
  venueName: string;
  venueAddress?: string;
  totalCost?: number;
  notes?: string;
  courts: CourtInput[];
}

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  isLoading: boolean;
  error: string | null;
  fetchSessions: (type?: 'upcoming' | 'past' | 'all') => Promise<void>;
  fetchSessionById: (id: string) => Promise<void>;
  createSession: (data: CreateSessionData) => Promise<Session>;
  updateSession: (id: string, data: Partial<CreateSessionData>) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async (type = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sessions?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ sessions: response.data.sessions, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch sessions';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchSessionById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({ currentSession: response.data.session, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch session';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createSession: async (data: CreateSessionData) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/sessions`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newSession = response.data.session;
      
      // Add to sessions list
      set((state) => ({
        sessions: [...state.sessions, newSession],
        isLoading: false,
      }));

      return newSession;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create session';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateSession: async (id: string, data: Partial<CreateSessionData>) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/sessions/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedSession = response.data.session;

      // Update in sessions list
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updatedSession : s)),
        currentSession: state.currentSession?.id === id ? updatedSession : state.currentSession,
        isLoading: false,
      }));

      return updatedSession;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update session';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Remove from sessions list
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession,
        isLoading: false,
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete session';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

// RSVP Store
interface RSVP {
  id: string;
  sessionId: string;
  userId: string;
  status: 'yes' | 'no' | 'maybe';
  courtId?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface RSVPState {
  rsvps: RSVP[];
  rsvpSummary: { yes: number; no: number; maybe: number } | null;
  courtsInfo: Court[] | null;
  isLoadingRSVP: boolean;
  fetchRSVPs: (sessionId: string) => Promise<void>;
  createOrUpdateRSVP: (sessionId: string, status: 'yes' | 'no' | 'maybe', courtId?: string | null) => Promise<void>;
}

// Export types for components
export type { Session, Court, CourtInput, CreateSessionData, RSVP };

export const useRSVPStore = create<RSVPState>((set) => ({
  rsvps: [],
  rsvpSummary: null,
  courtsInfo: null,
  isLoadingRSVP: false,

  fetchRSVPs: async (sessionId: string) => {
    set({ isLoadingRSVP: true });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/rsvps/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        rsvps: response.data.rsvps,
        rsvpSummary: response.data.summary,
        courtsInfo: response.data.courtsInfo,
        isLoadingRSVP: false,
      });
    } catch (error) {
      console.error('Failed to fetch RSVPs:', error);
      set({ isLoadingRSVP: false });
    }
  },

  createOrUpdateRSVP: async (sessionId: string, status: 'yes' | 'no' | 'maybe', courtId?: string | null) => {
    set({ isLoadingRSVP: true });
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/rsvps/session/${sessionId}`,
        { status, courtId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh RSVPs after update
      const response = await axios.get(`${API_URL}/api/rsvps/session/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      set({
        rsvps: response.data.rsvps,
        rsvpSummary: response.data.summary,
        courtsInfo: response.data.courtsInfo,
        isLoadingRSVP: false,
      });
    } catch (error) {
      console.error('Failed to update RSVP:', error);
      set({ isLoadingRSVP: false });
      throw error;
    }
  },
}));

