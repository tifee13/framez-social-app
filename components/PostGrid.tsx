import React from 'react';
import { FlatList, Image, StyleSheet, Dimensions, View, TouchableOpacity } from 'react-native';
import { Post } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { StyledText as Text } from './StyledText';
import { Colors } from '../constants/colors';

interface PostGridProps {
  posts: Post[];
  emptyMessage: string;
}

const numColumns = 3;
const size = Dimensions.get('window').width / numColumns;

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const PostGrid: React.FC<PostGridProps> = ({ posts, emptyMessage }) => {
  const navigation = useNavigation<NavigationProp>();

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
          activeOpacity={0.7}
        >
          <Image source={{ uri: item.image_url }} style={styles.postImage} />
        </TouchableOpacity>
      )}
      numColumns={numColumns}
      style={styles.grid}
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    backgroundColor: Colors.BACKGROUND,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.BACKGROUND,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
  },
  itemContainer: {
    width: size,
    height: size,
  },
  postImage: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.BACKGROUND,
  },
});

export default PostGrid;