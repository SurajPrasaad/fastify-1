import React from 'react';
import { StyleSheet } from 'react-native';
import { ProfileView } from '@/components/profile-view';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/store/auth-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';

export default function CurrentUserProfileScreen() {
    const { user } = useAuthStore();
    const insets = useSafeAreaInsets();

    if (!user) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <ThemedText>Please log in to view your profile</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ProfileView username={user.username} />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
