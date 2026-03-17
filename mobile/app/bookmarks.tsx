import React from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { PostCard } from '@/components/post-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArrowLeft, Bookmark } from 'lucide-react-native';

export default function BookmarksScreen() {
    const router = useRouter();
    const { 
        data, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading, 
        refetch, 
        isRefetching 
    } = useBookmarks();

    const posts = data?.pages.flatMap((page) => page.data) || [];

    if (isLoading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Bookmarks',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <ArrowLeft size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                }} 
            />
            
            <FlatList
                data={posts}
                renderItem={({ item }) => <PostCard post={item} />}
                keyExtractor={(item) => item.id}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} /> : null}
                ListEmptyComponent={(
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Bookmark size={48} color="#0a7ea4" />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.emptyTitle}>No bookmarks yet</ThemedText>
                        <ThemedText style={styles.emptySubtitle}>
                            When you bookmark a post, it will show up here for easy access later.
                        </ThemedText>
                    </View>
                )}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    tintColor="#0a7ea4"
                  />
                }
            />
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#0a7ea41a',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        textAlign: 'center',
        color: '#666',
        fontSize: 15,
        lineHeight: 22,
    }
});
