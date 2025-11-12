import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { ProfileScreenNavigationProp, Post, Profile } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TabView, SceneMap, TabBar, TabBarProps } from 'react-native-tab-view';
import PostGrid from '../components/PostGrid';
import { StyledText as CustomText } from '../components/StyledText';
import { Colors } from '../constants/colors';
import { StyledButton } from '../components/styledButton';

const MyPostsRoute: React.FC<{ posts: Post[] }> = ({ posts }) => (
  <PostGrid posts={posts} emptyMessage="You haven't posted anything yet." />
);

const SavedPostsRoute: React.FC<{ posts: Post[] }> = ({ posts }) => (
  <PostGrid posts={posts} emptyMessage="You haven't saved any posts yet." />
);

const LikedPostsRoute: React.FC<{ posts: Post[] }> = ({ posts }) => (
  <PostGrid posts={posts} emptyMessage="You haven't liked any posts yet." />
);

type TabRoute = {
  key: string;
  title: string;
};

const ProfileScreen: React.FC<ProfileScreenNavigationProp> = ({ navigation }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [index, setIndex] = useState(0);
  const [routes] = useState<TabRoute[]>([
    { key: 'myPosts', title: 'My Posts' },
    { key: 'likedPosts', title: 'Liked' },
    { key: 'savedPosts', title: 'Saved' },
  ]);

  const session = useAuthStore((state) => state.session);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        if (!session) return;
        setLoading(true);

        const [profileRes, myPostsRes, savedPostsRes, likedPostsRes] = await Promise.all([
          supabase.from('profiles').select('*, bio').eq('id', session.user.id).single(),
          supabase
            .from('posts')
            .select('*, profiles!inner(*)')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }),
          supabase.rpc('get_my_saved_posts'),
          supabase.rpc('get_my_liked_posts'),
        ]);

        if (profileRes.data) setProfile(profileRes.data as Profile);
        if (myPostsRes.data) setMyPosts(myPostsRes.data as Post[]);
        if (savedPostsRes.data) setSavedPosts(savedPostsRes.data as Post[]);
        if (likedPostsRes.data) setLikedPosts(likedPostsRes.data as Post[]);

        setLoading(false);
      };

      fetchData();
    }, [session])
  );

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const renderScene = SceneMap({
    myPosts: () => <MyPostsRoute posts={myPosts} />,
    likedPosts: () => <LikedPostsRoute posts={likedPosts} />,
    savedPosts: () => <SavedPostsRoute posts={savedPosts} />,
  });

  const renderTabBar = (props: TabBarProps<TabRoute>) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: Colors.PRIMARY }}
      style={{ backgroundColor: Colors.SURFACE }}
      renderIcon={({ route, focused, color }) => {
        let iconName: React.ComponentProps<typeof Ionicons>['name'];
        if (route.key === 'myPosts') iconName = focused ? 'grid' : 'grid-outline';
        else if (route.key === 'savedPosts') iconName = focused ? 'bookmark' : 'bookmark-outline';
        else iconName = focused ? 'heart' : 'heart-outline';
        return <Ionicons name={iconName} size={24} color={color} />;
      }}
      renderLabel={() => null}
      activeColor={Colors.PRIMARY}
      inactiveColor={Colors.DISABLED}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <Ionicons name="person-circle" size={80} color={Colors.TEXT_SECONDARY} />
      )}

      <CustomText weight="bold" style={styles.usernameText}>
        {profile?.username || 'Loading...'}
      </CustomText>

      {profile?.bio && <CustomText style={styles.bioText}>{profile.bio}</CustomText>}

      <CustomText style={styles.emailText}>{session?.user.email}</CustomText>

      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <StyledButton title="Edit Profile" onPress={handleEditProfile} color="primary" />
        </View>
        <View style={styles.buttonWrapper}>
          <StyledButton title="Log Out" onPress={handleSignOut} color="danger" />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BACKGROUND },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerContainer: { padding: 20, alignItems: 'center', backgroundColor: Colors.SURFACE },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  usernameText: { fontSize: 20, color: Colors.TEXT_PRIMARY },
  bioText: { fontSize: 14, color: Colors.TEXT_PRIMARY, textAlign: 'center', marginTop: 5 },
  emailText: { fontSize: 14, color: Colors.TEXT_SECONDARY, marginTop: 5, marginBottom: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  buttonWrapper: { flex: 1, marginHorizontal: 5 },
});

export default ProfileScreen;