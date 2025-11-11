import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Create: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  AppTabs: NavigatorScreenParams<AppTabParamList>;
  PostDetail: { postId: string };
  EditProfile: undefined;
  UserProfile: { userId: string };
};

export type MainScreenProps<T extends keyof MainStackParamList> =
  NativeStackScreenProps<MainStackParamList, T>;
  
export type AppScreenProps<T extends keyof AppTabParamList> =
  BottomTabScreenProps<AppTabParamList, T>;

export type ProfileScreenNavigationProp = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Profile'>,
  NativeStackScreenProps<MainStackParamList>
>;

export type HomeScreenNavigationProp = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Home'>,
  NativeStackScreenProps<MainStackParamList>
>;

export type SearchScreenNavigationProp = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Search'>,
  NativeStackScreenProps<MainStackParamList>
>;

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  bio?: string;
}

export interface Post {
  id: string;
  user_id: string;
  text_content: string;
  image_url: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  } | null;
  like_count: number;
  liked_by_user: boolean;
  bookmarked_by_user: boolean;
  comment_count: number;
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string;
  } | null;
}