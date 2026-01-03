import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Import global CSS for NativeWind
import "../global.css";

import { TRPCProvider } from '../lib/trpc';
import { useAuth } from '../store/auth.store';
import { useEffect } from 'react';

export default function RootLayout() {
    const { loadSession } = useAuth();

    useEffect(() => {
        loadSession();
    }, []);

    return (
        <TRPCProvider>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
            <StatusBar style="light" />
        </TRPCProvider>
    );
}
