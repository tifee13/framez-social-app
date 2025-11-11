import 'react-native-url-polyfill/auto';
import React from 'react';
import RootNavigator from './navigation/RootNavigator';
import { 
  useFonts, 
  Poppins_400Regular, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return <RootNavigator />;
}