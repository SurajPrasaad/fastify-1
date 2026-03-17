import React from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useConversations } from '@/hooks/use-chat';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { formatDistanceToNow } from 'date-fns';
import { Edit3, Search, Settings } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ConversationsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user: currentUser } = useAuthStore();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
        isRefetching
    } = useConversations();

    const conversations = data?.pages.flatMap((page) => page.data) || [];

    const renderItem = ({ item }: { item: any }) => {
        const otherParticipant = item.participants.find((p: any) => p.id !== currentUser?.id);
        const displayName = item.isGroup ? item.name : (otherParticipant?.name || 'Unknown');
        const avatarUrl = item.isGroup ? null : otherParticipant?.avatarUrl;

        return (
            <TouchableOpacity 
                style={[styles.conversationItem, { borderBottomColor: theme.border }]}
                onPress={() => router.push(`/chat/${item.id}`)}
            >
                <View style={styles.avatarContainer}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.card }]}>
                            <ThemedText style={styles.avatarText}>{displayName?.[0] || '?'}</ThemedText>
                        </View>
                    )}
                    {!item.isGroup && otherParticipant?.isOnline && (
                        <View style={[styles.onlineBadge, { borderColor: theme.background }]} />
                    )}
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.titleRow}>
                        <ThemedText type="defaultSemiBold" style={styles.displayName} numberOfLines={1}>
                            {displayName}
                        </ThemedText>
                        {item.lastMessage && (
                            <ThemedText style={styles.time} numberOfLines={1}>
                                {formatDistanceToNow(new Date(item.lastMessage.createdAt), { addSuffix: false })}
                            </ThemedText>
                        )}
                    </View>
                    <View style={styles.lastMessageRow}>
                        <ThemedText 
                            style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} 
                            numberOfLines={1}
                        >
                            {item.lastMessage ? item.lastMessage.content : 'No messages yet'}
                        </ThemedText>
                        {item.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: theme.tint }]}>
                                <ThemedText style={styles.unreadCountText}>{item.unreadCount}</ThemedText>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.border }]}>
                <View style={styles.headerContent}>
                    <ThemedText type="title" style={styles.headerTitle}>Messages</ThemedText>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity style={styles.iconButton}>
                            <Settings size={22} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Edit3 size={22} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                    <Search size={18} color="#71767b" />
                    <ThemedText style={styles.searchPlaceholder}>Search Direct Messages</ThemedText>
                </View>
            </View>

            <FlatList
                data={conversations}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? (
                    <View style={{ padding: 20 }}>
                        <ActivityIndicator color={theme.tint} />
                    </View>
                ) : null}
                ListEmptyComponent={isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={theme.tint} />
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <ThemedText style={{ color: '#71767b' }}>No conversations yet</ThemedText>
                    </View>
                )}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefetching}
                    onRefresh={refetch}
                    tintColor={theme.tint}
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
    header: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingBottom: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 16,
    },
    iconButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        height: 40,
        borderRadius: 20,
        gap: 12,
    },
    searchPlaceholder: {
        color: '#71767b',
        fontSize: 15,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        gap: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
    },
    contentContainer: {
        flex: 1,
        gap: 2,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    displayName: {
        fontSize: 16,
        fontWeight: '700',
        maxWidth: '70%',
    },
    time: {
        fontSize: 14,
        color: '#71767b',
    },
    lastMessageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 15,
        color: '#71767b',
        maxWidth: '85%',
    },
    unreadMessage: {
        color: undefined,
        fontWeight: '700',
    },
    unreadBadge: {
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadCountText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    centerContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    }
});
