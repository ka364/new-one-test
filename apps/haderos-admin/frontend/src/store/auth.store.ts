import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    role: 'user' | 'admin' | 'super_admin';
}

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    setAuth: (state: Partial<AuthState>) => void;
    logout: () => void;
    loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,

            setAuth: (state) =>
                set((prevState) => ({
                    ...prevState,
                    ...state,
                    isAuthenticated: !!state.accessToken || prevState.isAuthenticated,
                })),

            logout: () =>
                set({
                    isAuthenticated: false,
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                }),

            loadFromStorage: () => {
                const token = localStorage.getItem('access_token');
                const user = localStorage.getItem('user');
                const refreshToken = localStorage.getItem('refresh_token');

                if (token && user) {
                    try {
                        set({
                            accessToken: token,
                            user: JSON.parse(user),
                            refreshToken: refreshToken,
                            isAuthenticated: true,
                        });
                    } catch (error) {
                        console.error('Failed to parse stored user:', error);
                    }
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
