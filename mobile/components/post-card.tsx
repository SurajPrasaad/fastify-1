import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Share, Alert, Dimensions } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import {
    Heart,
    MessageCircle,
    Repeat2,
    Share2,
    Bookmark,
    MoreHorizontal,
    Check,
    BadgeCheck
} from 'lucide-react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { PostService } from '@/services/post-service';

const { width } = Dimensions.get('window');

export function PostCard({ post }: { post: any }) {
    const [votedOption, setVotedOption] = useState<string | null>(null);

    const handleLike = () => {
        // Implement via hook
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: post.content,
                url: post.mediaUrls?.[0] || '',
            });
        } catch (error) {
            console.error('Error sharing post:', error);
        }
    };

    const handleVote = async (pollId: string, optionId: string) => {
        if (votedOption) return;
        try {
            await PostService.votePoll(pollId, optionId);
            setVotedOption(optionId);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to vote");
        }
    };

    const hasPoll = post.poll && post.poll.options;
    const totalVotes = hasPoll ? post.poll.options.reduce((acc: number, opt: any) => acc + (opt.votesCount || 0), 0) : 0;

    // Detect if content has code (very simplified)
    const hasCode = post.content?.includes('<?php') || post.content?.includes('```');

    return (
        <Animated.View entering={FadeInUp.delay(100)} style={styles.container}>
            <ThemedView style={styles.card}>
                <View style={styles.mainContent}>
                    <TouchableOpacity style={styles.avatarContainer}>
                        {post.user?.avatarUrl ? (
                            <Image source={{ uri: post.user.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <ThemedText style={styles.avatarText}>{post.user?.name?.[0] || '?'}</ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.contentContainer}>
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.name}>
                                    {post.user?.name || 'Unknown'}
                                </ThemedText>
                                {post.user?.isVerified !== false && (
                                    <BadgeCheck size={16} color="#1d9bf0" fill="#1d9bf033" />
                                )}
                                <ThemedText style={styles.username} numberOfLines={1}>
                                    @{post.user?.username || 'unknown'}
                                </ThemedText>
                                <ThemedText style={styles.dot}>·</ThemedText>
                                <ThemedText style={styles.time}>
                                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: false })}
                                </ThemedText>
                            </View>
                            <TouchableOpacity style={styles.moreIcon}>
                                <MoreHorizontal size={18} color="#71767b" />
                            </TouchableOpacity>
                        </View>

                        <ThemedText style={styles.content}>
                            {post.content}
                        </ThemedText>

                        {/* Code Block Mockup */}
                        {hasCode && (
                            <View style={styles.codeBlock}>
                                <View style={styles.codeHeader}>
                                    <View style={styles.codeDots}>
                                        <View style={[styles.codeDot, { backgroundColor: '#ff5f56' }]} />
                                        <View style={[styles.codeDot, { backgroundColor: '#ffbd2e' }]} />
                                        <View style={[styles.codeDot, { backgroundColor: '#27c93f' }]} />
                                    </View>
                                    <ThemedText style={styles.codeLang}>PHP</ThemedText>
                                </View>
                                <View style={styles.codeContent}>
                                    <ThemedText style={styles.codeText}>
                                        {`<?php\nfunction greet($name) {\n    return "Hello, " . $name . "!";\n}`}
                                    </ThemedText>
                                </View>
                            </View>
                        )}

                        {/* Poll Section */}
                        {hasPoll && (
                            <View style={styles.pollContainer}>
                                <ThemedText style={styles.pollQuestion}>{post.poll.question}</ThemedText>
                                {post.poll.options.map((option: any) => {
                                    const percentage = totalVotes === 0 ? 0 : Math.round(((option.votesCount || 0) / totalVotes) * 100);
                                    const isVoted = votedOption === option.id;

                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[styles.pollOption, isVoted && styles.votedOption]}
                                            onPress={() => handleVote(post.poll.id, option.id)}
                                            disabled={!!votedOption}
                                        >
                                            <View style={[styles.pollProgress, { width: `${percentage}%` }]} />
                                            <View style={styles.pollOptionContent}>
                                                <ThemedText style={styles.pollOptionText}>{option.text}</ThemedText>
                                                {votedOption && (
                                                    <ThemedText style={styles.pollPercentage}>{percentage}%</ThemedText>
                                                )}
                                                {isVoted && <Check size={16} color="#1d9bf0" />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                                <ThemedText style={styles.pollFooter}>{totalVotes} votes</ThemedText>
                            </View>
                        )}

                        {/* Media Grid */}
                        {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <View style={[
                                styles.mediaGrid,
                                post.mediaUrls.length === 1 ? styles.oneMedia : styles.multiMedia
                            ]}>
                                {post.mediaUrls.slice(0, 4).map((url: string, index: number) => (
                                    <Image
                                        key={index}
                                        source={{ uri: url }}
                                        style={[
                                            styles.mediaItem,
                                            post.mediaUrls.length === 1 && styles.singleMediaItem,
                                            post.mediaUrls.length === 2 && styles.doubleMediaItem,
                                            post.mediaUrls.length >= 3 && styles.quadMediaItem
                                        ]}
                                        resizeMode="cover"
                                    />
                                ))}
                            </View>
                        )}

                        <View style={styles.actions}>
                            <ActionButton
                                icon={Heart}
                                count={post.stats?.likeCount || 0}
                                active={post.isLiked}
                                activeColor="#f91880"
                            />
                            <ActionButton
                                icon={MessageCircle}
                                count={post.stats?.commentCount || 0}
                            />
                            <ActionButton
                                icon={Repeat2}
                                count={post.stats?.repostCount || 0}
                                active={post.isReposted}
                                activeColor="#00ba7c"
                            />
                            <ActionButton
                                icon={Share2}
                                onPress={handleShare}
                            />
                        </View>
                    </View>
                </View>
            </ThemedView>
        </Animated.View>
    );
}

function ActionButton({ icon: Icon, count, active, activeColor = "#1d9bf0", onPress }: any) {
    return (
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Icon
                size={18}
                color={active ? activeColor : "#71767b"}
                strokeWidth={1.5}
            />
            {count !== undefined && count > 0 && (
                <ThemedText style={[styles.actionCount, active && { color: activeColor }]}>
                    {count}
                </ThemedText>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#2f3336',
    },
    card: {
        padding: 12,
        paddingLeft: 16,
    },
    mainContent: {
        flexDirection: 'row',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1d9bf01a',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1d9bf0',
    },
    contentContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    name: {
        fontSize: 15,
        fontWeight: '800',
    },
    username: {
        fontSize: 15,
        color: '#71767b',
    },
    dot: {
        color: '#71767b',
        fontSize: 15,
    },
    time: {
        fontSize: 15,
        color: '#71767b',
    },
    moreIcon: {
        padding: 4,
    },
    content: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 10,
    },
    codeBlock: {
        backgroundColor: '#0d1117',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#30363d',
    },
    codeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#161b22',
        borderBottomWidth: 1,
        borderBottomColor: '#30363d',
    },
    codeDots: {
        flexDirection: 'row',
        gap: 6,
    },
    codeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    codeLang: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#8b949e',
    },
    codeContent: {
        padding: 12,
    },
    codeText: {
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#e6edf3',
    },
    pollContainer: {
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2f3336',
    },
    pollQuestion: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    pollOption: {
        height: 36,
        borderRadius: 8,
        backgroundColor: '#2f333644',
        marginBottom: 8,
        overflow: 'hidden',
        justifyContent: 'center',
        position: 'relative',
    },
    votedOption: {
        backgroundColor: '#1d9bf022',
    },
    pollProgress: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#1d9bf022',
    },
    pollOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        zIndex: 1,
    },
    pollOptionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    pollPercentage: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#71767b',
    },
    pollFooter: {
        fontSize: 13,
        color: '#71767b',
        marginTop: 4,
    },
    mediaGrid: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2f3336',
    },
    oneMedia: {
        height: 200,
    },
    multiMedia: {
        height: 240,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
    },
    mediaItem: {
        backgroundColor: '#2f3336',
    },
    singleMediaItem: {
        width: '100%',
        height: '100%',
    },
    doubleMediaItem: {
        width: '49.5%',
        height: '100%',
    },
    quadMediaItem: {
        width: '49.5%',
        height: '49.5%',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingRight: 40,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        minWidth: 50,
    },
    actionCount: {
        fontSize: 13,
        color: '#71767b',
    },
});
