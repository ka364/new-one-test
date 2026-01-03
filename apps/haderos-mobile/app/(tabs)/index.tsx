import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { trpc } from '../../lib/trpc';

// Placeholder Mock Data (Fallback)
const MOCK_STREAMS = [
    { id: 1, title: 'Summer Collection Launch ☀️', viewerCount: 1205, streamerId: 'Zara Egypt', thumbnailUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop' },
    { id: 2, title: 'Flash Sale: 50% Off Shoes 👠', viewerCount: 850, streamerId: 'H&M', thumbnailUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop' },
    { id: 3, title: 'Tech Review: iPhone 15 Pro 📱', viewerCount: 3200, streamerId: 'Tech Store', thumbnailUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080&auto=format&fit=crop' },
];

export default function HomeScreen() {
    const router = useRouter();
    const { data: serverStreams, isLoading, error } = trpc.liveCommerce.listStreams.useQuery();

    // Use server streams if available, otherwise use mocks (for demo "Wow" factor)
    const displayStreams = (serverStreams && serverStreams.length > 0) ? serverStreams : MOCK_STREAMS;

    return (
        <SafeAreaView className="flex-1 bg-black">
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-900">
                <Text className="text-white text-2xl font-bold tracking-tighter">HADEROS</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/live')}>
                    <View className="bg-red-600 px-3 py-1 rounded-full">
                        <Text className="text-white font-bold text-xs">LIVE</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Feed */}
            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
                <Text className="text-white text-lg font-bold mb-4">Trending Now 🔥</Text>

                {isLoading && (
                    <View className="py-4">
                        <Text className="text-gray-500 text-center mb-4">Syncing with Live Server...</Text>
                    </View>
                )}

                {error && (
                    <View className="bg-red-900/20 p-4 rounded-xl mb-4">
                        <Text className="text-red-500">Offline Mode: Showing Demo Streams</Text>
                    </View>
                )}

                {displayStreams.map((stream: any) => (
                    <TouchableOpacity key={stream.id} className="mb-6 bg-gray-900 rounded-2xl overflow-hidden">
                        <View className="relative">
                            <Image
                                source={{ uri: stream.thumbnailUrl || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop' }}
                                className="w-full h-56"
                                resizeMode="cover"
                            />
                            <View className="absolute top-2 left-2 bg-red-600 px-2 py-1 rounded-md">
                                <Text className="text-white text-xs font-bold">LIVE</Text>
                            </View>
                            <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-md">
                                <Text className="text-white text-xs font-bold">👁️ {stream.viewerCount || 100}</Text>
                            </View>
                        </View>
                        <View className="p-4">
                            <Text className="text-white text-lg font-bold mb-1">{stream.title}</Text>
                            <View className="flex-row items-center">
                                <View className="w-6 h-6 bg-gray-700 rounded-full mr-2"></View>
                                <Text className="text-gray-400 text-sm">{typeof stream.streamerId === 'string' && isNaN(Number(stream.streamerId)) ? stream.streamerId : `Streamer #${stream.streamerId}`}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
