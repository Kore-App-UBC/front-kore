import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAuthStore } from '../state/authStore';

export default function ProfileScreen() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-red-500">Not authenticated</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6 text-gray-800">Profile</Text>

        <View className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xl font-semibold text-gray-800">{user.name}</Text>
            <Text className="text-gray-600 capitalize">{user.role}</Text>
          </View>

          <View className="space-y-4">
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Email</Text>
              <Text className="text-gray-800 font-medium">{user.email}</Text>
            </View>

            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600">Role</Text>
              <Text className="text-gray-800 font-medium capitalize">{user.role}</Text>
            </View>

            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">User ID</Text>
              <Text className="text-gray-800 font-medium">{user.id}</Text>
            </View>
          </View>
        </View>

        <View className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold mb-2 text-gray-800">Account Information</Text>
          <Text className="text-gray-600 text-sm">
            As a physiotherapist, you can manage your assigned patients, review exercise submissions,
            and provide feedback to help your patients progress in their rehabilitation.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}