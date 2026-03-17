import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ProfileView } from '@/components/profile-view';
import { ThemedView } from '@/components/themed-view';
import { ArrowLeft, MoreHorizontal } from 'lucide-react-native';

export default function ProfileScreen() {
    const { username } = useLocalSearchParams<{ username: string }>();
    const router = useRouter();

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: username ? `@${username}` : 'Profile',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <ArrowLeft size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity style={styles.headerButton}>
                            <MoreHorizontal size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                }} 
            />
            <ProfileView username={username!} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerButton: {
        padding: 8,
    },
});
