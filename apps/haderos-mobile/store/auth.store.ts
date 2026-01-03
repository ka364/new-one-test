import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
    token: string | null;
    user: { id: number; name: string; email: string } | null;
    isLoading: boolean;
    login: (token: string, user: any) => Promise<void>;
    logout: () => Promise<void>;
    loadSession: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    token: null,
    user: null,
    isLoading: true,

    login: async (token, user) => {
        await SecureStore.setItemAsync('auth_token', token);
        // In a real app we might store user info too or fetch it
        await SecureStore.setItemAsync('user_info', JSON.stringify(user));
        set({ token, user });
    },

    logout: async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('user_info');
        set({ token: null, user: null });
    },

    loadSession: async () => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            const userInfo = await SecureStore.getItemAsync('user_info');
            if (token && userInfo) {
                set({ token, user: JSON.parse(userInfo) });
            }
        } catch (e) {
            console.error('Failed to load session', e);
        } finally {
            set({ isLoading: false });
        }
    },
}));
