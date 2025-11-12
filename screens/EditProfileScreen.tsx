import React, { useState, useEffect } from 'react';
import { 
  View, StyleSheet, TextInput, Button, Alert, 
  Image, TouchableOpacity, ScrollView, ActivityIndicator,
  Platform, KeyboardAvoidingView 
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { MainScreenProps } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import { authStyles } from '../AuthStyles';
import { StyledText as Text } from '../components/StyledText';
import { Colors } from '../constants/colors';
import { StyledButton } from '../components/styledButton';

const EditProfileScreen: React.FC<MainScreenProps<'EditProfile'>> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('username, bio, avatar_url')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          Alert.alert('Error', 'Could not fetch your profile.');
        } else if (data) {
          setUsername(data.username || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || null);
        }
        setLoading(false);
      });
  }, [session]);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setNewAvatar(result.assets[0]);
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const clearError = (field: string) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username) {
      newErrors.username = 'Username is required.';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validate()) return;
    if (!session) return;
    
    setLoading(true);
    try {
      let updatedAvatarUrl = avatarUrl;

      if (newAvatar && newAvatar.base64) {
        const filePath = `${session.user.id}/${new Date().getTime()}.png`;
        const { data, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(newAvatar.base64), { contentType: 'image/png' });
          
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
        updatedAvatarUrl = urlData.publicUrl;
      }

      const updates = {
        id: session.user.id,
        username: username,
        bio: bio,
        avatar_url: updatedAvatarUrl,
        updated_at: new Date(),
      };

      const { error: profileError } = await supabase.from('profiles').upsert(updates);
      if (profileError) {
        if (profileError.message.includes('duplicate key value violates unique constraint "profiles_username_key"')) {
          setErrors({ username: 'This username is already taken.' });
        } else {
          throw profileError;
        }
      } else {
        Alert.alert('Success', 'Profile updated!');
        navigation.goBack();
      }

    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={[authStyles.container, {justifyContent: 'center'}]}><ActivityIndicator size="large" color={Colors.PRIMARY} /></View>;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={authStyles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
        
        <View style={authStyles.avatarPickerContainer}>
          <TouchableOpacity onPress={pickAvatar} style={authStyles.avatarPicker}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={authStyles.avatar} />
            ) : (
              <Ionicons name="person-circle" size={100} color={Colors.TEXT_SECONDARY} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickAvatar}>
            <Text style={{ ...authStyles.avatarPlaceholder, color: Colors.PRIMARY, marginTop: 10 }}>
              Change Image
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={authStyles.label}>Username</Text>
        <TextInput
          style={[
            authStyles.input,
            focusedInput === 'username' && authStyles.inputFocused
          ]}
          onFocus={() => { setFocusedInput('username'); clearError('username'); }}
          onBlur={() => setFocusedInput(null)}
          onChangeText={setUsername}
          value={username}
          placeholder="Your username"
          autoCapitalize={'none'}
        />
        {errors.username && <Text style={authStyles.errorText}>{errors.username}</Text>}
        
        <Text style={authStyles.label}>Bio</Text>
        <TextInput
          style={[
            authStyles.input,
            authStyles.bioInput,
            focusedInput === 'bio' && authStyles.inputFocused
          ]}
          onFocus={() => setFocusedInput('bio')}
          onBlur={() => setFocusedInput(null)}
          onChangeText={setBio}
          value={bio}
          placeholder="Tell us about yourself..."
          autoCapitalize={'sentences'}
          multiline
          maxLength={150}
        />
        
        <View style={authStyles.buttonContainer}>
          <StyledButton
            title="Save Changes"
            onPress={handleUpdateProfile}
            loading={loading}
            color="primary"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;