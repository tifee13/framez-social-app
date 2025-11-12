import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Alert, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import { supabase } from '../supabaseClient';
import { MainScreenProps, Post, Profile } from '../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PostGrid from '../components/PostGrid';
import { StyledText as Text } from '../components/StyledText';
import { Colors } from '../constants/colors';

const UserProfileScreen: React.FC<MainScreenProps<'UserProfile'>> = ({ route, navigation }) => {
  const { userId } = route.params;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);

        const [profileRes, postsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        if (profileRes.error || postsRes.error) {
          Alert.alert('Error', 'Could not fetch this user\'s profile.');
          navigation.goBack();
          return;
        }

        if (profileRes.data) setProfile(profileRes.data as Profile);
        if (postsRes.data) setPosts(postsRes.data as Post[]);
        
        setLoading(false);
      };

      fetchData();
    }, [userId, navigation])
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <Ionicons name="person-circle" size={80} color={Colors.TEXT_SECONDARY} />
      )}
      <Text weight="bold" style={styles.usernameText}>{profile?.username || 'Loading...'}</Text>
      {profile?.bio && (
        <Text style={styles.bioText}>{profile.bio}</Text>
      )}
    </View>
  );

  if (loading) {
    return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={styles.gridHeader}>
        <Text weight="bold" style={styles.gridHeaderText}>All Posts</Text>
      </View>
      <PostGrid posts={posts} emptyMessage="This user has not posted anything yet." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.BACKGROUND,
  },
  headerContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  usernameText: {
    fontSize: 20,
    color: Colors.TEXT_PRIMARY,
  },
  bioText: {
    fontSize: 14,
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: 5,
  },
  gridHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  gridHeaderText: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 16,
  },
});

export default UserProfileScreen;