import React, { useState } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useNotifications, useMarkAllRead } from '@/hooks/use-notifications';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, UserPlus, Repeat2, Bell } from 'lucide-react-native';

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'LIKE': return <Heart size={16} fill="#e11d48" color="#e11d48" />;
        case 'COMMENT': return <MessageCircle size={16} fill="#0a7ea4" color="#0a7ea4" />;
        case 'FOLLOW': return <UserPlus size={16} color="#0a7ea4" />;
        case 'REPOST': return <Repeat2 size={16} color="#10b981" />;
        default: return <Bell size={16} color="#666" />;
    }
};

export default function NotificationsScreen() {
    const insets = useSafeAreaInsets();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        refetch,
        isRefetching
    } = useNotifications();

    const { mutate: markAllRead } = useMarkAllRead();

    const notifications = data?.pages.flatMap((page) => page.data) || [];

    const renderHeader = () => (
        <ThemedView style={[styles.header, { paddingTop: insets.top }]}>
            <View style={styles.headerContent}>
                <ThemedText type="title" style={styles.headerTitle}>Notifications</ThemedText>
                <TouchableOpacity onPress={() => markAllRead()}>
                    <ThemedText style={styles.markReadText}>Mark all read</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={[styles.notificationItem, !item.isRead && styles.unreadItem]}>
            <View style={styles.notificationLeft}>
                <NotificationIcon type={item.type} />
            </View>
            <View style={styles.notificationRight}>
                <View style={styles.senderAvatarContainer}>
                    {item.sender?.avatarUrl ? (
                        <Image source={{ uri: item.sender.avatarUrl }} style={styles.senderAvatar} />
                    ) : (
                        <View style={[styles.senderAvatar, styles.avatarPlaceholder]}>
                            <ThemedText style={styles.avatarText}>{item.sender?.name?.[0] || '?'}</ThemedText>
                        </View>
                    )}
                </View>
                <View style={styles.notificationContent}>
                    <ThemedText style={styles.message}>
                        <ThemedText type="defaultSemiBold">{item.sender?.name || 'Someone'}</ThemedText>
                        {' '}{item.message}
                    </ThemedText>
                    <ThemedText style={styles.time}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </ThemedText>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            {renderHeader()}
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} /> : null}
                ListEmptyComponent={(
                    <View style={styles.emptyContainer}>
                        <ThemedText>No notifications yet</ThemedText>
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
    header: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
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
        fontWeight: 'bold',
    },
    markReadText: {
        color: '#0a7ea4',
        fontSize: 14,
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    unreadItem: {
        backgroundColor: '#f0f9ff',
    },
    notificationLeft: {
        width: 32,
        alignItems: 'center',
        paddingTop: 2,
    },
    notificationRight: {
        flex: 1,
        flexDirection: 'row',
        gap: 12,
    },
    senderAvatarContainer: {
        paddingTop: 4,
    },
    senderAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 12,
    },
    notificationContent: {
        flex: 1,
        gap: 4,
    },
    message: {
        fontSize: 15,
        lineHeight: 20,
    },
    time: {
        fontSize: 13,
        color: '#666',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    }
});
