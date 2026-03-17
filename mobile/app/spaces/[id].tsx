import React, { useEffect, useState } from 'react';
import { 
    StyleSheet, 
    View, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SpaceService } from '@/services/space-service';
import { useAudioRoomStore } from '@/store/audio-room-store';
import { useRoomSocket } from '@/hooks/use-room-socket';
import { useAudioEngine } from '@/hooks/use-audio-engine';
import { useAuthStore } from '@/store/auth-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { 
    Mic, 
    MicOff, 
    Users, 
    Hand, 
    LogOut, 
    MoreHorizontal,
    X,
    ShieldAlert
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function AudioRoomScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user: me } = useAuthStore();
    
    const {
        title,
        hostId,
        speakers,
        listeners,
        raisedHands,
        setRoomData,
        myRole,
        isMuted,
        setMuted,
        clearRoom
    } = useAudioRoomStore();

    // 1. Fetch Room Data
    const { data: roomInfo, isLoading } = useQuery({
        queryKey: ['room', id],
        queryFn: () => SpaceService.getRoom(id as string),
        enabled: !!id
    });

    // 2. Setup Socket & Audio Engine
    const socket = useRoomSocket(id as string);
    const { localStream } = useAudioEngine({ roomId: id as string, socket });

    useEffect(() => {
        if (roomInfo) {
            setRoomData({
                id: roomInfo.id,
                title: roomInfo.title,
                hostId: roomInfo.hostId
            });
        }
    }, [roomInfo]);

    useEffect(() => {
        return () => clearRoom();
    }, []);

    const toggleMute = () => {
        setMuted(!isMuted);
        socket.send('audio_room:speaking', { roomId: id, isSpeaking: isMuted });
    };

    const handleLeave = () => {
        router.back();
    };

    const handleRaiseHand = () => {
        SpaceService.raiseHand(id as string);
    };

    if (isLoading) {
        return (
            <ThemedView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
            </ThemedView>
        );
    }

    const speakersList = Array.from(speakers.values());
    const listenersList = Array.from(listeners.values());

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Space',
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleLeave} style={styles.headerButton}>
                            <X size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity style={styles.headerButton}>
                            <MoreHorizontal size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                }} 
            />

            <View style={styles.roomHeader}>
                <ThemedText style={styles.roomTitle}>{title}</ThemedText>
                <View style={styles.roomStats}>
                    <View style={styles.liveBadge}>
                        <View style={styles.pulseDot} />
                        <ThemedText style={styles.liveText}>LIVE</ThemedText>
                    </View>
                    <View style={styles.listenerCount}>
                        <Users size={16} color="#666" />
                        <ThemedText style={styles.statsText}>{speakersList.length + listenersList.length} listening</ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>STAGE</ThemedText>
                    <View style={styles.speakersGrid}>
                        {speakersList.map((speaker) => (
                            <View key={speaker.id} style={styles.speakerItem}>
                                <View style={[
                                    styles.avatarWrapper,
                                    speaker.isSpeaking && styles.speakingRing
                                ]}>
                                    <Image 
                                        source={{ uri: speaker.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${speaker.username}` }} 
                                        style={styles.speakerAvatar} 
                                    />
                                    <View style={styles.micStatus}>
                                        {speaker.isMuted ? (
                                            <MicOff size={12} color="#ff4444" />
                                        ) : (
                                            <Mic size={12} color="#0a7ea4" />
                                        )}
                                    </View>
                                </View>
                                <ThemedText style={styles.speakerName} numberOfLines={1}>{speaker.name}</ThemedText>
                                <View style={[styles.roleBadge, speaker.id === hostId ? styles.hostBadge : styles.speakerBadge]}>
                                    <ThemedText style={styles.roleText}>{speaker.id === hostId ? 'Host' : 'Speaker'}</ThemedText>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>AUDIENCE ({listenersList.length})</ThemedText>
                    <View style={styles.listenersGrid}>
                        {listenersList.map((listener) => (
                            <View key={listener.id} style={styles.listenerItem}>
                                <Image 
                                    source={{ uri: listener.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${listener.username}` }} 
                                    style={styles.listenerAvatar} 
                                />
                                <ThemedText style={styles.listenerName} numberOfLines={1}>
                                    {listener.name.split(' ')[0]}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <Animated.View 
                entering={SlideInDown}
                style={[styles.controls, { paddingBottom: insets.bottom + 10 }]}
            >
                <View style={styles.controlsContent}>
                    <View style={styles.micSection}>
                        {(myRole === 'HOST' || myRole === 'SPEAKER') ? (
                            <TouchableOpacity 
                                style={[styles.micButton, isMuted && styles.micButtonMuted]} 
                                onPress={toggleMute}
                            >
                                {isMuted ? <MicOff size={28} color="#fff" /> : <Mic size={28} color="#fff" />}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.handButton, raisedHands.includes(me?.id || '') && styles.handButtonActive]}
                                onPress={handleRaiseHand}
                            >
                                <Hand size={24} color={raisedHands.includes(me?.id || '') ? "#fff" : "#666"} />
                            </TouchableOpacity>
                        )}
                        <View>
                            <ThemedText style={styles.roleStatus}>
                                {myRole === 'HOST' ? 'You are hosting' : myRole === 'SPEAKER' ? 'You are speaking' : 'You are listening'}
                            </ThemedText>
                            <ThemedText style={styles.connectionStatus}>
                                {isMuted ? 'Microphone muted' : 'Connected to studio'}
                            </ThemedText>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
                        <ThemedText style={styles.leaveText}>Leave</ThemedText>
                    </TouchableOpacity>
                </View>
            </Animated.View>
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
    },
    headerButton: {
        padding: 10,
    },
    roomHeader: {
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    roomTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    roomStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ff4444',
    },
    liveText: {
        color: '#ff4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listenerCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsText: {
        color: '#666',
        fontSize: 14,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 120,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#888',
        letterSpacing: 1,
        marginBottom: 20,
    },
    speakersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    speakerItem: {
        width: (width - 80) / 3,
        alignItems: 'center',
    },
    avatarWrapper: {
        position: 'relative',
        padding: 4,
        borderRadius: 40,
    },
    speakingRing: {
        borderWidth: 2,
        borderColor: '#0a7ea4',
    },
    speakerAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#eee',
    },
        micStatus: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 4,
        elevation: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    },
    speakerName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
        textAlign: 'center',
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    hostBadge: {
        backgroundColor: 'rgba(10, 126, 164, 0.1)',
    },
    speakerBadge: {
        backgroundColor: '#f5f5f5',
    },
    roleText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0a7ea4',
    },
    listenersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
    },
    listenerItem: {
        alignItems: 'center',
        width: (width - 100) / 5,
    },
    listenerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#eee',
    },
    listenerName: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee',
        padding: 20,
    },
    controlsContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    micSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    micButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButtonMuted: {
        backgroundColor: '#ff4444',
    },
    handButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    handButtonActive: {
        backgroundColor: '#0a7ea4',
    },
    roleStatus: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    connectionStatus: {
        fontSize: 12,
        color: '#666',
    },
    leaveButton: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    leaveText: {
        color: '#ff4444',
        fontWeight: 'bold',
    },
});
