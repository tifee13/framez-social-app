import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Keyboard, Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { SearchScreenNavigationProp, Profile } from '../navigation/types';
import { StyledText as Text } from '../components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const RECENT_SEARCHES_KEY = '@recent_searches';

const SearchScreen: React.FC<SearchScreenNavigationProp> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [recentSearches, setRecentSearches] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const session = useAuthStore((state) => state.session);

  const loadRecents = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      setRecentSearches(jsonValue != null ? JSON.parse(jsonValue) : []);
    } catch (e) {
      console.error('Failed to load recent searches.', e);
    }
  };
  
  const saveRecents = async (profiles: Profile[]) => {
    try {
      const jsonValue = JSON.stringify(profiles);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, jsonValue);
    } catch (e) {
      console.error('Failed to save recent searches.', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecents();
    }, [])
  );

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching:', error);
      } else {
        setResults(data as Profile[]);
      }
      setLoading(false);
    };

    const searchTimeout = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleUserPress = (profile: Profile) => {
    Keyboard.dismiss();
    setQuery(''); // <-- THIS IS THE FIX
    
    const newRecents = [profile, ...recentSearches.filter(p => p.id !== profile.id)];
    if (newRecents.length > 15) newRecents.pop();
    
    setRecentSearches(newRecents);
    saveRecents(newRecents);

    if (profile.id === session?.user.id) {
      navigation.navigate('AppTabs', { screen: 'Profile' });
    } else {
      navigation.navigate('UserProfile', { userId: profile.id });
    }
  };

  const handleRemoveRecent = (profileId: string) => {
    const newRecents = recentSearches.filter(p => p.id !== profileId);
    setRecentSearches(newRecents);
    saveRecents(newRecents);
  };
  
  const handleClearAll = () => {
    Alert.alert("Clear recent searches?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: () => {
          setRecentSearches([]);
          saveRecents([]);
        } 
      }
    ]);
  };

  const renderRecentSearchItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleUserPress(item)}>
      <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      <View style={styles.resultTextContainer}>
        <Text style={styles.username}>{item.username}</Text>
        {item.bio && <Text style={styles.bioText} numberOfLines={1}>{item.bio}</Text>}
      </View>
      <TouchableOpacity onPress={() => handleRemoveRecent(item.id)} style={styles.closeButton}>
        <Ionicons name="close" size={20} color={Colors.TEXT_SECONDARY} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchResultItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleUserPress(item)}>
      <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      <View style={styles.resultTextContainer}>
        <Text style={styles.username}>{item.username}</Text>
        {item.bio && <Text style={styles.bioText} numberOfLines={1}>{item.bio}</Text>}
      </View>
    </TouchableOpacity>
  );

  const renderListContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 20 }} />;
    }

    if (query.trim().length < 2) {
      return (
        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            recentSearches.length > 0 ? (
              <View style={styles.listHeader}>
                <Text weight="bold" style={styles.listTitle}>Recent</Text>
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearButton}>Clear All</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Search for friends by their username.</Text>
            </View>
          }
          renderItem={renderRecentSearchItem}
        />
      );
    }
    
    return (
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found for "{query}"</Text>
          </View>
        }
        renderItem={renderSearchResultItem}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search" size={20} color={Colors.TEXT_SECONDARY} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search for users..."
          placeholderTextColor={Colors.TEXT_SECONDARY}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color={Colors.TEXT_SECONDARY} />
          </TouchableOpacity>
        )}
      </View>
      {renderListContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.SURFACE,
    margin: 16,
    borderRadius: 12,
  },
  searchIcon: {
    paddingLeft: 15,
  },
  clearIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.TEXT_PRIMARY,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: Colors.TEXT_SECONDARY,
    fontSize: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
  },
  listTitle: {
    color: Colors.TEXT_PRIMARY,
    fontSize: 18,
  },
  clearButton: {
    color: Colors.PRIMARY,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 15,
    backgroundColor: Colors.SURFACE,
  },
  username: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.TEXT_PRIMARY,
  },
  bioText: {
    fontSize: 14,
    color: Colors.TEXT_SECONDARY,
  },
  closeButton: {
    padding: 5,
  }
});

export default SearchScreen;