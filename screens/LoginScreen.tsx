import React, { useState } from 'react';
import {
  Alert,
  View,
  TextInput,
  Button,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { AuthScreenProps } from '../navigation/types';
import { authStyles } from '../AuthStyles';
import { StyledText as Text } from '../components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const LoginScreen: React.FC<AuthScreenProps<'Login'>> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required.';
    } else if (!email.includes('@') || !email.includes('.')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function signInWithEmail() {
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);

    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={authStyles.container}
    >
      <View style={authStyles.logoContainer}>
        <Ionicons name="logo-instagram" size={40} color={Colors.PRIMARY} />
        <Text style={authStyles.title}>FRAMEZ</Text>
      </View>

      <TextInput
        style={[
          authStyles.input,
          focusedInput === 'email' && authStyles.inputFocused,
        ]}
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

      <TextInput
        style={[
          authStyles.input,
          focusedInput === 'password' && authStyles.inputFocused,
        ]}
        onFocus={() => {
          setFocusedInput('password');
          clearError('password');
        }}
        onBlur={() => setFocusedInput(null)}
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        placeholder="Password"
        placeholderTextColor={Colors.TEXT_SECONDARY}
        autoCapitalize="none"
      />
      {errors.password && (
        <Text style={authStyles.errorText}>{errors.password}</Text>
      )}

      <View style={authStyles.buttonContainer}>
        <Button
          title={loading ? 'Loading...' : 'SIGN IN'}
          onPress={signInWithEmail}
          disabled={loading}
          color={Colors.PRIMARY}
        />
      </View>

      <View style={authStyles.buttonContainer}>
        <Button
          title="CREATE ACCOUNT"
          onPress={() => navigation.navigate('SignUp')}
          color={Colors.DISABLED}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;