import { create } from 'zustand';
import { Session, SessionState } from '../types';

interface SessionStore extends SessionState {
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  startSession: (userId: string, exercises: any[]) => void;
  endSession: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  sessions: [],
  loading: false,
  error: null,
  setCurrentSession: (session: Session | null) => set({ currentSession: session }),
  setSessions: (sessions: Session[]) => set({ sessions }),
  addSession: (session: Session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),
  updateSession: (id: string, updates: Partial<Session>) =>
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      ),
      currentSession: state.currentSession?.id === id
        ? { ...state.currentSession, ...updates }
        : state.currentSession,
    })),
  deleteSession: (id: string) =>
    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession,
    })),
  startSession: (userId: string, exercises: any[]) => {
    const newSession: Session = {
      id: Date.now().toString(),
      userId,
      exercises,
      startTime: new Date(),
      completed: false,
    };
    set({ currentSession: newSession });
  },
  endSession: (id: string) =>
    set((state) => {
      if (state.currentSession?.id === id) {
        const endedSession = { ...state.currentSession, endTime: new Date(), completed: true };
        return {
          currentSession: null,
          sessions: [...state.sessions, endedSession],
        };
      }
      return state;
    }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
}));