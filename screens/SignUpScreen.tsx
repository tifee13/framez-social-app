import React, { useState } from 'react';
import {
  Alert,
  View,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { AuthScreenProps } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { authStyles } from '../AuthStyles';
import { StyledText as Text } from '../components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { StyledButton } from '../components/styledButton';

const SignUpScreen: React.FC<AuthScreenProps<'SignUp'>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<{ uri: string; base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!avatar) newErrors.avatar = 'Please pick an Image.';
    if (!username) {
      newErrors.username = 'Username is required.';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }
    if (!bio) newErrors.bio = 'Bio is required.';
    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Invalid email format.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickAvatar = async () => {
    clearError('avatar');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions for this.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setAvatar({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      });
    }
  };

  async function signUpWithEmail() {
    if (!validate()) return;
    setLoading(true);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      Alert.alert(authError.message);
      setLoading(false);
      return;
    }
    if (!authData.user) {
      Alert.alert('Error', 'Failed to create user.');
      setLoading(false);
      return;
    }
    try {
      const filePath = `${authData.user.id}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(avatar!.base64), { contentType: 'image/png' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      const publicUrl = urlData.publicUrl;
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        username,
        avatar_url: publicUrl,
        bio,
      });
      if (profileError) throw profileError;
    } catch (error) {
      if (error instanceof Error) Alert.alert('Error creating profile', error.message);
      console.error('Profile creation failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[authStyles.container, { justifyContent: 'flex-start', paddingTop: 60 }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={authStyles.logoContainer}>
          <Ionicons name="logo-instagram" size={40} color={Colors.PRIMARY} />
          <Text style={authStyles.title}>FRAMEZ</Text>
        </View>

        <TouchableOpacity onPress={pickAvatar} style={authStyles.avatarPicker}>
          {avatar ? (
            <Image source={{ uri: avatar.uri }} style={authStyles.avatar} />
          ) : (
            <Text style={authStyles.avatarPlaceholder}>Pick Image</Text>
          )}
        </TouchableOpacity>
        {errors.avatar && (
          <Text style={[authStyles.errorText, { textAlign: 'center' }]}>{errors.avatar}</Text>
        )}

        <Text style={authStyles.label}>Username</Text>
        <TextInput
          style={[authStyles.input, focusedInput === 'username' && authStyles.inputFocused]}
          onFocus={() => {
            setFocusedInput('username');
            clearError('username');
          }}
          onBlur={() => setFocusedInput(null)}
          onChangeText={setUsername}
          value={username}
          placeholder="Username"
          placeholderTextColor={Colors.TEXT_SECONDARY}
          autoCapitalize="none"
        />
        {errors.username && <Text style={authStyles.errorText}>{errors.username}</Text>}

        <Text style={authStyles.label}>Bio</Text>
        <TextInput
          style={[authStyles.input, authStyles.bioInput, focusedInput === 'bio' && authStyles.inputFocused]}
          onFocus={() => {
            setFocusedInput('bio');
            clearError('bio');
          }}
          onBlur={() => setFocusedInput(null)}
          onChangeText={setBio}
          value={bio}
          placeholder="Your Bio"
          placeholderTextColor={Colors.TEXT_SECONDARY}
          multiline
          maxLength={150}
        />
        {errors.bio && <Text style={authStyles.errorText}>{errors.bio}</Text>}

        <Text style={authStyles.label}>Email</Text>
        <TextInput
          style={[authStyles.input, focusedInput === 'email' && authStyles.inputFocused]}
          onFocus={() => {
            setFocusedInput('email');
            clearError('email');
          }}
          onBlur={() => setFocusedInput(null)}
          onChangeText={setEmail}
          value={email}
          placeholder="Email"
          placeholderTextColor={Colors.TEXT_SECONDARY}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {errors.email && <Text style={authStyles.errorText}>{errors.email}</Text>}

        <Text style={authStyles.label}>Password</Text>
        <TextInput
          style={[authStyles.input, focusedInput === 'password' && authStyles.inputFocused]}
          onFocus={() => {
            setFocusedInput('password');
            clearError('password');
          }}
          onBlur={() => setFocusedInput(null)}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password (min. 6 characters)"
          placeholderTextColor={Colors.TEXT_SECONDARY}
          autoCapitalize="none"
        />
        {errors.password && <Text style={authStyles.errorText}>{errors.password}</Text>}

        <View style={authStyles.buttonContainer}>
          <StyledButton
            title="SIGN UP"
            onPress={signUpWithEmail}
            loading={loading}
            color="primary"
          />
        </View>

        <View style={authStyles.buttonContainer}>
          <StyledButton
            title="LOGIN"
            onPress={() => navigation.navigate('Login')}
            color="disabled"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUpScreen;