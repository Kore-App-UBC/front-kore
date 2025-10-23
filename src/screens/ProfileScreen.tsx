import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import LogoutButton from '../components/LogoutButton';
import { ThemedText } from '../components/themed-text';
import { ThemedView } from '../components/themed-view';
import { useAuthStore } from '../state/authStore';

export default function ProfileScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  if (!isAuthenticated || !user) {
    return (
      <ThemedView className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-red-500">Not authenticated</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView className="flex-1">
      <ThemedView className="p-4">
        <ThemedText type="title" className="mb-6">Profile</ThemedText>

        <View className="bg-transparent p-6 rounded-lg shadow-sm border border-gray-200">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4">
              <ThemedText className="text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText className="text-xl font-semibold">{user.name}</ThemedText>
            <ThemedText className="text-gray-600 capitalize">{user.role}</ThemedText>
          </View>

          <View className="space-y-4">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <ThemedText className="text-gray-600">Email</ThemedText>
              <ThemedText className="font-medium">{user.email}</ThemedText>
            </View>

            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <ThemedText className="text-gray-600">Role</ThemedText>
              <ThemedText className="font-medium capitalize">{user.role}</ThemedText>
            </View>

            <View className="flex-row justify-between py-2">
              <ThemedText className="text-gray-600">User ID</ThemedText>
              <ThemedText className="font-medium">{user.id}</ThemedText>
            </View>
          </View>
        </View>

        <View className="mt-6 bg-transparent p-4 rounded-lg shadow-sm border border-gray-200">
          <ThemedText className="text-lg font-semibold mb-2">Account Information</ThemedText>
          <ThemedText className="text-gray-600 text-sm">
            As a physiotherapist, you can manage your assigned patients, review exercise submissions,
            and provide feedback to help your patients progress in their rehabilitation.
          </ThemedText>
        </View>

        <View className="mt-6">
          <LogoutButton onLogout={() => router.replace('/(auth)/login')} />
        </View>
      </ThemedView>
    </ScrollView>
  );
}