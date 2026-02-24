import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    token: string | null;
}

interface AuthActions {
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
    devtools(
        persist(
            (set) => ({
                user: null,
                isAuthenticated: false,
                token: null,

                setUser: (user) => set({ user, isAuthenticated: !!user }),
                setToken: (token) => set({ token }),
                logout: () => set({ user: null, isAuthenticated: false, token: null }),
            }),
            {
                name: 'auth-storage',
            }
        )
    )
);
