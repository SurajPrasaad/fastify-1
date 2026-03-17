import React, { useState } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, ActivityIndicator, RefreshControl, Image, TextInput } from 'react-native';
import { useInfiniteFeed } from '@/hooks/use-infinite-feed';
import { PostCard } from '@/components/post-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth-store';
import { 
  Image as ImageIcon, 
  ListTodo, 
  Smile, 
  MapPin, 
  Sparkles,
  Search,
  Settings
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function FeedScreen() {
  const [activeTab, setActiveTab] = useState<'FOR_YOU' | 'FOLLOWING'>('FOR_YOU');
  const [postContent, setPostContent] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
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
  } = useInfiniteFeed(activeTab);

  const posts = data?.pages.flatMap((page: any) => page.data) || [];

  const renderHeader = () => (
    <ThemedView style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarContainer}>
          <Image 
            source={{ uri: user?.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${user?.username || 'anon'}` }} 
            style={styles.headerAvatar} 
          />
        </TouchableOpacity>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'FOR_YOU' && styles.activeTab]}
            onPress={() => setActiveTab('FOR_YOU')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'FOR_YOU' && styles.activeTabText]}>For You</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'FOLLOWING' && styles.activeTab]}
            onPress={() => setActiveTab('FOLLOWING')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'FOLLOWING' && styles.activeTabText]}>Following</ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.headerIcon}>
           <Settings size={22} color={theme.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  const renderComposer = () => (
    <View style={styles.composerContainer}>
      <View style={styles.composerRow}>
        <Image 
          source={{ uri: user?.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${user?.username || 'anon'}` }} 
          style={styles.composerAvatar} 
        />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="What's happening?"
          placeholderTextColor="#71767b"
          value={postContent}
          onChangeText={setPostContent}
          multiline
        />
      </View>
      
      <View style={styles.composerActions}>
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.actionIcon}>
            <ImageIcon size={20} color={theme.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <ListTodo size={20} color={theme.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Smile size={20} color={theme.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <MapPin size={20} color={theme.tint} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Sparkles size={20} color={theme.tint} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.postButton, !postContent.trim() && styles.postButtonDisabled]}
          disabled={!postContent.trim()}
        >
          <ThemedText style={styles.postButtonText}>Post</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      );
    }
    return (
      <View style={styles.centerContainer}>
        <ThemedText style={{ color: '#71767b' }}>No posts found</ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {renderHeader()}
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item.id}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderComposer}
        ListFooterComponent={() => isFetchingNextPage ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={theme.tint} />
          </View>
        ) : null}
        ListEmptyComponent={renderEmpty}
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
    borderBottomColor: '#2f3336',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  tab: {
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1d9bf0',
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#71767b',
  },
  activeTabText: {
    color: undefined, // Uses default theme text color
  },
  composerContainer: {
    padding: 16,
    paddingBottom: 0,
  },
  composerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  composerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  input: {
    flex: 1,
    fontSize: 18,
    paddingTop: 8,
    minHeight: 50,
  },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingLeft: 52,
    paddingBottom: 12,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionIcon: {
    padding: 8,
    borderRadius: 20,
  },
  postButton: {
    backgroundColor: '#1d9bf0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#1d9bf088',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2f3336',
    width: '120%',
    marginLeft: -20,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

