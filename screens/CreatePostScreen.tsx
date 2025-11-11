import React, { useState } from 'react';
import {
  View,
  Button,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import { useAuthStore } from '../store/authStore';
import { AppScreenProps } from '../navigation/types';
import { decode } from 'base64-arraybuffer';
import { authStyles } from '../AuthStyles';
import { StyledText as Text } from '../components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const CreatePostScreen: React.FC<AppScreenProps<'Create'>> = ({ navigation }) => {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const session = useAuthStore((state) => state.session);

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!image) newErrors.image = 'Please pick an image.';
    if (!textContent) newErrors.text = 'Please add a caption.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    clearError('image');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
      base64: true,
      allowsMultipleSelection: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const handleCreatePost = async () => {
    if (!validate()) return;
    if (!session || !image || !image.base64) return;

    setLoading(true);
    try {
      const filePath = `${session.user.id}/${new Date().getTime()}.png`;
      const contentType = image.mimeType || 'image/png';

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, decode(image.base64), { contentType });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: session.user.id,
        text_content: textContent,
        image_url: publicUrl,
      });

      if (insertError) throw insertError;

      Alert.alert('Success', 'Your post has been created!');
      setTextContent('');
      setImage(null);
      navigation.navigate('Home');
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error creating post', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = image && textContent;
  const isDisabled = loading || !isFormValid;
  const buttonColor = isFormValid || loading ? Colors.PRIMARY : Colors.DISABLED;
  const buttonTitle = loading ? 'Publishing...' : 'Publish Post';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={authStyles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 20 }}>
        <TextInput
          style={[authStyles.input, authStyles.bioInput, isFocused && authStyles.inputFocused]}
          onFocus={() => {
            setIsFocused(true);
            clearError('text');
          }}
          onBlur={() => setIsFocused(false)}
          placeholder="What's on your mind?"
          placeholderTextColor={Colors.TEXT_SECONDARY}
          value={textContent}
          onChangeText={setTextContent}
          multiline
        />
        {errors.text && <Text style={authStyles.errorText}>{errors.text}</Text>}

        <View style={authStyles.imagePreviewContainer}>
          <TouchableOpacity
            onPress={pickImage}
            style={[
              authStyles.imagePlaceholder,
              image && { backgroundColor: Colors.SURFACE, borderWidth: 0, borderStyle: 'solid' },
            ]}
          >
            {image ? (
              <Image source={{ uri: image.uri }} style={authStyles.imagePreview} />
            ) : (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="image-outline" size={60} color={Colors.TEXT_SECONDARY} />
                <Text style={{ ...authStyles.avatarPlaceholder, color: Colors.TEXT_SECONDARY, marginTop: 10 }}>
                  Pick an Image
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {errors.image && (
          <Text style={[authStyles.errorText, { textAlign: 'center' }]}>{errors.image}</Text>
        )}

        <View style={authStyles.buttonContainer}>
          <Button title={buttonTitle} onPress={handleCreatePost} disabled={isDisabled} color={buttonColor} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreatePostScreen;