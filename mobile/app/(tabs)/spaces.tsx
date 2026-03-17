import React, { useState } from 'react';
import { 
    StyleSheet, 
    FlatList, 
    View, 
    TouchableOpacity, 
    ActivityIndicator, 
    RefreshControl,
    Image,
    TextInput,
    Alert
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SpaceService } from '@/services/space-service';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Users, Plus, Radio, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SpacesScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const { data, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['spaces'],
        queryFn: () => SpaceService.getActiveRooms()
    });

    const createSpaceMutation = useMutation({
        mutationFn: (title: string) => SpaceService.createRoom(title),
        onSuccess: (room) => {
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
            setIsCreating(false);
            setNewTitle('');
            router.push(`/spaces/${room.id}`);
        },
        onError: (error: any) => {
            Alert.alert('Error', error.message || 'Failed to create space');
        }
    });

    const handleCreateSpace = () => {
        if (!newTitle.trim()) return;
        createSpaceMutation.mutate(newTitle.trim());
    };

    const renderSpaceItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.spaceCard, { backgroundColor: '#16181c', borderColor: theme.border }]}
            onPress={() => router.push(`/spaces/${item.id}`)}
        >
            <View style={styles.liveIndicator}>
                <View style={[styles.pulseDot, { backgroundColor: theme.tint }]} />
                <ThemedText style={[styles.liveText, { color: theme.tint }]}>LIVE NOW</ThemedText>
            </View>

            <ThemedText style={styles.spaceTitle}>{item.title}</ThemedText>

            <View style={styles.spaceFooter}>
                <View style={styles.hostInfo}>
                    <Image 
                        source={{ uri: item.host.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${item.host.username}` }} 
                        style={[styles.hostAvatar, { borderColor: theme.border }]} 
                    />
                    <View>
                        <ThemedText style={styles.hostName}>{item.host.name}</ThemedText>
                        <ThemedText style={styles.hostLabel}>is hosting</ThemedText>
                    </View>
                </View>

                <View style={styles.stats}>
                    <Users size={16} color={theme.tint} />
                    <ThemedText style={[styles.statsText, { color: theme.tint }]}>Join</ThemedText>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <ThemedText type="title" style={styles.headerTitle}>Spaces</ThemedText>
                <ThemedText style={styles.subtitle}>Happening now across DevAtlas</ThemedText>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <Search size={20} color="#71767b" style={styles.searchIcon} />
                <TextInput 
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search active Spaces..."
                    placeholderTextColor="#71767b"
                />
            </View>

            {isCreating ? (
                <View style={[styles.createForm, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TextInput 
                        style={[styles.createInput, { color: theme.text }]}
                        placeholder="What's your Space about?"
                        placeholderTextColor="#71767b"
                        value={newTitle}
                        onChangeText={setNewTitle}
                        autoFocus
                    />
                    <View style={styles.createActions}>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsCreating(false)}>
                            <ThemedText style={{ color: theme.text }}>Cancel</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.startButton, { backgroundColor: theme.text }]} 
                            onPress={handleCreateSpace}
                            disabled={createSpaceMutation.isPending || !newTitle.trim()}
                        >
                            {createSpaceMutation.isPending ? (
                                <ActivityIndicator size="small" color={theme.background} />
                            ) : (
                                <ThemedText style={[styles.startButtonText, { color: theme.background }]}>Start Now</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <FlatList
                data={data?.rooms || []}
                renderItem={renderSpaceItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.tint} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Radio size={48} color="#71767b" />
                            <ThemedText style={styles.emptyText}>No active spaces found.</ThemedText>
                            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.tint }]} onPress={() => setIsCreating(true)}>
                                <ThemedText style={styles.emptyButtonText}>Start a Space</ThemedText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.centerLoader}>
                            <ActivityIndicator size="large" color={theme.tint} />
                        </View>
                    )
                }
            />

            {!isCreating && (
                <TouchableOpacity 
                    style={[styles.fab, { bottom: 20 + insets.bottom, backgroundColor: theme.tint }]}
                    onPress={() => setIsCreating(true)}
                >
                    <Plus size={24} color="#fff" />
                    <ThemedText style={styles.fabText}>Start a Space</ThemedText>
                </TouchableOpacity>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
    },
    subtitle: {
        color: '#71767b',
        marginTop: 4,
        fontSize: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        borderRadius: 25,
        paddingHorizontal: 15,
        marginBottom: 20,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 16,
    },
    createForm: {
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    createInput: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    createActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 15,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    startButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 25,
        minWidth: 110,
        alignItems: 'center',
    },
    startButtonText: {
        fontWeight: '800',
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    spaceCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1d9bf011',
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 12,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    liveText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    spaceTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 20,
    },
    spaceFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    hostAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
    },
    hostName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    hostLabel: {
        color: '#71767b',
        fontSize: 13,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsText: {
        fontSize: 15,
        fontWeight: '700',
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        color: '#71767b',
        marginTop: 15,
        marginBottom: 25,
        fontSize: 15,
    },
    emptyButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    centerLoader: {
        padding: 60,
    },
    fab: {
        position: 'absolute',
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderRadius: 30,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    },
    fabText: {
        color: '#fff',
        fontWeight: '800',
        marginLeft: 10,
        fontSize: 16,
    },
});
