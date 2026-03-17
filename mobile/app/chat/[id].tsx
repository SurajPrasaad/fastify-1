import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
    StyleSheet, 
    View, 
    FlatList, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform, 
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useChatHistory, useMarkChatAsRead } from '@/hooks/use-chat';
import { useChatSocket } from '@/hooks/use-chat-socket';
import { useAuthStore } from '@/store/auth-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArrowLeft, Send, Image as ImageIcon, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

export default function ChatRoomScreen() {
    const { id: roomId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user: currentUser } = useAuthStore();
    const [message, setMessage] = useState('');
    
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useChatHistory(roomId!);

    const { sendMessage, sendTyping, isConnected } = useChatSocket(roomId);
    const { mutate: markAsRead } = useMarkChatAsRead();

    const messages = data?.pages.flatMap((page) => page.data) || [];

    useEffect(() => {
        if (roomId) {
            markAsRead(roomId);
        }
    }, [roomId, markAsRead]);

    const handleSend = () => {
        if (!message.trim()) return;
        sendMessage(message.trim());
        setMessage('');
    };

    const renderMessage = ({ item, index }: { item: any, index: number }) => {
        const isMine = item.senderId === currentUser?.id;
        const showAvatar = !isMine && (index === 0 || messages[index - 1].senderId !== item.senderId);

        return (
            <View style={[styles.messageContainer, isMine ? styles.myMessageContainer : styles.theirMessageContainer]}>
                {!isMine && (
                    <View style={styles.avatarPlaceholderContainer}>
                        {showAvatar ? (
                           item.sender?.avatarUrl ? (
                               <Image source={{ uri: item.sender.avatarUrl }} style={styles.senderAvatar} />
                           ) : (
                               <View style={[styles.senderAvatar, styles.senderAvatarPlaceholder]}>
                                   <ThemedText style={styles.avatarText}>{item.sender?.name?.[0]}</ThemedText>
                               </View>
                           )
                        ) : <View style={styles.senderAvatar} />}
                    </View>
                )}
                <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                    <ThemedText style={[styles.messageText, isMine ? styles.myMessageText : styles.theirMessageText]}>
                        {item.content}
                    </ThemedText>
                    <ThemedText style={[styles.timestamp, isMine ? styles.myTimestamp : styles.theirTimestamp]}>
                        {format(new Date(item.createdAt), 'HH:mm')}
                    </ThemedText>
                </View>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Chat',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <ArrowLeft size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                    headerShadowVisible: false,
                }} 
            />

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                inverted
                onEndReached={() => hasNextPage && fetchNextPage()}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 10 }} /> : null}
                contentContainerStyle={styles.messagesList}
            />

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Plus size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            value={message}
                            onChangeText={(text) => {
                                setMessage(text);
                                sendTyping(text.length > 0);
                            }}
                            multiline
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.sendButton, !message.trim() && styles.disabledSend]} 
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Send size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    messagesList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    messageContainer: {
        flexDirection: 'row',
        marginVertical: 4,
        maxWidth: '80%',
    },
    myMessageContainer: {
        alignSelf: 'flex-end',
    },
    theirMessageContainer: {
        alignSelf: 'flex-start',
    },
    avatarPlaceholderContainer: {
        marginRight: 8,
        justifyContent: 'flex-end',
    },
    senderAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    senderAvatarPlaceholder: {
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    bubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#0a7ea4',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#f0f0f0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#000',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: '#888',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 8,
        backgroundColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#ddd',
    },
    actionButton: {
        padding: 8,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 8,
    },
    input: {
        fontSize: 16,
        maxHeight: 100,
        color: '#000',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#0a7ea4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledSend: {
        backgroundColor: '#ccc',
    },
});
