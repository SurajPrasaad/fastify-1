import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Linking } from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { BadgeCheck, Phone, Video, MapPin, Link as LinkIcon, Calendar } from 'lucide-react-native';
import { useSocial } from '@/hooks/use-user';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ProfileHeaderProps {
    profile: {
        id: string;
        username: string;
        displayName: string;
        bio: string;
        location?: string;
        website?: string;
        joinDate: string;
        followers: number;
        following: number;
        posts: number;
        isVerified: boolean;
        avatarUrl: string;
        coverUrl: string;
        isFollowing: boolean;
        isSelf: boolean;
        techStack?: string[];
    };
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
    const { follow, unfollow, isFollowing, isUnfollowing } = useSocial(profile.id, profile.username);
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleFollowToggle = () => {
        if (profile.isFollowing) {
            unfollow();
        } else {
            follow();
        }
    };

    const openWebsite = () => {
        if (profile.website) {
            Linking.openURL(profile.website);
        }
    };

    return (
        <ThemedView style={styles.container}>
            {/* Cover Photo */}
            <View style={[styles.coverContainer, { backgroundColor: theme.card }]}>
                {profile.coverUrl ? (
                    <Image source={{ uri: profile.coverUrl }} style={styles.coverImage} />
                ) : (
                    <View style={styles.coverPlaceholder} />
                )}
            </View>

            <View style={styles.profileSection}>
                {/* Avatar and Action Buttons */}
                <View style={styles.avatarRow}>
                    <View style={[styles.avatarContainer, { borderColor: theme.background, backgroundColor: theme.background }]}>
                        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                    </View>

                    <View style={styles.actionButtons}>
                        {profile.isSelf ? (
                            <TouchableOpacity style={[styles.editButton, { borderColor: theme.border }]}>
                                <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={[styles.iconButton, { borderColor: theme.border }]}>
                                    <Phone size={18} color={theme.text} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iconButton, { borderColor: theme.border }]}>
                                    <Video size={18} color={theme.text} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.followButton,
                                        profile.isFollowing ? [styles.followingButton, { borderColor: theme.border }] : { backgroundColor: theme.text }
                                    ]}
                                    onPress={handleFollowToggle}
                                    disabled={isFollowing || isUnfollowing}
                                >
                                    <ThemedText style={[
                                        styles.followButtonText,
                                        profile.isFollowing ? { color: theme.text } : { color: theme.background }
                                    ]}>
                                        {profile.isFollowing ? 'Following' : 'Follow'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>

                {/* Profile Details */}
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <ThemedText type="title" style={styles.displayName}>{profile.displayName}</ThemedText>
                        {profile.isVerified && (
                             <BadgeCheck size={20} color="#1d9bf0" fill="#1d9bf033" />
                        )}
                    </View>
                    <ThemedText style={styles.username}>@{profile.username}</ThemedText>

                    {profile.bio ? (
                        <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
                    ) : null}

                    {/* Tech Stack */}
                    {profile.techStack && profile.techStack.length > 0 && (
                        <View style={styles.tagContainer}>
                            {profile.techStack.map((tech) => (
                                <View key={tech} style={[styles.tag, { backgroundColor: theme.tint + '1a', borderColor: theme.tint + '33' }]}>
                                    <ThemedText style={[styles.tagText, { color: theme.tint }]}>#{tech}</ThemedText>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Metadata */}
                    <View style={styles.metaContainer}>
                        {profile.location && (
                            <View style={styles.metaItem}>
                                <MapPin size={14} color="#71767b" />
                                <ThemedText style={styles.metaText}>{profile.location}</ThemedText>
                            </View>
                        )}
                        {profile.website && (
                            <TouchableOpacity style={styles.metaItem} onPress={openWebsite}>
                                <LinkIcon size={14} color={theme.tint} />
                                <ThemedText style={[styles.metaText, { color: theme.tint }]}>
                                    {profile.website.replace(/^https?:\/\//, "")}
                                </ThemedText>
                            </TouchableOpacity>
                        )}
                        <View style={styles.metaItem}>
                            <Calendar size={14} color="#71767b" />
                            <ThemedText style={styles.metaText}>Joined {profile.joinDate}</ThemedText>
                        </View>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsContainer}>
                        <TouchableOpacity style={styles.statItem}>
                            <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>{profile.following}</ThemedText>
                            <ThemedText style={styles.statLabel}>Following</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.statItem}>
                            <ThemedText type="defaultSemiBold" style={{ color: theme.text }}>{profile.followers}</ThemedText>
                            <ThemedText style={styles.statLabel}>Followers</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
    },
    coverContainer: {
        height: 120,
        width: '100%',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    coverPlaceholder: {
        flex: 1,
        backgroundColor: '#1d9bf01a',
    },
    profileSection: {
        paddingHorizontal: 16,
    },
    avatarRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: -40,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 4,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    editButtonText: {
        fontWeight: '800',
        fontSize: 14,
    },
    followButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
    },
    followButtonText: {
        fontWeight: '800',
        fontSize: 14,
    },
    infoContainer: {
        marginTop: 12,
        gap: 2,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    displayName: {
        fontSize: 22,
        fontWeight: '800',
    },
    username: {
        fontSize: 15,
        color: '#71767b',
    },
    bio: {
        marginTop: 12,
        fontSize: 15,
        lineHeight: 20,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 12,
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    metaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 16,
        rowGap: 8,
        marginTop: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        color: '#71767b',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 16,
        paddingBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#71767b',
    },
});
