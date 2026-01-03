import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { useAuth } from '../../store/auth.store';
import { trpc } from '../../lib/trpc';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

export default function LoginScreen() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // MOCK LOGIN for Phase 1 until Auth Router is fully Typed
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock Success
            // In real implementation: const result = await trpc.auth.login.mutate({ email, password });
            const mockUser = { id: 1, name: 'Hader User', email };
            const mockToken = 'mock-jwt-token';

            await login(mockToken, mockUser);
            router.replace('/');
        } catch (error) {
            Alert.alert('Error', 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyledView className="flex-1 justify-center p-6 bg-slate-900">
            <StyledText className="text-3xl font-bold text-white mb-8 text-center">
                Welcome Back
            </StyledText>

            <StyledView className="space-y-4">
                <StyledView>
                    <StyledText className="text-gray-400 mb-2">Email</StyledText>
                    <StyledInput
                        className="bg-slate-800 text-white p-4 rounded-lg border border-slate-700 focus:border-blue-500"
                        placeholder="name@example.com"
                        placeholderTextColor="#64748b"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </StyledView>

                <StyledView>
                    <StyledText className="text-gray-400 mb-2">Password</StyledText>
                    <StyledInput
                        className="bg-slate-800 text-white p-4 rounded-lg border border-slate-700 focus:border-blue-500"
                        placeholder="••••••••"
                        placeholderTextColor="#64748b"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </StyledView>

                <StyledButton
                    className={`bg-blue-600 p-4 rounded-lg items-center mt-6 ${loading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <StyledText className="text-white font-bold text-lg">
                        {loading ? 'Logging in...' : 'Sign In'}
                    </StyledText>
                </StyledButton>
            </StyledView>
        </StyledView>
    );
}
