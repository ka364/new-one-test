
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../store/auth.store';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView className="flex-1 bg-black p-4">
            <View className="items-center mt-8">
                <View className="w-24 h-24 bg-gray-800 rounded-full justify-center items-center mb-4">
                    <Text className="text-3xl text-white font-bold">{user?.name ? user.name[0] : 'U'}</Text>
                </View>
                <Text className="text-white text-xl font-bold">{user?.name || 'Guest User'}</Text>
                <Text className="text-gray-500">{user?.email || 'Please login to see details'}</Text>
            </View>

            <View className="mt-12 space-y-4">
                {!user ? (
                    <TouchableOpacity
                        className="bg-blue-600 p-4 rounded-xl items-center"
                        onPress={() => router.push('/auth/login')}
                    >
                        <Text className="text-white font-bold">Login / Register</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        className="bg-red-600 p-4 rounded-xl items-center"
                        onPress={handleLogout}
                    >
                        <Text className="text-white font-bold">Logout</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
