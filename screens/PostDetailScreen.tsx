import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Dimensions, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { supabase } from '../supabaseClient';
import { MainScreenProps, Post, Comment, Profile } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { StyledText as Text } from '../components/StyledText';
import { Colors } from '../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyledButton } from '../components/styledButton';

const { width } = Dimensions.get('window');

type PostDetailCardProps = {
  post: Post;
  navigation: MainScreenProps<'PostDetail'>['navigation'];
};

const PostDetailCard: React.FC<PostDetailCardProps> = ({ post, navigation }) => {
  const username = post.profiles?.username || 'A User';
  const avatarUrl = post.profiles?.avatar_url;
  const postDate = new Date(post.created_at).toLocaleString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const session = useAuthStore((state) => state.session);
  const isMyPost = session?.user.id === post.user_id;

  const handleNamePress = () => {
    if (post.user_id === session?.user.id) {
      navigation.navigate('AppTabs', { screen: 'Profile' });
    } else {
      navigation.navigate('UserProfile', { userId: post.user_id });
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const filePath = post.image_url.split('images/').pop();
            if (!filePath) {
              Alert.alert('Error', 'Could not parse file path to delete image.');
              return;
            }
            const { error: storageError } = await supabase.storage.from('images').remove([filePath]);
            const { error: dbError } = await supabase.from('posts').delete().match({ id: post.id });
            if (dbError || storageError) {
              Alert.alert('Error', 'Failed to delete post. Check console for details.');
            } else {
              Alert.alert('Success', 'Post deleted.');
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <View>
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

      <View style={styles.textContainer}>
        <TouchableOpacity onPress={handleNamePress}>
          <Text weight="bold" style={styles.usernameText}>{username}</Text>
        </TouchableOpacity>
        <Text style={styles.postText}>{post.text_content}</Text>

        <Text style={styles.timestamp}>{postDate}</Text>

        {isMyPost && (
          <View style={styles.deleteButton}>
            <StyledButton title="Delete Post" color="danger" onPress={handleDelete} />
          </View>
        )}
      </View>
      <View style={styles.separator} />
    </View>
  );
};

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => {
  const username = comment.profiles?.username || 'A User';
  const avatarUrl = comment.profiles?.avatar_url;
  return (
    <View style={styles.commentContainer}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.commentAvatar} />
      ) : (
        <Ionicons name="person-circle" size={32} color={Colors.TEXT_SECONDARY} />
      )}
      <View style={styles.commentTextContainer}>
        <Text weight="bold" style={styles.usernameText}>{username}</Text>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
};

const PostDetailScreen: React.FC<MainScreenProps<'PostDetail'>> = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const session = useAuthStore((state) => state.session);

  const fetchData = async () => {
    setLoading(true);
    const [postRes, commentsRes] = await Promise.all([
      supabase.rpc('get_posts_with_details').eq('id', postId).single(),
      supabase.rpc('get_comments_for_post', { post_id_input: postId })
    ]);

    if (postRes.error) {
      Alert.alert('Error', 'Failed to fetch post details.');
    } else {
      setPost(postRes.data as Post);
    }
    if (commentsRes.data) {
      setComments(commentsRes.data as Comment[]);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [postId]));

  const handlePostComment = async () => {
    if (!session || newComment.trim() === '') return;
    setPostingComment(true);

    const newCommentData = {
      post_id: postId,
      user_id: session.user.id,
      content: newComment.trim(),
    };

    const { data, error } = await supabase
      .from('comments')
      .insert(newCommentData)
      .select()
      .single();
    
    if (error) {
      Alert.alert('Error', 'Failed to post comment.');
      setPostingComment(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      Alert.alert('Error', 'Could not fetch your profile for the comment.');
      setPostingComment(false);
      return;
    }
    
    const fullNewComment: Comment = {
      ...data,
      profiles: profileData
    };

    setComments(currentComments => [fullNewComment, ...currentComments]);
    setNewComment('');
    Keyboard.dismiss();
    setPostingComment(false);
  };

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }
  if (!post) {
    return <View style={[styles.container, styles.center]}><Text style={{ color: Colors.TEXT_PRIMARY }}>Post not found.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={60}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={<PostDetailCard post={post} navigation={navigation} />}
          renderItem={({ item }) => <CommentItem comment={item} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No comments yet.</Text>
            </View>
          }
        />
        <SafeAreaView style={styles.commentInputSafeArea} edges={['bottom']}>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.TEXT_SECONDARY}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity onPress={handlePostComment} disabled={postingComment}>
              <Text style={[styles.postButton, postingComment && styles.postButtonDisabled]}>Post</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.SURFACE },
  center: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatarContainer: { marginRight: 10, width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  usernameText: { fontFamily: 'Poppins_700Bold', color: Colors.TEXT_PRIMARY },
  image: { width: width, height: width, resizeMode: 'cover' },
  textContainer: { padding: 12 },
  postText: { fontSize: 14, lineHeight: 20, marginTop: 4, color: Colors.TEXT_PRIMARY },
  timestamp: { fontSize: 12, color: Colors.TEXT_SECONDARY, marginTop: 8 },
  deleteButton: { marginTop: 20, width: '60%', alignSelf: 'center' },
  separator: { height: 1, backgroundColor: Colors.BORDER, marginHorizontal: 12 },
  commentContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: Colors.BACKGROUND,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentText: {
    color: Colors.TEXT_PRIMARY,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 16,
    marginTop: 20,
    paddingBottom: 20,
  },
  commentInputSafeArea: {
    backgroundColor: Colors.SURFACE,
    borderTopWidth: 1,
    borderTopColor: Colors.BORDER,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.BACKGROUND,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.TEXT_PRIMARY,
    fontFamily: 'Poppins_400Regular',
    marginRight: 10,
  },
  postButton: {
    fontFamily: 'Poppins_700Bold',
    color: Colors.PRIMARY,
    fontSize: 16,
  },
  postButtonDisabled: {
    color: Colors.DISABLED,
  }
});

export default PostDetailScreen;