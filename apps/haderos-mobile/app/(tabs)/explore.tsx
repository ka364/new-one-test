
import { View, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black p-4">
            <Text className="text-white text-2xl font-bold mb-4">Explore</Text>
            <TextInput
                placeholder="Search for products, factories..."
                placeholderTextColor="#666"
                className="bg-gray-900 text-white p-4 rounded-xl mb-4"
            />
            <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500">Search results will appear here</Text>
            </View>
        </SafeAreaView>
    );
}
