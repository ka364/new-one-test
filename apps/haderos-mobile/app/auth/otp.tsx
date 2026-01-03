import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { useAuth } from '../../store/auth.store';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledInput = styled(TextInput);
const StyledButton = styled(TouchableOpacity);

export default function OTPScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerify = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter a 6-digit valid OTP');
            return;
        }
        setLoading(true);

        try {
            // Mock Verification
            await new Promise(resolve => setTimeout(resolve, 800));

            // Finalize login (Phase 2: Use Real Backend)
            const mockUser = { id: 1, name: 'Hader User', email: 'verified@user.com' };
            await login('mock-jwt-token-verified', mockUser);

            router.replace('/');
        } catch (error) {
            Alert.alert('Error', 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <StyledView className="flex-1 justify-center p-6 bg-slate-900">
            <StyledText className="text-3xl font-bold text-white mb-4 text-center">
                Enter OTP
            </StyledText>
            <StyledText className="text-gray-400 mb-8 text-center">
                We sent a code to your mobile number.
            </StyledText>

            <StyledView className="space-y-4">
                <StyledInput
                    className="bg-slate-800 text-white p-4 rounded-lg border border-slate-700 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    placeholderTextColor="#64748b"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                />

                <StyledButton
                    className={`bg-green-600 p-4 rounded-lg items-center mt-6 ${loading ? 'opacity-70' : ''}`}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    <StyledText className="text-white font-bold text-lg">
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </StyledText>
                </StyledButton>
            </StyledView>
        </StyledView>
    );
}
