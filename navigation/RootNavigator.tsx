import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { StyledText as Text } from '../components/StyledText';

import { AuthStackParamList, AppTabParamList, MainStackParamList } from './types';

import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

import { useAuthStore } from '../store/authStore';
import { supabase } from '../supabaseClient';
import { Colors } from '../constants/colors';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.BACKGROUND,
    primary: Colors.PRIMARY,
    text: Colors.TEXT_PRIMARY,
    border: Colors.BORDER,
  },
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function AppTabsNavigator() {
  return (
    <AppTabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: Colors.SURFACE,
          borderBottomColor: Colors.BORDER,
          borderBottomWidth: 1,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {},
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: Colors.DISABLED,
        tabBarStyle: {
          backgroundColor: Colors.SURFACE,
          borderTopColor: Colors.BORDER,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: React.ComponentProps<typeof Ionicons>['name'];

          if (route.name === 'Home')
            iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search')
            iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Create')
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Profile')
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          else iconName = 'alert-circle';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <AppTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="logo-instagram"
                size={24}
                color={Colors.PRIMARY}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: Colors.PRIMARY,
                  fontSize: 18,
                  fontFamily: 'Poppins_700Bold',
                }}
              >
                FRAMEZ
              </Text>
            </View>
          ),
          headerTitleAlign: 'center',
        }}
      />
      <AppTabs.Screen name="Search" component={SearchScreen} />
      <AppTabs.Screen name="Create" component={CreatePostScreen} />
      <AppTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTintColor: Colors.TEXT_PRIMARY }}
      />
    </AppTabs.Navigator>
  );
}

function MainAppNavigator() {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: Colors.SURFACE },
        headerTintColor: Colors.PRIMARY,
        headerBackTitle: 'Back',
      }}
    >
      <MainStack.Screen
        name="AppTabs"
        component={AppTabsNavigator}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
      <MainStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <MainStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ title: 'Profile' }}
      />
    </MainStack.Navigator>
  );
}

export default function RootNavigator() {
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <NavigationContainer theme={navTheme}>
      {session ? <MainAppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}