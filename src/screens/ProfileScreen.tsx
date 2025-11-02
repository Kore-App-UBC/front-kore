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
      <ThemedView variant="transparent" className="flex-1 justify-center items-center">
        <ThemedText className="text-lg text-danger">Not authenticated</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView className="flex-1 pb-32">
      <ThemedView variant="transparent" className="p-6">
        <ThemedText type="title" className="mb-6">Profile</ThemedText>

        <ThemedView variant="surfaceStrong" className="p-6 rounded-3xl">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-accent rounded-full items-center justify-center mb-4">
              <ThemedText className="text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <ThemedText className="text-xl font-semibold">{user.name}</ThemedText>
            <ThemedText className="text-muted capitalize">{user.role}</ThemedText>
          </View>

          <View className="gap-4">
            <View className="flex-row justify-between py-2 border-b border-outline">
              <ThemedText className="text-muted">Email</ThemedText>
              <ThemedText className="font-medium">{user.email}</ThemedText>
            </View>

            <View className="flex-row justify-between py-2 border-b border-outline">
              <ThemedText className="text-muted">Role</ThemedText>
              <ThemedText className="font-medium capitalize">{user.role}</ThemedText>
            </View>

            <View className="flex-row justify-between py-2">
              <ThemedText className="text-muted">User ID</ThemedText>
              <ThemedText className="font-medium">{user.id}</ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView variant="surface" className="mt-6 p-5 rounded-3xl">
          <ThemedText className="text-lg font-semibold mb-2">Account Information</ThemedText>
          <ThemedText className="text-muted text-sm">
            As a physiotherapist, you can manage your assigned patients, review exercise submissions,
            and provide feedback to help your patients progress in their rehabilitation.
          </ThemedText>
        </ThemedView>

        <View className="mt-6">
          <LogoutButton onLogout={() => router.replace('/(auth)/login')} />
        </View>
      </ThemedView>
    </ScrollView>
  );
}