import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// A custom storage adapter for Supabase using Expo Secure Store
const ExpoSecureStoreAdapter = {
  setItem: (key, value) => {
    return SecureStore.setItemAsync(key, value);
  },
  getItem: (key) => {
    return SecureStore.getItemAsync(key);
  },
  removeItem: (key) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Your Supabase URL and Anon Key
const supabaseUrl = 'https://zkpozzsekaeuhaozczjv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcG96enNla2FldWhhb3pjemp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTE0MTEsImV4cCI6MjA3ODE4NzQxMX0.4n0vpm5FIB7X0LSN0G8zo0lNQBpEs69Rp3noJo4diqU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter, // Use the custom adapter
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});