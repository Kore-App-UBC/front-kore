import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import LogoutButton from '@/src/components/LogoutButton';
import { useFloatingTabOptions } from '@/src/components/useFloatingTabOptions';
import { useAuthStore } from '../../src/state/authStore';

export default function PhysioTabLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'PHYSIOTHERAPIST') {
    return <Redirect href="/(auth)/login" />;
  }

  const headerRight = () => (
    <LogoutButton />
  );

  const { screenOptions } = useFloatingTabOptions(headerRight);

  const renderIcon = (
    focusedName: React.ComponentProps<typeof Ionicons>['name'],
    outlineName: React.ComponentProps<typeof Ionicons>['name'],
  ) => ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons
      name={focused ? focusedName : outlineName}
      size={22}
      color={color}
      style={{ marginBottom: -4 }}
    />
  );

  return (
    <Tabs
      screenOptions={{...screenOptions }}
    >
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: renderIcon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="submission-queue"
        options={{
          title: 'Submission Queue',
          tabBarIcon: renderIcon('file-tray-full', 'file-tray-full-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: renderIcon('person-circle', 'person-circle-outline'),
        }}
      />
      <Tabs.Screen
        name="submission-detail"
        options={{ title: 'Submission Details', href: null }}
      />
    </Tabs>
  );
}