import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Image, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { supabase } from '../supabaseClient';
import { HomeScreenNavigationProp, Post, Profile } from '../navigation/types';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { StyledText as Text } from '../components/StyledText';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

const PostCard: React.FC<{ 
  post: Post, 
  onLikeToggle: (postId: string, liked: boolean) => void,
  onBookmarkToggle: (postId: string, bookmarked: boolean) => void
}> = ({ post, onLikeToggle, onBookmarkToggle }) => {
  const username = post.profiles?.username || 'A User';
  const avatarUrl = post.profiles?.avatar_url;
  const postDate = new Date(post.created_at).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  
  const navigation = useNavigation<HomeScreenNavigationProp['navigation']>();
  const session = useAuthStore((state) => state.session);

  const handleLike = () => onLikeToggle(post.id, post.liked_by_user);
  const handleBookmark = () => onBookmarkToggle(post.id, post.bookmarked_by_user);

  const handleNamePress = () => {
    if (post.user_id === session?.user.id) {
      navigation.navigate('AppTabs', { screen: 'Profile' });
    } else {
      navigation.navigate('UserProfile', { userId: post.user_id });
    }
  };
  
  const handleCommentPress = () => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  return (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={32} color={Colors.TEXT_SECONDARY} />
          )}
        </View>
        <TouchableOpacity onPress={handleNamePress}>
          <Text weight="bold" style={styles.usernameText}>{username}</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: post.image_url }} style={styles.image} />

      <View style={styles.postFooter}>
        <View style={styles.iconContainer}>
          <TouchableOpacity onPress={handleLike} style={styles.iconButton}>
            <Ionicons
              name={post.liked_by_user ? 'heart' : 'heart-outline'}
              size={28}
              style={post.liked_by_user ? styles.likedIcon : styles.unlikedIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCommentPress} style={styles.iconButton}>
            <Ionicons
              name="chatbubble-outline"
              size={26}
              style={styles.unlikedIcon}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={post.bookmarked_by_user ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={post.bookmarked_by_user ? Colors.PRIMARY : Colors.TEXT_PRIMARY}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.textContainer}>
        <Text weight="bold" style={styles.likesText}>
          {post.like_count} {post.like_count === 1 ? 'like' : 'likes'}
        </Text>

        <View style={styles.captionContainer}>
          <TouchableOpacity onPress={handleNamePress}>
            <Text weight="bold" style={styles.usernameText}>{username}</Text>
          </TouchableOpacity>
          <Text style={styles.captionText}>{post.text_content}</Text>
        </View>

        {post.comment_count > 0 && (
          <TouchableOpacity onPress={handleCommentPress}>
            <Text style={styles.timestamp}>
              {post.comment_count === 1 ? 'View 1 comment' : `View all ${post.comment_count} comments`}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>{postDate}</Text>
      </View>
    </View>
  );
};

const HomeHeader: React.FC<{ 
  stories: Profile[];
  userProfile: Profile | null;
  navigation: HomeScreenNavigationProp['navigation'];
}> = ({ stories, userProfile, navigation }) => {

  const goToCreatePost = () => {
    navigation.navigate('AppTabs', { screen: 'Create' });
  };

  const goToUserProfile = (userId: string) => {
    navigation.navigate('UserProfile', { userId });
  };
  
  const goToMyProfile = () => {
    navigation.navigate('AppTabs', { screen: 'Profile' });
  };

  return (
    <View style={styles.headerContainer}>
      <View>
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.storyItem} onPress={() => goToUserProfile(item.id)}>
              <View style={styles.storyBorder}>
                <Image source={{ uri: item.avatar_url }} style={styles.storyAvatar} />
              </View>
              <Text style={styles.storyUsername} numberOfLines={1}>{item.username}</Text>
            </TouchableOpacity>
          )}
          ListHeaderComponent={
            <TouchableOpacity style={styles.storyItem} onPress={goToMyProfile}>
              <View style={styles.myStoryContainer}>
                {userProfile ? (
                  <Image source={{ uri: userProfile.avatar_url }} style={styles.storyAvatar} />
                ) : (
                  <Ionicons name="person-circle" size={60} color={Colors.TEXT_SECONDARY} />
                )}
                <View style={styles.addStoryIcon}>
                  <Ionicons name="add-circle" size={20} color={Colors.PRIMARY} />
                </View>
              </View>
              <Text style={styles.storyUsername}>Your Story</Text>
            </TouchableOpacity>
          }
        />
      </View>

      <TouchableOpacity style={styles.createPostContainer} onPress={goToCreatePost}>
        {userProfile ? (
          <Image source={{ uri: userProfile.avatar_url }} style={styles.createPostAvatar} />
        ) : (
          <Ionicons name="person-circle" size={40} color={Colors.TEXT_SECONDARY} />
        )}
        <Text style={styles.createPostText}>What's on your mind?</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen: React.FC<HomeScreenNavigationProp> = ({ navigation }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Profile[]>([]);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const session = useAuthStore((state) => state.session);

  const fetchAllData = async () => {
    if (!session) return;
    if (!loading) setLoading(true);

    const [postsRes, storiesRes, profileRes] = await Promise.all([
      supabase.rpc('get_posts_with_details'),
      supabase.from('profiles').select('id, username, avatar_url').neq('id', session.user.id).limit(10),
      supabase.from('profiles').select('id, username, avatar_url').eq('id', session.user.id).single()
    ]);
    
    if (postsRes.error) {
      Alert.alert('Error', 'Failed to fetch posts');
    } else {
      setPosts(postsRes.data as Post[]);
    }
    
    if (storiesRes.data) {
      setStories(storiesRes.data as Profile[]);
    }
    
    if (profileRes.data) {
      setUserProfile(profileRes.data as Profile);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { 
    fetchAllData();
  }, [session]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleLikeToggle = async (postId: string, isCurrentlyLiked: boolean) => {
    if (!session) return;
    const userId = session.user.id;
    setPosts(current =>
      current.map(p =>
        p.id === postId
          ? { ...p, liked_by_user: !isCurrentlyLiked, like_count: isCurrentlyLiked ? p.like_count - 1 : p.like_count + 1 }
          : p
      )
    );
    if (isCurrentlyLiked) {
      await supabase.from('likes').delete().match({ user_id: userId, post_id: postId });
    } else {
      await supabase.from('likes').insert({ user_id: userId, post_id: postId });
    }
  };

  const handleBookmarkToggle = async (postId: string, isCurrentlyBookmarked: boolean) => {
    if (!session) return;
    const userId = session.user.id;
    setPosts(current =>
      current.map(p =>
        p.id === postId ? { ...p, bookmarked_by_user: !isCurrentlyBookmarked } : p
      )
    );
    if (isCurrentlyBookmarked) {
      await supabase.from('saved_posts').delete().match({ user_id: userId, post_id: postId });
    } else {
      await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId });
    }
  };

  if (loading && !refreshing) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <HomeHeader 
          stories={stories}
          userProfile={userProfile}
          navigation={navigation} 
        />
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onLikeToggle={handleLikeToggle}
          onBookmarkToggle={handleBookmarkToggle}
        />
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.PRIMARY} />
      }
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.BACKGROUND },
  headerContainer: {
    backgroundColor: Colors.SURFACE,
    borderBottomColor: Colors.BORDER,
    borderBottomWidth: 1,
  },
  storiesContainer: {
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  storyBorder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myStoryContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.BACKGROUND,
  },
  addStoryIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.SURFACE,
    borderRadius: 12,
  },
  storyUsername: {
    fontSize: 12,
    color: Colors.TEXT_PRIMARY,
    marginTop: 4,
    maxWidth: 70,
    textAlign: 'center',
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.BACKGROUND,
  },
  createPostText: {
    marginLeft: 15,
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
  },
  postContainer: {
    backgroundColor: Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatarContainer: { marginRight: 10, width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%', backgroundColor: Colors.BACKGROUND },
  usernameText: { color: Colors.TEXT_PRIMARY, marginRight: 5 },
  image: { width: width, height: width, resizeMode: 'cover' },
  postFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  iconContainer: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    marginRight: 16,
  },
  likedIcon: { color: Colors.DANGER },
  unlikedIcon: { color: Colors.TEXT_PRIMARY },
  textContainer: { paddingHorizontal: 12, paddingBottom: 12 },
  likesText: { fontFamily: 'Poppins_700Bold', marginBottom: 5, color: Colors.TEXT_PRIMARY },
  captionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  captionText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.TEXT_PRIMARY,
    flex: 1,
  },
  timestamp: { fontSize: 12, color: Colors.TEXT_SECONDARY, marginTop: 8 },
});

export default HomeScreen;