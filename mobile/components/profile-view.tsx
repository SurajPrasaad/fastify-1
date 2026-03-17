import React from 'react';
import { StyleSheet, View, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '@/hooks/use-user';
import { useInfiniteFeed } from '@/hooks/use-infinite-feed';
import { ProfileHeader } from '@/components/profile-header';
import { PostCard } from '@/components/post-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface ProfileViewProps {
    username: string;
}

export function ProfileView({ username }: ProfileViewProps) {
    const router = useRouter();
    const { data: profile, isLoading: isProfileLoading, error } = useProfile(username);

    const {
        data: feedData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: isFeedLoading,
    } = useInfiniteFeed('hashtag', username); 

    if (isProfileLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
            </View>
        );
    }

    if (error || !profile) {
        return (
            <View style={styles.centerContainer}>
                <ThemedText>Profile not found</ThemedText>
                <TouchableOpacity onPress={() => router.back()}>
                    <ThemedText style={styles.link}>Go Back</ThemedText>
                </TouchableOpacity>
            </View>
        );
    }

    const posts = feedData?.pages.flatMap((page) => page.data) || [];

    const adaptedProfile = {
        id: profile.id,
        username: profile.username,
        displayName: profile.name,
        bio: profile.bio || "",
        location: profile.profile.techStack?.[0] || "",
        website: "", 
        joinDate: new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        followers: profile.profile.followersCount,
        following: profile.profile.followingCount,
        posts: profile.profile.postsCount || 0,
        isVerified: profile.auth.status === "ACTIVE",
        avatarUrl: profile.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${profile.username}`,
        coverUrl: "", 
        isFollowing: profile.isFollowing,
        isSelf: profile.isSelf,
        techStack: profile.profile.techStack || [],
    };

    return (
        <ThemedView style={styles.container}>
            <FlatList
                ListHeaderComponent={<ProfileHeader profile={adaptedProfile as any} />}
                data={posts}
                renderItem={({ item }) => <PostCard post={item} />}
                keyExtractor={(item) => item.id}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color="#0a7ea4" /> : null}
                ListEmptyComponent={!isFeedLoading ? (
                    <View style={styles.emptyContainer}>
                        <ThemedText>No posts yet</ThemedText>
                    </View>
                ) : null}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    link: {
        color: '#0a7ea4',
        fontWeight: 'bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    }
});
