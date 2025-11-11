import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Keyboard } from 'react-native';
import { supabase } from '../supabaseClient';
import { SearchScreenNavigationProp, Profile } from '../navigation/types';
import { StyledText as Text } from '../components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuthStore } from '../store/authStore';

const SearchScreen: React.FC<SearchScreenNavigationProp> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const session = useAuthStore((state) => state.session);

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
        .ilike('username', `%${query}%`) // ilike is case-insensitive
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
    }, 300); // Debounce: wait 300ms after user stops typing

    return () => clearTimeout(searchTimeout); // Clear timeout on cleanup
  }, [query]);

  const handleUserPress = (userId: string) => {
    Keyboard.dismiss(); // Hide the keyboard
    if (userId === session?.user.id) {
      navigation.navigate('AppTabs', { screen: 'Profile' });
    } else {
      navigation.navigate('UserProfile', { userId: userId });
    }
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
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.PRIMARY} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            query.length > 1 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found for "{query}"</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Search for friends by their username.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => handleUserPress(item.id)}>
              <Image 
                source={{ uri: item.avatar_url }} 
                style={styles.avatar} 
              />
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>
          )}
        />
      )}
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
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.BORDER,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  username: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.TEXT_PRIMARY,
  },
});

export default SearchScreen;