import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const { signIn, loading, error } = useAuth();

   const validateEmail = (email: string) => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   };

   const validatePassword = (password: string) => {
     return password.length >= 6;
   };

   const handleLogin = async () => {
     let isValid = true;
     setEmailError('');
     setPasswordError('');

     if (!email) {
       setEmailError('Email is required');
       isValid = false;
     } else if (!validateEmail(email)) {
       setEmailError('Please enter a valid email address');
       isValid = false;
     }

     if (!password) {
       setPasswordError('Password is required');
       isValid = false;
     } else if (!validatePassword(password)) {
       setPasswordError('Password must be at least 6 characters long');
       isValid = false;
     }

     if (!isValid) return;

     const result = await signIn(email, password);
     if (result.success) {
       // Navigation will be handled automatically by RootNavigator
     } else {
       // Error is already handled by the hook and displayed in UI
     }
   };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      className="flex-1 justify-center px-6"
    >
      <ThemedView className="bg-white/90 dark:bg-gray-800/90 rounded-3xl p-8 mx-4 shadow-2xl">
        <ThemedText className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">Welcome Back</ThemedText>

        <View className="mb-6">
          <View className="mb-4">
            <TextInput
              className={`border-2 rounded-xl px-4 py-4 text-base bg-gray-50 dark:bg-gray-700 text-white shadow-sm ${emailError ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
            {emailError && (
              <View className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 mt-2">
                <ThemedText className="text-red-700 dark:text-red-400 text-sm">{emailError}</ThemedText>
              </View>
            )}
          </View>

          <View className="mb-4">
            <TextInput
              className={`border-2 rounded-xl px-4 py-4 text-base bg-gray-50 dark:bg-gray-700 text-white shadow-sm ${passwordError ? 'border-red-400' : 'border-gray-200 dark:border-gray-600'}`}
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry
              editable={!loading}
            />
            {passwordError && (
              <View className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3 mt-2">
                <ThemedText className="text-red-700 dark:text-red-400 text-sm">{passwordError}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {error && (
          <View className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-4 mb-6">
            <ThemedText className="text-red-700 dark:text-red-400 text-center text-sm">{error}</ThemedText>
          </View>
        )}

        <TouchableOpacity
          className="rounded-xl overflow-hidden shadow-lg"
          onPress={handleLogin}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#9CA3AF', '#6B7280'] : ['#3B82F6', '#1D4ED8']}
            className="py-4 px-6 items-center"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText className="text-white text-lg font-semibold">Sign In</ThemedText>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ThemedView>
    </LinearGradient>
  );
}
