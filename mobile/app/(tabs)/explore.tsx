import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { useExploreFeed, useTrendingHashtags, useRecommendedCreators } from '@/hooks/use-explore';
import { PostCard } from '@/components/post-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, Settings, MoreHorizontal } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

const CATEGORIES = ['For you', 'Trending', 'News', 'Sports', 'Entertainment'];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('For you');
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  // Data fetching
  const {
    data: feedData,
    fetchNextPage: fetchNextFeedPage,
    hasNextPage: hasNextFeedPage,
    isFetchingNextPage: isFetchingNextFeedPage,
    isLoading: isLoadingFeed,
    refetch: refetchFeed,
    isRefetching: isRefetchingFeed
  } = useExploreFeed();

  const { data: trendingData, isLoading: isLoadingTrending } = useTrendingHashtags(4);
  const { data: creatorsData, isLoading: isLoadingCreators } = useRecommendedCreators(5);

  const trendingHashtags = trendingData?.data || [];
  const recommendedCreators = creatorsData?.data || [];
  const posts = useMemo(() => feedData?.pages.flatMap((page) => page.posts || page.data) || [], [feedData]);

  const renderHeader = () => (
    <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
          <SearchIcon size={18} color="#71767b" style={styles.searchIcon} />
          <TextInput
            placeholder="Search communities, people..."
            placeholderTextColor="#71767b"
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.categoryTab, activeCategory === cat && styles.activeTab]}
          >
            <ThemedText style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>
              {cat}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );

  const renderTrendingSection = () => {
    if (isLoadingTrending) return null;
    if (trendingHashtags.length === 0) return null;

    return (
      <View style={styles.trendingContainer}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Trending now</ThemedText>
        {trendingHashtags.map((topic: any, index: number) => (
          <TouchableOpacity
            key={topic.id || index}
            style={styles.trendingItem}
            onPress={() => router.push(`/hashtag/${topic.name.replace('#', '')}`)}
          >
            <View style={styles.trendingTextContainer}>
              <ThemedText style={styles.trendingCategory}>{index + 1} · Trending</ThemedText>
              <ThemedText style={styles.trendingTitle}>{topic.name}</ThemedText>
              <ThemedText style={styles.trendingPosts}>{topic.count || topic.postsCount || '0'} posts</ThemedText>
            </View>
            <MoreHorizontal size={16} color="#71767b" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.showMore}>
          <ThemedText style={{ color: theme.tint }}>Show more</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCreatorsSection = () => {
    if (isLoadingCreators) return null;
    if (recommendedCreators.length === 0) return null;

    return (
      <View style={styles.creatorsContainer}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Suggested Creators</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.creatorsScroll}>
          {recommendedCreators.map((creator: any) => (
            <TouchableOpacity
              key={creator.id}
              style={[styles.creatorCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => router.push(`/profile/${creator.username}`)}
            >
              <Image
                source={{ uri: creator.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${creator.username}` }}
                style={styles.creatorAvatar}
              />
              <ThemedText style={styles.creatorName} numberOfLines={1}>{creator?.user?.name}</ThemedText>
              <ThemedText style={styles.creatorUsername} numberOfLines={1}>@{creator?.user?.username}</ThemedText>
              <TouchableOpacity style={[styles.followButton, { backgroundColor: theme.text }]}>
                <ThemedText style={[styles.followButtonText, { color: theme.background }]}>Follow</ThemedText>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoadingFeed) {
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
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} />}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderTrendingSection()}
            {renderCreatorsSection()}
            <View style={styles.divider} />
          </>
        )}
        onEndReached={() => hasNextFeedPage && fetchNextFeedPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => isFetchingNextFeedPage ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={theme.tint} />
          </View>
        ) : null}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingFeed}
            onRefresh={refetchFeed}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  settingsButton: {
    padding: 4,
  },
  categoryContainer: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1d9bf0',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#71767b',
  },
  activeCategoryText: {
    color: undefined,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trendingContainer: {
    paddingVertical: 12,
  },
  trendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trendingTextContainer: {
    flex: 1,
    gap: 2,
  },
  trendingCategory: {
    fontSize: 13,
    color: '#71767b',
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  trendingPosts: {
    fontSize: 13,
    color: '#71767b',
  },
  showMore: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  creatorsContainer: {
    paddingVertical: 12,
  },
  creatorsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  creatorCard: {
    width: 140,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  creatorUsername: {
    fontSize: 13,
    color: '#71767b',
    marginBottom: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  divider: {
    height: 8,
    backgroundColor: '#16181c',
    marginVertical: 16,
  },
  centerContainer: {
    padding: 60,
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
