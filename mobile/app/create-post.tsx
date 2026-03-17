import React, { useState, useRef } from 'react';
import { 
    StyleSheet, 
    View, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    KeyboardAvoidingView, 
    Platform, 
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useUpload } from '@/hooks/use-upload';
import { PostService } from '@/services/post-service';
import { useAuthStore } from '@/store/auth-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { X, Image as ImageIcon, Vote, MapPin, Smile, Send, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

export default function CreatePostScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const { upload, isUploading } = useUpload();

    const [content, setContent] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
    const [poll, setPoll] = useState<{ question: string; options: string[] } | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            selectionLimit: 4,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedMedia([...selectedMedia, ...result.assets.map(a => a.uri)]);
        }
    };

    const removeMedia = (index: number) => {
        setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
    };

    const handleCreatePost = async () => {
        if (!content.trim() && selectedMedia.length === 0 && !poll) return;

        setIsPosting(true);
        try {
            const mediaUrls: string[] = [];
            for (const uri of selectedMedia) {
                const url = await upload(uri, 'post_media');
                if (url) mediaUrls.push(url);
            }

            await PostService.createPost({
                content: content.trim(),
                mediaUrls,
                poll: poll ? {
                    ...poll,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                } : undefined,
                status: 'PUBLISHED'
            });

            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create post');
        } finally {
            setIsPosting(false);
        }
    };

    const togglePoll = () => {
        if (poll) {
            setPoll(null);
        } else {
            setPoll({ question: '', options: ['', ''] });
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    headerTitle: 'Create Post',
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                            <X size={24} color="#000" />
                        </TouchableOpacity>
                    ),
                    headerRight: () => (
                        <TouchableOpacity 
                            onPress={handleCreatePost} 
                            disabled={isPosting || isUploading || (!content.trim() && selectedMedia.length === 0 && !poll)}
                            style={[
                                styles.postButton, 
                                (isPosting || isUploading) && styles.postButtonDisabled
                            ]}
                        >
                            {isPosting || isUploading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <ThemedText style={styles.postButtonText}>Post</ThemedText>
                            )}
                        </TouchableOpacity>
                    ),
                }} 
            />

            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.inputRow}>
                        <Image 
                            source={{ uri: user?.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${user?.username}` }} 
                            style={styles.avatar} 
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="What's happening?"
                            multiline
                            value={content}
                            onChangeText={setContent}
                            autoFocus
                        />
                    </View>

                    {selectedMedia.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaContainer}>
                            {selectedMedia.map((uri, index) => (
                                <View key={index} style={styles.mediaWrapper}>
                                    <Image source={{ uri }} style={styles.mediaImage} />
                                    <TouchableOpacity style={styles.removeMediaButton} onPress={() => removeMedia(index)}>
                                        <X size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {poll && (
                        <View style={styles.pollContainer}>
                            <TextInput
                                style={styles.pollQuestion}
                                placeholder="Poll question..."
                                value={poll.question}
                                onChangeText={(text) => setPoll({ ...poll, question: text })}
                            />
                            {poll.options.map((option, index) => (
                                <View key={index} style={styles.pollOptionRow}>
                                    <TextInput
                                        style={styles.pollOptionInput}
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChangeText={(text) => {
                                            const newOptions = [...poll.options];
                                            newOptions[index] = text;
                                            setPoll({ ...poll, options: newOptions });
                                        }}
                                    />
                                </View>
                            ))}
                            {poll.options.length < 4 && (
                                <TouchableOpacity 
                                    style={styles.addOptionButton}
                                    onPress={() => setPoll({ ...poll, options: [...poll.options, ''] })}
                                >
                                    <Plus size={16} color="#0a7ea4" />
                                    <ThemedText style={styles.addOptionText}>Add option</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.toolbar, { paddingBottom: insets.bottom + 10 }]}>
                    <TouchableOpacity style={styles.toolbarButton} onPress={pickImage}>
                        <ImageIcon size={24} color="#0a7ea4" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarButton} onPress={togglePoll}>
                        <Vote size={24} color={poll ? "#0a7ea4" : "#666"} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarButton}>
                        <MapPin size={24} color="#666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarButton}>
                        <Smile size={24} color="#666" />
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
    postButton: {
        backgroundColor: '#0a7ea4',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonDisabled: {
        opacity: 0.5,
    },
    postButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 16,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    input: {
        flex: 1,
        fontSize: 18,
        paddingTop: 8,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    mediaContainer: {
        marginTop: 20,
        flexDirection: 'row',
    },
    mediaWrapper: {
        marginRight: 12,
        position: 'relative',
    },
    mediaImage: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: 12,
    },
    removeMediaButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 4,
    },
    pollContainer: {
        marginTop: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
    },
    pollQuestion: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        paddingBottom: 8,
    },
    pollOptionRow: {
        marginBottom: 8,
    },
    pollOptionInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    addOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    addOptionText: {
        color: '#0a7ea4',
        fontWeight: '600',
    },
    toolbar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#ddd',
        backgroundColor: '#fff',
    },
    toolbarButton: {
        marginRight: 24,
    },
});
