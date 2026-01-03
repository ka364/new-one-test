
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#000000',
                    borderTopColor: '#333333',
                },
                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#888888',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: 'Explore',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="search" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="live"
                options={{
                    title: 'Live',
                    tabBarIcon: ({ color, size }) => (
                        <View className="bg-red-600 p-2 rounded-full -mt-4 border-2 border-black">
                            <Ionicons name="videocam" size={24} color="white" />
                        </View>
                    ),
                    tabBarLabel: () => null, // Hide label for the center button
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
