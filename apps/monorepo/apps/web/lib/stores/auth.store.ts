import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date | string;
  token: string;
  activeOrganizationId?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  organizations: Organization[];
  isAuthenticated: boolean;
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: User, session: Session, organizations?: Organization[]) => void;
  clearAuth: () => void;
  updateSession: (session: Session) => void;
  switchOrganization: (organizationId: string) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      organizations: [],
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, session, organizations = []) =>
        set({
          user,
          session,
          organizations,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          session: null,
          organizations: [],
          isAuthenticated: false,
        }),

      updateSession: (session) =>
        set((state) => ({
          ...state,
          session,
        })),

      switchOrganization: (organizationId) =>
        set((state) => ({
          ...state,
          session: state.session
            ? { ...state.session, activeOrganizationId: organizationId }
            : null,
        })),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        organizations: state.organizations,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
